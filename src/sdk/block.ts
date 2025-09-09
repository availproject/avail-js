import { ClientError } from "./error"
import { DecodedTransaction } from "./transaction"
import { H256 } from "./types"
import { TransactionSigned } from "./types/metadata"
import { Client } from "./clients/main_client"
import { IEvent, IHeader, IHeaderAndDecodable } from "./interface"
import { EncodeSelector, TransactionFilterOptions, Options, ExtrinsicInfo } from "./rpc/system/fetch_extrinsics"
import { fetchEvents } from "./rpc/system"
import { avail } from "."

export class Block {
  blockId: H256 | string | number
  tx: BTx
  ext: BExt
  event: BEvt

  constructor(client: Client, blockId: H256 | string | number) {
    this.blockId = blockId
    this.ext = new BExt(client, this)
    this.tx = new BTx(this.ext)
    this.event = new BEvt(client, this)
  }
}

class BTx {
  constructor(private bExt: BExt) {}

  async get<T>(
    as: IHeaderAndDecodable<T>,
    transactionId: H256 | string | number,
    retryOnError: boolean = true,
  ): Promise<Transaction<T> | null | ClientError> {
    let txFilter: TransactionFilterOptions = "All"
    if (transactionId instanceof H256 || typeof transactionId === "string") {
      txFilter = { TxHash: [transactionId.toString()] }
    } else {
      txFilter = { TxIndex: [transactionId] }
    }

    const info = await this.bExt.first({ transactionFilter: txFilter, encodeAs: "Extrinsic" }, retryOnError)
    if (info instanceof ClientError) return info
    if (info === null) return null
    if (info.data == null) return new ClientError("Fetch extrinsics endpoint returned an extrinsic with no data.")

    const decoded = DecodedTransaction.decode(as, info.data)
    if (decoded instanceof ClientError) return decoded

    return {
      call: decoded.call,
      signed: decoded.signature,
      txHash: info.txHash,
      txIndex: info.txIndex,
      palletId: info.palletId,
      variantId: info.variantId,
      ss58Address: info.signature ? info.signature.ss58_address : null,
    }
  }

  async first<T>(
    as: IHeaderAndDecodable<T>,
    opts?: Options,
    retryOnError: boolean = true,
  ): Promise<Transaction<T> | null | ClientError> {
    const result = await this.all(as, opts, retryOnError)
    if (result instanceof ClientError) return result
    return result.length > 0 ? result[0] : null
  }

  async last<T>(
    as: IHeaderAndDecodable<T>,
    opts?: Options,
    retryOnError: boolean = true,
  ): Promise<Transaction<T> | null | ClientError> {
    const result = await this.all(as, opts, retryOnError)
    if (result instanceof ClientError) return result
    return result.length > 0 ? result[result.length - 1] : null
  }

  async all<T>(
    as: IHeaderAndDecodable<T>,
    opts?: Options,
    retryOnError: boolean = true,
  ): Promise<Transaction<T>[] | ClientError> {
    opts = opts === undefined ? {} : opts
    opts.transactionFilter = { PalletCall: [[as.palletId(), as.variantId()]] }

    const infos = await this.bExt.all(opts, retryOnError)
    if (infos instanceof ClientError) return infos

    const result: Transaction<T>[] = []
    for (const info of infos) {
      if (info.data == null) {
        return new ClientError("Fetch extrinsics endpoint returned an extrinsic with no data.")
      }

      const decoded = DecodedTransaction.decode(as, info.data)
      if (decoded instanceof ClientError) return decoded

      result.push({
        call: decoded.call,
        signed: decoded.signature,
        txHash: info.txHash,
        txIndex: info.txIndex,
        palletId: info.palletId,
        variantId: info.variantId,
        ss58Address: info.signature ? info.signature.ss58_address : null,
      })
    }

    return result
  }
}

class BExt {
  constructor(
    private client: Client,
    private block: Block,
  ) {}

  async get(
    transactionId: H256 | string | number,
    encodeAs?: EncodeSelector,
    retryOnError: boolean = true,
  ): Promise<ExtrinsicInfo | null | ClientError> {
    let txFilter: TransactionFilterOptions = "All"
    if (transactionId instanceof H256 || typeof transactionId === "string") {
      txFilter = { TxHash: [transactionId.toString()] }
    } else {
      txFilter = { TxIndex: [transactionId] }
    }

    return await this.first({ transactionFilter: txFilter, encodeAs: encodeAs }, retryOnError)
  }

  async first(options?: Options, retryOnError: boolean = true): Promise<ExtrinsicInfo | null | ClientError> {
    const result = await this.all(options, retryOnError)
    if (result instanceof ClientError) return result
    return result.length > 0 ? result[0] : null
  }

  async last(options?: Options, retryOnError: boolean = true): Promise<ExtrinsicInfo | null | ClientError> {
    const result = await this.all(options, retryOnError)
    if (result instanceof ClientError) return result
    return result.length > 0 ? result[result.length - 1] : null
  }

  async all(options?: Options, retryOnError: boolean = true): Promise<ExtrinsicInfo[] | ClientError> {
    if (options == undefined) {
      options = { encodeAs: "Call" }
    } else if (options.encodeAs == undefined) {
      options.encodeAs = "Call"
    }

    return await this.client.rpc.system.fetchExtrinsic(this.block.blockId, options, retryOnError)
  }
}

class BEvt {
  constructor(
    private client: Client,
    private block: Block,
  ) {}

  async tx(txIndex: number, retryOnError: boolean = true): Promise<TransactionEvents | null | ClientError> {
    const filter: fetchEvents.Filter = { Only: [txIndex] }
    const result = await this.all({ filter, enableEncoding: true, enableDecoding: false }, retryOnError)
    if (result instanceof ClientError) return result
    if (result == null) return null

    const events: TransactionEvent[] = []
    for (const event of result[0].events) {
      if (event.encodedData == null) {
        return new ClientError("Fetch events endpoint returned an event with no data.")
      }
      events.push({ index: event.index, palletId: event.palletId, variantId: event.variantId, data: event.encodedData })
    }

    return new TransactionEvents(events)
  }

  async all(
    options?: BlockEventsOptions,
    retryOnError: boolean = true,
  ): Promise<fetchEvents.PhaseEvents[] | ClientError> {
    const result = await this.client.rpc.system.fetchEvents(this.block.blockId, options, retryOnError)
    if (result instanceof ClientError) return result

    return result
  }
}

export interface BlockEventsOptions {
  filter?: fetchEvents.Filter
  enableEncoding?: boolean
  enableDecoding?: boolean
}

export interface Transaction<T> {
  call: T
  signed: TransactionSigned | null
  txHash: string
  txIndex: number
  palletId: number
  variantId: number
  ss58Address: string | null
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
