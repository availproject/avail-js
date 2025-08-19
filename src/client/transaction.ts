import { Client } from "./clients"
import {
  AccountId,
  H256,
  TransactionLocation,
  KeyringPair,
  BN,
  Mortality,
  SignatureOptions,
  RefinedOptions,
  GeneralError,
  HasTxDispatchIndex,
  GenericExtrinsic,
  Extrinsic,
  Encodable,
  Encoder,
  Utils,
  Hex,
  OS,
  Duration,
} from "../core"
import { RuntimeAPI } from "./index"
import { BlockState, FeeDetails } from "../core/types"
import { Rpc, BlockRef, TxRef } from "./../."
import { RuntimeEvent } from "./clients/event_client"

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

  async signAndSubmit(signer: KeyringPair, options: SignatureOptions): Promise<SubmittedTransaction | GeneralError> {
    const accountId = AccountId.fromSS58(signer.address)
    const refinedOptions = await refineOptions(this.client, accountId, options)
    if (refinedOptions instanceof GeneralError) return refinedOptions

    const signedTransaction = this.sign(signer, refinedOptions)
    const hash = await this.client.submit(signedTransaction)
    if (hash instanceof GeneralError) return hash

    return new SubmittedTransaction(this.client, hash, accountId, refinedOptions)
  }

  static from(client: Client, T: Encodable & HasTxDispatchIndex): SubmittableTransaction {
    const dispatchIndex = T.dispatchIndex()
    const call = Utils.mergeArrays([Encoder.u8(dispatchIndex[0]), Encoder.u8(dispatchIndex[1]), T.encode()])
    const wrappedCall = client.api.registry.createType("Call", call)
    const extrinsic = client.api.registry.createType("Extrinsic", { method: wrappedCall }) as GenericExtrinsic
    return new SubmittableTransaction(client, extrinsic)
  }

  async estimateCallFees(at?: H256 | string | undefined): Promise<FeeDetails | GeneralError> {
    const blockHash = at?.toString()
    const call = Hex.encode(this.call.method.toU8a())
    return RuntimeAPI.TransactionPaymentCallApi_queryCallFeeDetails(this.client, call, blockHash)
  }

  async estimateExtrinsicFees(
    signer: KeyringPair,
    options: SignatureOptions,
    at?: H256 | string | undefined,
  ): Promise<FeeDetails | GeneralError> {
    const accountId = AccountId.fromSS58(signer.address)
    const refinedOptions = await refineOptions(this.client, accountId, options)
    if (refinedOptions instanceof GeneralError) return refinedOptions

    const tx = this.sign(signer, refinedOptions)
    const blockHash = at?.toString()
    return RuntimeAPI.TransactionPaymentApi_queryFeeDetails(this.client, tx.toHex(), blockHash)
  }
}

async function refineOptions(
  client: Client,
  accountId: AccountId,
  rawOptions: SignatureOptions,
): Promise<RefinedOptions | GeneralError> {
  let mortality: Mortality
  if (rawOptions.mortality != null) {
    mortality = rawOptions.mortality
  } else {
    const ref = await client.finalized.blockRef()
    if (ref instanceof GeneralError) return ref

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
    if (result instanceof GeneralError) return result

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

  async receipt(useBestBlock: boolean): Promise<TransactionReceipt | null | GeneralError> {
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

  async blockState(): Promise<BlockState | GeneralError> {
    return await this.client.blockState(this.blockRef)
  }

  async txEvents(): Promise<RuntimeEvent[] | GeneralError> {
    const client = this.client.eventClient()
    const events = await client.transactionEvents(this.blockRef.hash, this.txRef.index)
    if (events instanceof GeneralError) return events
    if (events == null) return new GeneralError("Failed to find events")

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
): Promise<TransactionReceipt | null | GeneralError> {
  const blockRef = await findCorrectBlockRef(client, nonce, accountId, mortality, useBestBlock)
  if (blockRef instanceof GeneralError) return blockRef
  if (blockRef == null) return null

  const blockClient = client.blockClient()
  const transaction = await blockClient.transaction(blockRef.hash, txHash, "None")
  if (transaction instanceof GeneralError) return transaction
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
): Promise<BlockRef | null | GeneralError> {
  const mortalityEnds = mortality.blockHeight + mortality.period
  let nextBlockHeight = (mortality.blockHeight += 1)

  while (nextBlockHeight <= mortalityEnds) {
    const ref = await client.finalized.blockRef()
    if (ref instanceof GeneralError) return ref

    if (nextBlockHeight > ref.height) {
      await OS.sleep(Duration.fromSecs(3))
      continue
    }

    let blockHash: H256
    if (nextBlockHeight == ref.height) {
      blockHash = ref.hash
    } else {
      const hash = await client.blockHash(nextBlockHeight, true, true)
      if (hash instanceof GeneralError) return hash
      if (hash == null) return new GeneralError("Failed to fetch blockHash")

      blockHash = hash
    }

    const stateNonce = await client.blockNonce(accountId, blockHash)
    if (stateNonce instanceof GeneralError) return stateNonce

    if (stateNonce > nonce) {
      return { hash: blockHash, height: nextBlockHeight }
    }

    nextBlockHeight += 1
  }

  return null
}
