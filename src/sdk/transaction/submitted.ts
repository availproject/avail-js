import { Client } from "../clients"
import { TransactionsWithEvents } from "../clients/event_client"
import { ClientError } from "../error"
import { IHeaderAndDecodable } from "../interface"
import { SubscriptionBuilder } from "../subscriptions"
import { AccountId, BlockRef, BlockState, H256, Mortality, RefinedSignatureOptions, TxRef } from "../types/metadata"
import { Duration } from "../utils"
import { DecodedTransaction } from "./decoded"

export type ReceiptMethod = "Nonce" | "Block" | "Both"

export class SubmittedTransaction {
  private client: Client
  public txHash: H256
  public accountId: AccountId
  public signatureOptions: RefinedSignatureOptions

  constructor(client: Client, txHash: H256, accountId: AccountId, options: RefinedSignatureOptions) {
    this.client = client
    this.txHash = txHash
    this.accountId = accountId
    this.signatureOptions = options
  }

  async receipt(
    useBestBlock?: boolean,
    options?: { pollRate?: Duration; method?: ReceiptMethod },
  ): Promise<TransactionReceipt | null | ClientError> {
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

  async tx<T>(as: IHeaderAndDecodable<T>): Promise<DecodedTransaction<T> | ClientError> {
    const blockClient = this.client.blockClient()
    const tx = await blockClient.transactionStatic(as, this.blockRef.hash, this.txRef.index)
    if (tx instanceof ClientError) return tx
    if (tx == null) return new ClientError("Failed to find transaction")

    return tx[0]
  }

  async txEvents(): Promise<TransactionsWithEvents | ClientError> {
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
  options?: { pollRate?: Duration; method?: ReceiptMethod },
): Promise<TransactionReceipt | null | ClientError> {
  const pollRate = options?.pollRate ?? Duration.fromSecs(3)
  const method = options?.method ?? "Both"

  let blockRef = await findCorrectBlockRef(client, nonce, accountId, txHash, mortality, useBestBlock, pollRate, method)
  if (blockRef instanceof ClientError) return blockRef
  if (blockRef == null) return null

  const blockClient = client.blockClient()
  const transaction = await blockClient.transaction(blockRef.hash, txHash, "None")
  if (transaction instanceof ClientError) return transaction
  if (transaction == null) return null

  const txRef = { hash: txHash, index: transaction.txIndex }
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
  method: ReceiptMethod,
): Promise<BlockRef | null | ClientError> {
  const mortalityEnds = mortality.blockHeight + mortality.period
  let nextBlockHeight = (mortality.blockHeight += 1)

  const sub = await new SubscriptionBuilder()
    .blockHeight(nextBlockHeight)
    .pollRate(pollRate)
    .follow(useBestBlock)
    .build(client)
  if (sub instanceof ClientError) return sub

  while (nextBlockHeight <= mortalityEnds) {
    const ref = await sub.next(client)
    if (ref instanceof ClientError) return ref
    if (ref == null) return new ClientError("Failed to fetch block ref")

    if (method == "Both") {
      const stateNonce = await client.blockNonce(accountId, ref.hash)
      if (stateNonce instanceof ClientError) return stateNonce
      if (stateNonce > nonce) return ref
      if (stateNonce == 0) {
        const transaction = await client.blockClient().transaction(ref.hash, txHash, "None")
        if (transaction instanceof ClientError) return transaction
        if (transaction != null) return ref
      }
    } else if (method == "Nonce") {
      const stateNonce = await client.blockNonce(accountId, ref.hash)
      if (stateNonce instanceof ClientError) return stateNonce
      if (stateNonce > nonce) return ref
    } else {
      const transaction = await client.blockClient().transaction(ref.hash, txHash, "None")
      if (transaction instanceof ClientError) return transaction
      if (transaction != null) return ref
    }

    nextBlockHeight = ref.height
  }

  return null
}
