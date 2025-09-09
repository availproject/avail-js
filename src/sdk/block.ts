import { ClientError } from "./error"
import { DecodedTransaction } from "./transaction"
import { H256 } from "./types"
import { HashLike, HashNumber, TransactionSigned } from "./types/metadata"
import { Client } from "./clients/main_client"
import { IEvent, IHeader, IHeaderAndDecodable } from "./interface"
import {
  EncodeSelector,
  TransactionFilterOptions,
  TransactionSignature,
  Options,
  ExtrinsicInfo,
} from "./rpc/system/fetch_extrinsics"
import { fetchEvents } from "./rpc/system"
import { avail } from "."

export class Block {
  private client: Client
  hash: H256

  constructor(client: Client, hash: H256) {
    this.client = client
    this.hash = hash
  }

  static async from(
    client: Client,
    blockId: H256 | string | number,
    retryOnError: boolean = true,
  ): Promise<Block | ClientError> {
    if (typeof blockId === "string") {
      const hash = H256.from(blockId)
      if (hash instanceof ClientError) return hash
      return new Block(client, hash)
    }
    if (typeof blockId === "number") {
      const hash = await client.blockHash(blockId, retryOnError)
      if (hash instanceof ClientError) return hash
      if (hash === null) return new ClientError("No block hash for given block height")
      return new Block(client, hash)
    }

    return new Block(client, blockId)
  }

  async tx<T>(
    as: IHeaderAndDecodable<T>,
    transactionId: H256 | string | number,
    retryOnError: boolean = true,
  ): Promise<[T, TransactionSigned | null, ExtrinsicInfo] | null | ClientError> {
    let txFilter: TransactionFilterOptions = "All"
    if (transactionId instanceof H256 || typeof transactionId === "string") {
      txFilter = { TxHash: [transactionId.toString()] }
    } else {
      txFilter = { TxIndex: [transactionId] }
    }

    const txs = await this.blockTransactions({ transactionFilter: txFilter, encodeAs: "Extrinsic" }, retryOnError)
    if (txs instanceof ClientError) return txs
    if (txs.length == 0) return null

    const info = txs[0]
    if (info.data == null) {
      return new ClientError("Fetch extrinsics endpoint returned an extrinsic with no data.")
    }

    const decoded = DecodedTransaction.decode(as, info.data)
    if (decoded instanceof ClientError) return decoded
    if (decoded == null) return null

    info.data = null
    return [decoded.call, decoded.signature, info]
  }

  async txGeneric(
    transactionId: HashLike | number,
    encodeAs?: EncodeSelector,
    retryOnError: boolean = true,
  ): Promise<ExtrinsicInfo | null | ClientError> {
    let txFilter: TransactionFilterOptions = "All"
    if (transactionId instanceof H256 || typeof transactionId === "string") {
      txFilter = { TxHash: [transactionId.toString()] }
    } else {
      txFilter = { TxIndex: [transactionId] }
    }

    const txs = await this.blockTransactions({ transactionFilter: txFilter, encodeAs: encodeAs }, retryOnError)
    if (txs instanceof ClientError) return txs
    if (txs.length == 0) return null

    return txs[0]
  }

  async txEvents(txIndex: number, retryOnError: boolean = true): Promise<TransactionEvents | null | ClientError> {
    const filter: fetchEvents.Filter = { Only: [txIndex] }
    const result = await this.blockEvents({ filter, enableEncoding: true, enableDecoding: false }, retryOnError)
    if (result instanceof ClientError) return result
    if (result == null) return null

    const events: TransactionEvent[] = []
    for (const event of result.list[0].events) {
      if (event.encodedData == null) {
        return new ClientError("Fetch events endpoint returned an event with no data.")
      }
      events.push({ index: event.index, palletId: event.palletId, variantId: event.variantId, data: event.encodedData })
    }

    return new TransactionEvents(events)
  }
  async blockEvents(options?: BlockEventsOptions, retryOnError: boolean = true) {
    const result = await this.client.rpc.system.fetchEvents(this.hash, options, retryOnError)
    if (result instanceof ClientError) return result

    return new BlockEvents(result)
  }

  async blockTransactions(options?: Options, retryOnError: boolean = true): Promise<ExtrinsicInfo[] | ClientError> {
    let blockIdParam: HashNumber = { Hash: this.hash.toString() }
    if (options == undefined) {
      options = { encodeAs: "Call" }
    } else if (options.encodeAs == undefined) {
      options.encodeAs = "Call"
    }

    const rpc = this.client.rpc
    return await rpc.system.fetchExtrinsic(blockIdParam, options, retryOnError)
  }

