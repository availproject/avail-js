import { BlockApi, BlockRawExtrinsic, BlockTransaction, ExtrinsicEvents } from "./../block_api"
import {
  Client,
  AvailError,
  EncodeSelector,
  BlockInfo,
  AccountId,
  BlockState,
  H256,
  Duration,
  types,
  BlockExtrinsic,
} from "./.."
import { IHeaderAndDecodable } from "../core/interface"
import { TxRef } from "../core/types"
import { Sub } from "../subscription"

export class SubmittedTransaction {
  private readonly client: Client
  public readonly txHash: H256
  public readonly accountId: AccountId
  public readonly signatureOptions: types.RefinedSignatureOptions

  constructor(client: Client, txHash: H256, accountId: AccountId, options: types.RefinedSignatureOptions) {
    this.client = client
    this.txHash = txHash
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
      this.txHash,
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
    public readonly blockRef: BlockInfo,
    public readonly txRef: TxRef,
  ) {}

  async blockState(): Promise<BlockState | AvailError> {
    return await this.client.chain().blockState(this.blockRef.hash)
  }

  async tx<T>(as: IHeaderAndDecodable<T>): Promise<BlockTransaction<T> | AvailError> {
    const block = new BlockApi(this.client, this.blockRef.hash)
    const tx = await block.tx().get(as, this.txRef.index)
    if (tx == null) return new AvailError("Failed to find transaction")

    return tx
  }

  async ext<T>(as: IHeaderAndDecodable<T>): Promise<BlockExtrinsic<T> | AvailError> {
    const block = new BlockApi(this.client, this.blockRef.hash)
    const ext = await block.ext().get(as, this.txRef.index)
    if (ext == null) return new AvailError("Failed to find transaction")

    return ext
  }

  async call<T>(as: IHeaderAndDecodable<T>): Promise<T | AvailError> {
    const block = new BlockApi(this.client, this.blockRef.hash)
    const tx = await block.ext().get(as, this.txRef.index)
    if (tx instanceof AvailError) return tx
    if (tx == null) return new AvailError("Failed to find transaction")

    return tx.call
  }

  async rawExt(encodeAs: EncodeSelector = "Extrinsic"): Promise<BlockRawExtrinsic | AvailError> {
    const block = new BlockApi(this.client, this.blockRef.hash)
    const ext = await block.raw_ext().get(this.txRef.index, encodeAs)
    if (ext == null) return new AvailError("Failed to find extrinsic")
    return ext
  }

  async events(): Promise<ExtrinsicEvents | AvailError> {
    const block = new BlockApi(this.client, this.blockRef.hash)
    const events = await block.events().ext(this.txRef.index)
    if (events instanceof AvailError) return events
    if (events == null) return new AvailError("Failed to find events")

    return events
  }

  static async fromRange(
    client: Client,
    txHash: H256 | string,
    blockStart: number,
    blockEnd: number,
    options?: { pollRate?: Duration; useBestBlock?: boolean },
  ): Promise<TransactionReceipt | null | AvailError> {
    if (blockStart > blockEnd) return new AvailError("BlockStart cannot start after blockEnd")
    if (typeof txHash === "string") {
      const hash = H256.from(txHash)
      if (hash instanceof AvailError) return hash
      txHash = hash
    }

    const sub = new Sub(client)
    sub.useBestBlock(options?.useBestBlock ?? false)
    sub.setPoolRate(options?.pollRate ?? Duration.fromSecs(3))
    sub.setBlockHeight(blockStart)

    while (true) {
      const blockRef = await sub.next()
      if (blockRef instanceof AvailError) return blockRef

      const transaction = await new BlockApi(client, blockRef.hash).raw_ext().get(txHash, "None")
      if (transaction instanceof AvailError) return transaction
      if (transaction != null) {
        return new TransactionReceipt(client, blockRef, { hash: txHash, index: transaction.extIndex() })
      }

      if (blockRef.height > blockEnd) return null
    }
  }
}

async function transactionReceipt(
  client: Client,
  txHash: H256,
  nonce: number,
  accountId: AccountId,
  mortality: types.Mortality,
  useBestBlock: boolean,
  options?: { pollRate?: Duration },
): Promise<TransactionReceipt | null | AvailError> {
  const pollRate = options?.pollRate ?? Duration.fromSecs(3)

  const blockRef = await findCorrectBlockInfo(client, nonce, accountId, txHash, mortality, useBestBlock, pollRate)
  if (blockRef instanceof AvailError) return blockRef
  if (blockRef == null) return null

  const transaction = await new BlockApi(client, blockRef.hash).raw_ext().get(txHash, "None")
  if (transaction instanceof AvailError) return transaction
  if (transaction == null) return null

  const txRef = { hash: txHash, index: transaction.extIndex() }
  return new TransactionReceipt(client, blockRef, txRef)
}

async function findCorrectBlockInfo(
  client: Client,
  nonce: number,
  accountId: AccountId,
  txHash: H256,
  mortality: types.Mortality,
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
    const info = await sub.next()
    if (info instanceof AvailError) return info
    currentBlockHeight = info.height

    const stateNonce = await client.chain().blockNonce(accountId, info.hash)
    if (stateNonce instanceof AvailError) return stateNonce
    if (stateNonce > nonce) return info
    if (stateNonce == 0) {
      const transaction = await new BlockApi(client, info.hash).raw_ext().get(txHash, "None")
      if (transaction instanceof AvailError) return transaction
      if (transaction != null) return info
    }
  }

  return null
}
