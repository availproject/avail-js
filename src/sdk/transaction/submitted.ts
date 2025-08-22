import { Client } from "../clients"
import { RuntimeEvent } from "../clients/event_client"
import ClientError from "../error"
import { AccountId, BlockRef, BlockState, H256, Mortality, RefinedOptions, TxRef } from "../types/metadata"
import { Duration, sleep } from "../utils"

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
    if (stateNonce > nonce) return { hash: blockHash, height: nextBlockHeight }

    nextBlockHeight += 1
  }

  return null
}
