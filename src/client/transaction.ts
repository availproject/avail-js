import { Client } from "./clients"
import {
  AccountId,
  BlockLocation,
  H256,
  TransactionLocation,
  KeyringPair,
  BN,
  Mortality,
  SignatureOptions,
  RefinedOptions,
  GeneralError,
} from "../core/index"
import { Extrinsic } from "@polkadot/types/interfaces"
import { GenericExtrinsic } from "@polkadot/types"
import { Core } from "./index"
import { HasTxDispatchIndex } from "../core/decoded_transaction"
import { Encodable } from "../core/decoded_encoded"
import Encoder from "../core/encoder"

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

  public async signAndSubmit(
    signer: KeyringPair,
    options: SignatureOptions,
  ): Promise<SubmittedTransaction | GeneralError> {
    const accountId = AccountId.fromSS58(signer.address)
    const refinedOptions = await refineOptions(this.client, accountId, options)
    if (refinedOptions instanceof GeneralError) {
      return refinedOptions
    }

    const signedTransaction = this.sign(signer, refinedOptions)
    const hash = await this.client.submit(signedTransaction)
    if (hash instanceof GeneralError) {
      return hash
    }

    return new SubmittedTransaction(this.client, hash, accountId, refinedOptions)
  }

  static fromCall(client: Client, T: Encodable & HasTxDispatchIndex): SubmittableTransaction {
    const dispatchIndex = T.dispatchIndex()
    const call = Core.utils.mergeArrays([Encoder.u8(dispatchIndex[0]), Encoder.u8(dispatchIndex[1]), T.encode()])
    const wrappedCall = client.api.registry.createType("Call", call)
    const extrinsic = client.api.registry.createType("Extrinsic", { method: wrappedCall }) as GenericExtrinsic
    return new SubmittableTransaction(client, extrinsic)
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
    const blockHeight = await client.finalizedBlockHeight()
    if (blockHeight instanceof GeneralError) {
      return blockHeight
    }

    const blockHash = await client.blockHash(blockHeight)
    if (blockHash instanceof GeneralError) {
      return blockHash
    }

    if (blockHash == null) {
      return new GeneralError(`Failed to find Block Hash`)
    }

    const period = 32
    mortality = { blockHash, blockHeight, period } satisfies Mortality
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
    if (result instanceof GeneralError) {
      return result
    }
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

  public async receipt(useBestBlock: boolean): Promise<TransactionReceipt | null | GeneralError> {
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
  public blockLoc: BlockLocation
  public txLoc: TransactionLocation

  constructor(client: Client, blockLoc: BlockLocation, txLoc: TransactionLocation) {
    this.client = client
    this.blockLoc = blockLoc
    this.txLoc = txLoc
  }

  async blockState(): Promise<Core.BlockState | GeneralError> {
    return await this.client.blockState(this.blockLoc)
  }

  async txEvents(): Promise<Core.systemRpc.fetchEventsV1Types.RuntimeEvent[] | GeneralError> {
    const client = this.client.eventClient()
    const events = await client.transactionEvents(this.blockLoc.hash, this.txLoc.index, true, false)
    if (events instanceof GeneralError) {
      return events
    }

    if (events == null) {
      return new GeneralError("Failed to find events")
    }

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
  const blockLoc = await findBlockLocViaNonce(client, nonce, accountId, mortality, useBestBlock)
  if (blockLoc instanceof GeneralError) {
    return blockLoc
  }

  if (blockLoc == null) {
    return null
  }

  const blockClient = client.blockClient()
  const transaction = await blockClient.transaction(blockLoc.hash, txHash, "None")
  if (transaction instanceof GeneralError) {
    return transaction
  }
  if (transaction == null) {
    return null
  }

  const txLoc = { hash: txHash, index: transaction.tx_index } satisfies TransactionLocation

  return new TransactionReceipt(client, blockLoc, txLoc)
}

async function findBlockLocViaNonce(
  client: Client,
  nonce: number,
  accountId: AccountId,
  mortality: Mortality,
  _useBestBlock: boolean,
): Promise<BlockLocation | null | GeneralError> {
  const mortalityEnds = mortality.blockHeight + mortality.period
  let nextBlockHeight = (mortality.blockHeight += 1)

  while (nextBlockHeight <= mortalityEnds) {
    const finalizedHeight = await client.finalizedBlockHeight()
    if (finalizedHeight instanceof GeneralError) {
      return finalizedHeight
    }

    if (nextBlockHeight > finalizedHeight) {
      await sleep(500)
      continue
    }

    const blockHash = await client.blockHash(nextBlockHeight)
    if (blockHash instanceof GeneralError) {
      return blockHash
    }

    if (blockHash == null) {
      return new GeneralError("Failed to fetch block hash")
    }

    const stateNonce = await client.blockNonce(accountId, blockHash)
    if (stateNonce instanceof GeneralError) {
      return stateNonce
    }

    if (stateNonce > nonce) {
      const blockLoc = { hash: blockHash, height: nextBlockHeight } satisfies BlockLocation
      return blockLoc
    }

    nextBlockHeight += 1
  }

  return null
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
