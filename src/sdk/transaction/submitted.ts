import { Client } from "../clients"
import { TransactionEvent, TransactionsWithEvents } from "../clients/event_client"
import { ClientError } from "../error"
import { SubscriptionBuilder } from "../subscriptions"
import { AccountId, BlockRef, BlockState, H256, Mortality, RefinedSignatureOptions, TxRef } from "../types/metadata"
import { Duration } from "../utils"

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
    options?: { pollRate?: Duration },
  ): Promise<TransactionReceipt | null | ClientError> {
    useBestBlock ??= false
    return await transactionReceipt(
      this.client,
      this.txHash,
      this.signatureOptions.nonce,
      this.accountId,
      this.signatureOptions.mortality,
      useBestBlock,
      options?.pollRate,
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
  pollRate?: Duration,
): Promise<TransactionReceipt | null | ClientError> {
  const blockRef = await findCorrectBlockRef(client, nonce, accountId, mortality, useBestBlock, pollRate)
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
  mortality: Mortality,
  useBestBlock: boolean,
  pollRate?: Duration,
): Promise<BlockRef | null | ClientError> {
  const mortalityEnds = mortality.blockHeight + mortality.period
  let nextBlockHeight = (mortality.blockHeight += 1)

  pollRate ??= Duration.fromSecs(3)
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

    const stateNonce = await client.blockNonce(accountId, ref.hash)
    if (stateNonce instanceof ClientError) return stateNonce
    if (stateNonce > nonce) {
      return ref
    }

    nextBlockHeight = ref.height
  }

  return null
}
