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
} from "../core/index"
import { fetchExtrinsicV1Types } from "../core/rpc/system"
import { Extrinsic } from "@polkadot/types/interfaces"
import { AnyU8a } from "@polkadot/types-codec/types"
import { GenericExtrinsic } from "@polkadot/types"
import { Core } from "./index"

export class SubmittableTransaction {
  private client: Client
  public call: AnyU8a

  constructor(client: Client, call: AnyU8a) {
    this.client = client
    this.call = call
  }

  // Sign and/or Submit
  public sign(signer: KeyringPair, options: RefinedOptions): Extrinsic {
    const extrinsic = new GenericExtrinsic(this.client.api.registry, this.call)
    return extrinsic.sign(signer, options)
  }

  public async signAndSubmit(signer: KeyringPair, options: SignatureOptions): Promise<SubmittedTransaction> {
    const accountId = AccountId.fromSS58(signer.address)
    const refinedOptions = await refineOptions(this.client, accountId, options)

    const signedTransaction = this.sign(signer, refinedOptions)
    const hash = await this.client.submit(signedTransaction)

    return new SubmittedTransaction(this.client, hash, accountId, refinedOptions)
  }
}

async function refineOptions(
  client: Client,
  accountId: AccountId,
  rawOptions: SignatureOptions,
): Promise<RefinedOptions> {
  let mortality: Mortality
  if (rawOptions.mortality != null) {
    mortality = rawOptions.mortality
  } else {
    const blockHeight = await client.finalizedBlockHeight()
    const blockHash = await client.blockHash(blockHeight)
    if (blockHash == null) {
      // TODO
      throw Error("No Block Hash was found for ...")
    }
    const period = 32
    mortality = { blockHash, blockHeight, period } satisfies Mortality
  }
  const blockHash = mortality.blockHash.toHex()
  const nonce = rawOptions.nonce ?? (await client.nonce(accountId))
  const tip = rawOptions.tip ?? new BN("0")
  const app_id = rawOptions.app_id ?? 0
  const genesisHash = client.genesisHash().toHex()
  const runtimeVersion = client.runtimeVersion()
  const era = client.api.registry.createType("ExtrinsicEra", {
    current: mortality.blockHeight,
    period: mortality.period,
  })

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

  public async receipt(useBestBlock: boolean): Promise<TransactionReceipt | null> {
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

  async blockState(): Promise<Core.BlockState> {
    return await this.client.blockState(this.blockLoc)
  }

  async txEvents(): Promise<Core.systemRpc.fetchEventsV1Types.RuntimeEvent[]> {
    const client = this.client.eventClient()
    const events = await client.transactionEvents(this.blockLoc.hash, this.txLoc.index, true, false)
    if (events == null) {
      throw Error("Failed to find events")
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
): Promise<TransactionReceipt | null> {
  const blockLoc = await findBlockLocViaNonce(client, nonce, accountId, mortality, useBestBlock)
  if (blockLoc == null) {
    // TODO
    return null
  }

  const blockClient = client.blockClient()
  const signatureFilter: fetchExtrinsicV1Types.SignatureFilterOptions = {
    ss58_address: accountId.toSS58(),
    nonce: nonce,
  }
  const transaction = await blockClient.blockTransaction(blockLoc.hash, txHash, signatureFilter, "None")
  if (transaction == null) {
    return null
  }
  const tx_hash = H256.fromString(transaction.tx_hash)
  const txLoc = { hash: tx_hash, index: transaction.tx_index } satisfies TransactionLocation

  return new TransactionReceipt(client, blockLoc, txLoc)
}

async function findBlockLocViaNonce(
  client: Client,
  nonce: number,
  accountId: AccountId,
  mortality: Mortality,
  _useBestBlock: boolean,
): Promise<BlockLocation | null> {
  const mortalityEnds = mortality.blockHeight + mortality.period
  let nextBlockHeight = (mortality.blockHeight += 1)

  while (nextBlockHeight <= mortalityEnds) {
    const finalizedHeight = await client.finalizedBlockHeight()
    if (nextBlockHeight > finalizedHeight) {
      await sleep(500)
      continue
    }

    const blockHash = await client.blockHash(nextBlockHeight)
    if (blockHash == null) {
      // TODO
      return null
    }

    const stateNonce = await client.blockNonce(accountId, blockHash)
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