  setHash(value: H256) {
    this.hash = value
  }

  async rebase(blockId: H256 | string | number, retryOnError = true): Promise<null | ClientError> {
    if (typeof blockId === "string") {
      const hash = H256.from(blockId)
      if (hash instanceof ClientError) return hash
      this.hash = hash
    } else if (typeof blockId === "number") {
      const hash = await this.client.blockHash(blockId, retryOnError)
      if (hash instanceof ClientError) return hash
      if (hash === null) return new ClientError("No block hash for given block height")
      this.hash = hash
    } else {
      this.hash = blockId
    }

    return null
  }
}

export class BlockEvents {
  constructor(public list: fetchEvents.PhaseEvents[]) {}
}

export interface BlockEventsOptions {
  filter?: fetchEvents.Filter
  enableEncoding?: boolean
  enableDecoding?: boolean
}

export interface BlockTransaction {
  txHash: string
  txIndex: number
  palletId: number
  variantId: number
  signature: TransactionSignature | null
  data: string
}

export interface TransactionEvent {
  index: number
  palletId: number
  variantId: number
  data: string
}

export class TransactionEvents {
  constructor(public events: TransactionEvent[]) {}

  find<T>(as: IHeaderAndDecodable<T>): T | null
  find<T>(as: IHeaderAndDecodable<T>, unsafe: true): T
  find<T>(as: IHeaderAndDecodable<T>, unsafe?: boolean): T | null {
    const pos = this.events.findIndex((v) => v.palletId == as.palletId() && v.variantId == as.variantId())
    if (pos == -1) throw new Error(`Failed to find event with palletId: ${as.palletId()}, variantId: ${as.variantId()}`)

    const decoded = IEvent.decode(as, this.events[pos].data, true)
    if (decoded instanceof ClientError) {
      if (unsafe === true) {
        throw decoded
      }
      return null
    }

    return decoded
  }

  findAll<T>(as: IHeaderAndDecodable<T>): T[] | ClientError
  findAll<T>(as: IHeaderAndDecodable<T>, unsafe: true): T[]
  findAll<T>(as: IHeaderAndDecodable<T>, unsafe?: boolean): T[] | ClientError {
    const result = []

    for (const event of this.events) {
      if (!(event.palletId == as.palletId() && event.variantId == as.variantId())) {
        continue
      }

      const decoded = IEvent.decode(as, event.data, true)
      if (decoded instanceof ClientError) {
        if (unsafe === true) {
          throw decoded
        } else {
          return decoded
        }
      }

      result.push(decoded)
    }

    return result
  }

  isExtrinsicSuccessPresent(): boolean {
    return this.isPresent(avail.system.events.ExtrinsicSuccess)
  }

  isExtrinsicFailedPresent(): boolean {
    return this.isPresent(avail.system.events.ExtrinsicFailed)
  }

  proxyExecutedSuccessfully(): boolean | null {
    const executed = this.find(avail.proxy.events.ProxyExecuted)
    if (executed == null) return null
    return executed.result == "Ok"
  }

  multisigExecutedSuccessfully(): boolean | null {
    const executed = this.find(avail.multisig.events.MultisigExecuted)
    if (executed == null) return null
    return executed.result == "Ok"
  }

  isPresent(as: IHeader): boolean
  isPresent(palletId: number, variantId: number): boolean
  isPresent(first: number | IHeader, second?: number): boolean {
    if (typeof first === "number") {
      if (typeof second !== "number") {
        throw new Error("variantId is required when using palletId")
      }

      return this.count(first, second) > 0
    }

    return this.count(first) > 0
  }

  count(as: IHeader): number
  count(palletId: number, variantId: number): number
  count(first: number | IHeader, second?: number): number {
    let palletId = 0
    let variantId = 0

    if (typeof first === "number") {
      if (typeof second !== "number") {
        throw new Error("variantId is required when using palletId")
      }

      palletId = first
      variantId = second
    } else {
      palletId = first.palletId()
      variantId = first.variantId()
    }

    let count = 0
    this.events.forEach((e) => {
      if (e.palletId == palletId && e.variantId == variantId) {
        count += 1
      }
    })

    return count
  }
}

export interface BlockEventsOptions {
  filter?: fetchEvents.Filter
  enableEncoding?: boolean
  enableDecoding?: boolean
}
