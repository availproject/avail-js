import type { Client } from "../client"
import type { IHeaderAndDecodable } from "../core/interface"
import type { AccountId, BlockState, Mortality, RefinedSignatureOptions } from "../core/metadata"
import { H256, type BlockInfo } from "../core/metadata"
import { AvailError } from "../core/error"
import { Duration } from "../core/utils"
import { Sub } from "../subscription/sub"
import { BlockExtrinsic } from "../block/extrinsic"
import { BlockEncodedExtrinsic } from "../block/encoded"
import { Block } from "../block/block"
import { BlockEvents } from "../block/events"

export class SubmittedTransaction {
  private readonly client: Client
  public readonly extHash: H256
  public readonly accountId: AccountId
  public readonly signatureOptions: RefinedSignatureOptions

  constructor(client: Client, extHash: H256, accountId: AccountId, options: RefinedSignatureOptions) {
    this.client = client
    this.extHash = extHash
    this.accountId = accountId
    this.signatureOptions = options
  }

  async receipt(
    useBestBlock?: boolean,
    options?: { pollRate?: Duration },
  ): Promise<TransactionReceipt | null | AvailError> {
    useBestBlock ??= false
    return await transactionReceipt(
      this.client,
      this.extHash,
      this.signatureOptions.nonce,
      this.accountId,
      this.signatureOptions.mortality,
      useBestBlock,
      options,
    )
  }
}

export class TransactionReceipt {
  constructor(
    private readonly client: Client,
    public readonly blockHash: H256,
    public readonly blockHeight: number,
    public readonly extHash: H256,
    public readonly extIndex: number,
  ) { }

  async blockState(): Promise<BlockState | AvailError> {
    return await this.client.chain().blockState(this.blockHash)
  }

  async extrinsic<T>(as: IHeaderAndDecodable<T>): Promise<BlockExtrinsic<T> | AvailError> {
    const block = new Block(this.client, this.blockHash)
    const ext = await block.extrinsics().get(as, this.extIndex)
    if (ext instanceof AvailError) return ext
    if (ext == null) return new AvailError("Failed to find transaction")

    return ext
  }

  async encoded(): Promise<BlockEncodedExtrinsic | AvailError> {
    const block = new Block(this.client, this.blockHash)
    const ext = await block.encoded().get(this.extIndex)
    if (ext == null) return new AvailError("Failed to find extrinsic")

    return ext
  }

  async events(): Promise<BlockEvents | AvailError> {
    const block = new Block(this.client, this.blockHash)
    const events = await block.events().extrinsic(this.extIndex)
    if (events == null) return new AvailError("Failed to find events")

    return events
  }

  static async fromRange(
    client: Client,
    extHash: H256 | string,
    blockStart: number,
    blockEnd: number,
    options?: { pollRate?: Duration; useBestBlock?: boolean },
  ): Promise<TransactionReceipt | null | AvailError> {
    if (blockStart > blockEnd) return new AvailError("BlockStart cannot start after blockEnd")
    if (typeof extHash === "string") {
      const hash = H256.from(extHash)
      if (hash instanceof AvailError) return hash
      extHash = hash
    }

    const sub = new Sub(client)
    sub.useBestBlock(options?.useBestBlock ?? false)
    sub.setPoolRate(options?.pollRate ?? Duration.fromSecs(3))
    sub.setBlockHeight(blockStart)

    while (true) {
      const blockInfo = await sub.next()
      if (blockInfo instanceof AvailError) return blockInfo

      const infos = await new Block(client, blockInfo.hash).extrinsicInfos({
        encodeAs: "None",
        filter: { TxHash: [extHash.toString()] },
      })
      if (infos instanceof AvailError) return infos
      if (infos.length > 0) {
        return new TransactionReceipt(client, blockInfo.hash, blockInfo.height, infos[0].extHash, infos[0].extIndex)
      }

      if (blockInfo.height > blockEnd) return null
    }
  }
}

async function transactionReceipt(
  client: Client,
  extHash: H256,
  nonce: number,
  accountId: AccountId,
  mortality: Mortality,
  useBestBlock: boolean,
  options?: { pollRate?: Duration },
): Promise<TransactionReceipt | null | AvailError> {
  const pollRate = options?.pollRate ?? Duration.fromSecs(3)

  const blockInfo = await findCorrectBlockInfo(client, nonce, accountId, extHash, mortality, useBestBlock, pollRate)
  if (blockInfo instanceof AvailError) return blockInfo
  if (blockInfo == null) return null

  const infos = await new Block(client, blockInfo.hash).extrinsicInfos({
    encodeAs: "None",
    filter: { TxHash: [extHash.toString()] },
  })
  if (infos instanceof AvailError) return infos
  if (infos.length == 0) return null

  return new TransactionReceipt(client, blockInfo.hash, blockInfo.height, infos[0].extHash, infos[0].extIndex)
}

async function findCorrectBlockInfo(
  client: Client,
  nonce: number,
  accountId: AccountId,
  extHash: H256,
  mortality: Mortality,
  useBestBlock: boolean,
  pollRate: Duration,
): Promise<BlockInfo | null | AvailError> {
  const mortalityEnds = mortality.blockHeight + mortality.period
  let currentBlockHeight = mortality.blockHeight

  const sub = new Sub(client)
  sub.setBlockHeight(currentBlockHeight)
  sub.useBestBlock(useBestBlock)
  sub.setPoolRate(pollRate)

  while (mortalityEnds >= currentBlockHeight) {
    const blockInfo = await sub.next()
    if (blockInfo instanceof AvailError) return blockInfo
    currentBlockHeight = blockInfo.height

    const stateNonce = await client.chain().blockNonce(accountId, blockInfo.hash)
    if (stateNonce instanceof AvailError) return stateNonce
    if (stateNonce > nonce) return blockInfo
    if (stateNonce == 0) {
      const infos = await new Block(client, blockInfo.hash).extrinsicInfos({
        encodeAs: "None",
        filter: { TxHash: [extHash.toString()] },
      })
      if (infos instanceof AvailError) return infos
      if (infos.length > 0) return blockInfo
    }
  }

  return null
}
