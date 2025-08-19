import { Client } from "../clients"
import { RuntimeEvent } from "../clients/event_client"
import ClientError from "../error"
import { Encodable, HasTxDispatchIndex } from "../interface"
import {
  TransactionPaymentApi_queryFeeDetails,
  TransactionPaymentCallApi_queryCallFeeDetails,
} from "../rpc/runtime_api"
import {
  AccountId,
  BlockRef,
  BlockState,
  FeeDetails,
  H256,
  Mortality,
  RefinedOptions,
  SignatureOptions,
  TxRef,
} from "../types/metadata"
import { BN, Extrinsic, GenericExtrinsic, KeyringPair } from "../types/polkadot"
import { Encoder } from "../types/scale"
import { Duration, Hex, mergeArrays, sleep } from "../utils"

export class SubmittableTransaction {
  private client: Client
  public call: GenericExtrinsic

  constructor(client: Client, call: GenericExtrinsic) {
    this.client = client
    this.call = call
  }

  // Sign and/or Submit
  public sign(signer: KeyringPair, options: RefinedOptions): Extrinsic {
    return this.call.sign(signer, options)
  }

  async signAndSubmit(signer: KeyringPair, options: SignatureOptions): Promise<SubmittedTransaction | ClientError> {
    const accountId = AccountId.fromSS58(signer.address)
    const refinedOptions = await refineOptions(this.client, accountId, options)
    if (refinedOptions instanceof ClientError) return refinedOptions

    const signedTransaction = this.sign(signer, refinedOptions)
    const hash = await this.client.submit(signedTransaction)
    if (hash instanceof ClientError) return hash

    return new SubmittedTransaction(this.client, hash, accountId, refinedOptions)
  }

  static from(client: Client, T: Encodable & HasTxDispatchIndex): SubmittableTransaction {
    const dispatchIndex = T.dispatchIndex()
    const call = mergeArrays([Encoder.u8(dispatchIndex[0]), Encoder.u8(dispatchIndex[1]), T.encode()])
    const wrappedCall = client.api.registry.createType("Call", call)
    const extrinsic = client.api.registry.createType("Extrinsic", { method: wrappedCall }) as GenericExtrinsic
    return new SubmittableTransaction(client, extrinsic)
  }

  async estimateCallFees(at?: H256 | string | undefined): Promise<FeeDetails | ClientError> {
    const blockHash = at?.toString()
    const call = Hex.encode(this.call.method.toU8a())
    return TransactionPaymentCallApi_queryCallFeeDetails(this.client, call, blockHash)
  }

  async estimateExtrinsicFees(
    signer: KeyringPair,
    options: SignatureOptions,
    at?: H256 | string | undefined,
  ): Promise<FeeDetails | ClientError> {
    const accountId = AccountId.fromSS58(signer.address)
    const refinedOptions = await refineOptions(this.client, accountId, options)
    if (refinedOptions instanceof ClientError) return refinedOptions

    const tx = this.sign(signer, refinedOptions)
    const blockHash = at?.toString()
    return TransactionPaymentApi_queryFeeDetails(this.client, tx.toHex(), blockHash)
  }
}

async function refineOptions(
  client: Client,
  accountId: AccountId,
  rawOptions: SignatureOptions,
): Promise<RefinedOptions | ClientError> {
  let mortality: Mortality
  if (rawOptions.mortality != null) {
    mortality = rawOptions.mortality
  } else {
    const ref = await client.finalized.blockRef()
    if (ref instanceof ClientError) return ref

    const period = 32
    mortality = { blockHash: ref.hash, blockHeight: ref.height, period } satisfies Mortality
  }
  const blockHash = mortality.blockHash.toHex()
  const tip = rawOptions.tip ?? new BN("0")
  const app_id = rawOptions.app_id ?? 0
  const genesisHash = client.genesisHash().toHex()
  const runtimeVersion = client.runtimeVersion()
  const era = client.api.registry.createType("ExtrinsicEra", {
    current: mortality.blockHeight,
    period: mortality.period,
  })

  let nonce: number
  if (rawOptions.nonce != undefined) {
    nonce = rawOptions.nonce
  } else {
    const result = await client.nonce(accountId)
    if (result instanceof ClientError) return result

    nonce = result
  }

  return { app_id, blockHash, genesisHash, mortality, nonce, runtimeVersion, tip, era } satisfies RefinedOptions
}

export class SubmittedTransaction {
  private client: Client
  public txHash: H256
  public accountId: AccountId
  public options: RefinedOptions

  constructor(client: Client, txHash: H256, accountId: AccountId, options: RefinedOptions) {
    this.client = client
    this.txHash = txHash
    this.accountId = accountId
    this.options = options
  }

  async receipt(useBestBlock: boolean): Promise<TransactionReceipt | null | ClientError> {
    return await transactionReceipt(
      this.client,
      this.txHash,
      this.options.nonce,
      this.accountId,
      this.options.mortality,
      useBestBlock,
    )
  }
}

export class TransactionReceipt {
  private client: Client
  public blockRef: BlockRef
  public txRef: TxRef

  constructor(client: Client, blockRef: BlockRef, txRef: TxRef) {
    this.client = client
    this.blockRef = blockRef
    this.txRef = txRef
  }

  async blockState(): Promise<BlockState | ClientError> {
    return await this.client.blockState(this.blockRef)
  }

  async txEvents(): Promise<RuntimeEvent[] | ClientError> {
    const client = this.client.eventClient()
    const events = await client.transactionEvents(this.blockRef.hash, this.txRef.index)
    if (events instanceof ClientError) return events
    if (events == null) return new ClientError("Failed to find events")

    return events
  }
}

export async function transactionReceipt(
  client: Client,
  txHash: H256,
  nonce: number,
  accountId: AccountId,
  mortality: Mortality,
  useBestBlock: boolean,
): Promise<TransactionReceipt | null | ClientError> {
  const blockRef = await findCorrectBlockRef(client, nonce, accountId, mortality, useBestBlock)
  if (blockRef instanceof ClientError) return blockRef
  if (blockRef == null) return null

  const blockClient = client.blockClient()
  const transaction = await blockClient.transaction(blockRef.hash, txHash, "None")
  if (transaction instanceof ClientError) return transaction
  if (transaction == null) return null

  const txRef = { hash: txHash, index: transaction.tx_index }
  return new TransactionReceipt(client, blockRef, txRef)
}

async function findCorrectBlockRef(
  client: Client,
  nonce: number,
  accountId: AccountId,
  mortality: Mortality,
  _useBestBlock: boolean,
): Promise<BlockRef | null | ClientError> {
  const mortalityEnds = mortality.blockHeight + mortality.period
  let nextBlockHeight = (mortality.blockHeight += 1)

  while (nextBlockHeight <= mortalityEnds) {
    const ref = await client.finalized.blockRef()
    if (ref instanceof ClientError) return ref

    if (nextBlockHeight > ref.height) {
      await sleep(Duration.fromSecs(3))
      continue
    }

    let blockHash: H256
    if (nextBlockHeight == ref.height) {
      blockHash = ref.hash
    } else {
      const hash = await client.blockHash(nextBlockHeight, true, true)
      if (hash instanceof ClientError) return hash
      if (hash == null) return new ClientError("Failed to fetch blockHash")

      blockHash = hash
    }

    const stateNonce = await client.blockNonce(accountId, blockHash)
    if (stateNonce instanceof ClientError) return stateNonce

    if (stateNonce > nonce) {
      return { hash: blockHash, height: nextBlockHeight }
    }

    nextBlockHeight += 1
  }

  return null
}
