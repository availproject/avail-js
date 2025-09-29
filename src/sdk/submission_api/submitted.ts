import { Block, BlockRawExtrinsic, BlockTransaction, ExtrinsicEvents } from "../block"
import { Client } from "../clients"
import { AvailError } from "../error"
import { IHeaderAndDecodable } from "../core/interface"
import { EncodeSelector } from "../rpc/system/fetch_extrinsics"
import { SubscriptionBuilder } from "../subscriptions"
import { AccountId, BlockRef, BlockState, H256, Mortality, RefinedSignatureOptions, TxRef } from "../types/metadata"
import { Duration } from "../utils"

export class SubmittedTransaction {
  private readonly client: Client
  public readonly txHash: H256
  public readonly accountId: AccountId
  public readonly signatureOptions: RefinedSignatureOptions

  constructor(client: Client, txHash: H256, accountId: AccountId, options: RefinedSignatureOptions) {
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
    public readonly blockRef: BlockRef,
    public readonly txRef: TxRef,
  ) {}

  async blockState(): Promise<BlockState | AvailError> {
    return await this.client.blockState(this.blockRef)
  }

  /**
   * Works only if the transaction was signed
   */
  async tx<T>(as: IHeaderAndDecodable<T>): Promise<BlockTransaction<T> | AvailError> {
    const block = new Block(this.client, this.blockRef.hash)
    const tx = await block.tx.get(as, this.txRef.index)
    if (tx == null) return new AvailError("Failed to find transaction")

    return tx
  }

  /**
   * Returns Extrinsic Call
   *
   */
  async call<T>(as: IHeaderAndDecodable<T>): Promise<T | AvailError> {
    const block = new Block(this.client, this.blockRef.hash)
    const tx = await block.ext.get(as, this.txRef.index)
    if (tx instanceof AvailError) return tx
    if (tx == null) return new AvailError("Failed to find transaction")

    return tx.call
  }

  /**
   * By default it will fetch "Extrinsic"
   * Manually specify in order to get no data ("None") or extrinsic call ("Call")
   */
  async rawExt(encodeAs: EncodeSelector = "Extrinsic"): Promise<BlockRawExtrinsic | AvailError> {
    const block = new Block(this.client, this.blockRef.hash)
    const ext = await block.raw_ext.get(this.txRef.index, encodeAs)
    if (ext == null) return new AvailError("Failed to find extrinsic")
    return ext
  }

  async events(): Promise<ExtrinsicEvents | AvailError> {
    const block = new Block(this.client, this.blockRef.hash)
    const events = await block.event.ext(this.txRef.index)
    if (events instanceof AvailError) return events
    if (events == null) return new AvailError("Failed to find events")

    return events
  }

  static async from(
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

    const pollRate = options?.pollRate ?? Duration.fromSecs(3)
    const useBestBlock = options?.useBestBlock ?? false

    const sub = await new SubscriptionBuilder()
      .follow(useBestBlock)
      .blockHeight(blockStart)
      .pollRate(pollRate)
      .build(client)
    if (sub instanceof AvailError) return sub

    while (true) {
      const blockRef = await sub.next(client)
      if (blockRef instanceof AvailError) return blockRef

      const transaction = await new Block(client, blockRef.hash).raw_ext.get(txHash, "None")
      if (transaction instanceof AvailError) return transaction
      if (transaction == null) {
        if (blockRef.height > blockEnd) return null
        continue
      }

      return new TransactionReceipt(client, blockRef, { hash: txHash, index: transaction.extIndex })
    }
  }
}

async function transactionReceipt(
  client: Client,
  txHash: H256,
  nonce: number,
  accountId: AccountId,
  mortality: Mortality,
  useBestBlock: boolean,
  options?: { pollRate?: Duration },
): Promise<TransactionReceipt | null | AvailError> {
  const pollRate = options?.pollRate ?? Duration.fromSecs(3)

  const blockRef = await findCorrectBlockRef(client, nonce, accountId, txHash, mortality, useBestBlock, pollRate)
  if (blockRef instanceof AvailError) return blockRef
  if (blockRef == null) return null

  const transaction = await new Block(client, blockRef.hash).raw_ext.get(txHash, "None")
  if (transaction instanceof AvailError) return transaction
  if (transaction == null) return null

  const txRef = { hash: txHash, index: transaction.extIndex }
  return new TransactionReceipt(client, blockRef, txRef)
}

async function findCorrectBlockRef(
  client: Client,
  nonce: number,
  accountId: AccountId,
  txHash: H256,
  mortality: Mortality,
  useBestBlock: boolean,
  pollRate: Duration,
): Promise<BlockRef | null | AvailError> {
  const mortalityEnds = mortality.blockHeight + mortality.period
  let nextBlockHeight = (mortality.blockHeight += 1)

  const sub = await new SubscriptionBuilder()
    .blockHeight(nextBlockHeight)
    .pollRate(pollRate)
    .follow(useBestBlock)
    .build(client)
  if (sub instanceof AvailError) return sub

  while (nextBlockHeight <= mortalityEnds) {
    const ref = await sub.next(client)
    if (ref instanceof AvailError) return ref

    const stateNonce = await client.blockNonce(accountId, ref.hash)
    if (stateNonce instanceof AvailError) return stateNonce
    if (stateNonce > nonce) return ref
    if (stateNonce == 0) {
      const transaction = await new Block(client, ref.hash).raw_ext.get(txHash, "None")
      if (transaction instanceof AvailError) return transaction
      if (transaction != null) return ref
    }

    nextBlockHeight = ref.height
  }

  return null
}
