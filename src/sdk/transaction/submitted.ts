import { Block, TransactionEvents } from "../block"
import { Client } from "../clients"
import { ClientError } from "../error"
import { IHeaderAndDecodable } from "../interface"
import { EncodeSelector, ExtrinsicInfo } from "../rpc/system/fetch_extrinsics"
import { SubscriptionBuilder } from "../subscriptions"
import { BN } from "../types"
import {
  AccountId,
  BlockRef,
  BlockState,
  EraValue,
  H256,
  Mortality,
  MultiAddress,
  MultiSignature,
  RefinedSignatureOptions,
  TransactionExtra,
  TxRef,
} from "../types/metadata"
import { Duration } from "../utils"

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

  /**
   * Works only if the transaction was signed
   */
  async tx<T>(as: IHeaderAndDecodable<T>): Promise<ReceiptTransaction<T> | ClientError> {
    const block = new Block(this.client, this.blockRef.hash)
    const tx = await block.tx(as, this.txRef.index)
    if (tx instanceof ClientError) return tx
    if (tx == null) return new ClientError("Failed to find transaction")
    if (tx[1] == null) return new ClientError("Transaction is not signed")
    if (tx[2].signature == null) return new ClientError("Transaction is not signed")

    return new ReceiptTransaction(tx[2].signature.ss58_address, tx[1].address, tx[1].signature, tx[1].txExtra, tx[0])
  }

  /**
   * By default it will fetch "Call" data.
   * Manually specify in order to get no data ("None") or whole extrinsic data ("Extrinsic")
   */
  async txGeneric(encodeAs: EncodeSelector = "Call"): Promise<ExtrinsicInfo | ClientError> {
    const block = new Block(this.client, this.blockRef.hash)
    const tx = await block.txGeneric(this.txRef.index, encodeAs)
    if (tx instanceof ClientError) return tx
    if (tx == null) return new ClientError("Failed to find transaction")

    return tx
  }

  async call<T>(as: IHeaderAndDecodable<T>): Promise<T | ClientError> {
    const block = new Block(this.client, this.blockRef.hash)
    const tx = await block.tx(as, this.txRef.index)
    if (tx instanceof ClientError) return tx
    if (tx == null) return new ClientError("Failed to find transaction")

    return tx[0]
  }

  async txEvents(): Promise<TransactionEvents | ClientError> {
    const block = new Block(this.client, this.blockRef.hash)
    const events = await block.txEvents(this.txRef.index)
    if (events instanceof ClientError) return events
    if (events == null) return new ClientError("Failed to find events")

    return events
  }

  static async from(
    client: Client,
    txHash: H256 | string,
    blockStart: number,
    blockEnd: number,
    options?: { pollRate?: Duration; useBestBlock?: boolean },
  ): Promise<TransactionReceipt | null | ClientError> {
    if (blockStart > blockEnd) return new ClientError("BlockStart cannot start after blockEnd")
    if (typeof txHash === "string") {
      const hash = H256.from(txHash)
      if (hash instanceof ClientError) return hash
      txHash = hash
    }

    const pollRate = options?.pollRate ?? Duration.fromSecs(3)
    const useBestBlock = options?.useBestBlock ?? false

    const sub = await new SubscriptionBuilder()
      .follow(useBestBlock)
      .blockHeight(blockStart)
      .pollRate(pollRate)
      .build(client)
    if (sub instanceof ClientError) return sub

    while (true) {
      const blockRef = await sub.next(client)
      if (blockRef instanceof ClientError) return blockRef

      const transaction = await new Block(client, blockRef.hash).txGeneric(txHash, "None")
      if (transaction instanceof ClientError) return transaction
      if (transaction == null) {
        if (blockRef.height > blockEnd) return null
        continue
      }

      return new TransactionReceipt(client, blockRef, { hash: txHash, index: transaction.txIndex })
    }
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

  const transaction = await new Block(client, blockRef.hash).txGeneric(txHash, "None")
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

    if (method == "Both") {
      const stateNonce = await client.blockNonce(accountId, ref.hash)
      if (stateNonce instanceof ClientError) return stateNonce
      if (stateNonce > nonce) return ref
      if (stateNonce == 0) {
        const transaction = await new Block(client, ref.hash).txGeneric(txHash, "None")
        if (transaction instanceof ClientError) return transaction
        if (transaction != null) return ref
      }
    } else if (method == "Nonce") {
      const stateNonce = await client.blockNonce(accountId, ref.hash)
      if (stateNonce instanceof ClientError) return stateNonce
      if (stateNonce > nonce) return ref
    } else {
      const transaction = await new Block(client, ref.hash).txGeneric(txHash, "None")
      if (transaction instanceof ClientError) return transaction
      if (transaction != null) return ref
    }

    nextBlockHeight = ref.height
  }

  return null
}

export class ReceiptTransaction<T> {
  ss58Address: string | null
  era: EraValue
  nonce: number
  tip: BN
  appId: number
  address: MultiAddress
  signature: MultiSignature
  call: T

  constructor(
    ss58Address: string | null,
    address: MultiAddress,
    signature: MultiSignature,
    txExtra: TransactionExtra,
    call: T,
  ) {
    this.ss58Address = ss58Address
    this.address = address
    this.signature = signature
    this.era = txExtra.era.value
    this.nonce = txExtra.nonce
    this.tip = txExtra.tip
    this.appId = txExtra.appId
    this.call = call
  }
}
