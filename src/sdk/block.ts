import { ClientError } from "./error"
import { DecodedTransaction } from "./transaction"
import { H256 } from "./types"
import { TransactionSigned } from "./types/metadata"
import { Client } from "./clients/main_client"
import { IEvent, IHeader, IHeaderAndDecodable } from "./interface"
import { EncodeSelector, TransactionFilterOptions, ExtrinsicInfo } from "./rpc/system/fetch_extrinsics"
import { fetchEvents } from "./rpc/system"
import { avail } from "."

export class Block {
  tx: BTx
  ext: BExt
  event: BEvt

  constructor(client: Client, blockId: H256 | string | number) {
    this.ext = new BExt(client, blockId)
    this.tx = new BTx(this.ext)
    this.event = new BEvt(client, blockId)
  }
}

class BTx {
  constructor(private bExt: BExt) {}

  async get<T>(
    as: IHeaderAndDecodable<T>,
    transactionId: H256 | string | number,
    retryOnError: boolean = true,
  ): Promise<Transaction<T> | null | ClientError> {
    let txFilter: TransactionFilterOptions
    if (transactionId instanceof H256 || typeof transactionId === "string") {
      txFilter = { TxHash: [transactionId.toString()] }
    } else {
      txFilter = { TxIndex: [transactionId] }
    }

    return await this.first(as, { filter: txFilter, retryOnError })
  }

  async first<T>(as: IHeaderAndDecodable<T>, opts?: BlockTxOpts1): Promise<Transaction<T> | null | ClientError> {
    const result = await this.all(as, opts)
    if (result instanceof ClientError) return result
    return result.length > 0 ? result[0] : null
  }

  async last<T>(as: IHeaderAndDecodable<T>, opts?: BlockTxOpts1): Promise<Transaction<T> | null | ClientError> {
    const result = await this.all(as, opts)
    if (result instanceof ClientError) return result
    return result.length > 0 ? result[result.length - 1] : null
  }

  async all<T>(as: IHeaderAndDecodable<T>, opts?: BlockTxOpts1): Promise<Transaction<T>[] | ClientError> {
    opts = opts === undefined ? {} : opts
    const opts2: BlockTxOpts2 = opts

    if (opts2.filter === undefined) {
      opts2.filter = { PalletCall: [[as.palletId(), as.variantId()]] }
    }
    opts2.encodeAs = "Extrinsic"

    const infos = await this.bExt.all(opts2)
    if (infos instanceof ClientError) return infos

    const result: Transaction<T>[] = []
    for (const info of infos) {
      const transaction = decodeExtrinsicInfo(as, info)
      if (transaction instanceof ClientError) return transaction
      result.push(transaction)
    }

    return result
  }
}

class BExt {
  constructor(
    private client: Client,
    private blockId: H256 | string | number,
  ) {}

  async get(
    transactionId: H256 | string | number,
    encodeAs?: EncodeSelector,
    retryOnError: boolean = true,
  ): Promise<ExtrinsicInfo | null | ClientError> {
    let transactionFilter: TransactionFilterOptions = "All"
    if (transactionId instanceof H256 || typeof transactionId === "string") {
      transactionFilter = { TxHash: [transactionId.toString()] }
    } else {
      transactionFilter = { TxIndex: [transactionId] }
    }

    return await this.first({ filter: transactionFilter, encodeAs, retryOnError })
  }

  async first(opts?: BlockTxOpts2): Promise<ExtrinsicInfo | null | ClientError> {
    const result = await this.all(opts)
    if (result instanceof ClientError) return result
    return result.length > 0 ? result[0] : null
  }

  async last(opts?: BlockTxOpts2): Promise<ExtrinsicInfo | null | ClientError> {
    const result = await this.all(opts)
    if (result instanceof ClientError) return result
    return result.length > 0 ? result[result.length - 1] : null
  }

  async all(opts?: BlockTxOpts2): Promise<ExtrinsicInfo[] | ClientError> {
    opts = opts !== undefined ? opts : {}
    if (opts.encodeAs === undefined) {
      opts.encodeAs = "Extrinsic"
    }

    return await this.client.rpc.system.fetchExtrinsic(this.blockId, opts, opts.retryOnError)
  }

  async count(opts?: BlockTxOpts2): Promise<number | ClientError> {
    opts = opts === undefined ? {} : opts
    opts.encodeAs = "None"

    const res = await this.all(opts)
    if (res instanceof ClientError) return res

    return res.length
  }

  async exists(opts?: BlockTxOpts2): Promise<boolean | ClientError> {
    opts = opts === undefined ? {} : opts
    opts.encodeAs = "None"

    const res = await this.first(opts)
    if (res instanceof ClientError) return res

    return res != null
  }
}

class BEvt {
  constructor(
    private client: Client,
    private blockId: H256 | string | number,
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
    const result = await this.client.rpc.system.fetchEvents(this.blockId, options, retryOnError)
    if (result instanceof ClientError) return result

    return result
  }
}

export interface BlockTxOpts1 {
  filter?: TransactionFilterOptions
  ss58Address?: string
  appId?: number
  nonce?: number
  retryOnError?: boolean
}

export interface BlockTxOpts2 {
  filter?: TransactionFilterOptions
  ss58Address?: string
  appId?: number
  nonce?: number
  encodeAs?: EncodeSelector
  retryOnError?: boolean
}

export interface BlockEventsOptions {
  filter?: "All" | "OnlyExtrinsics" | "OnlyNonExtrinsics" | { Only: number[] }
  enableEncoding?: boolean
  enableDecoding?: boolean
}

export interface Transaction<T> {
  call: T
  signed: TransactionSigned | null
  txHash: H256
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
      if (unsafe === true) throw decoded
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

/** @internal */
export function decodeExtrinsicInfo<T>(as: IHeaderAndDecodable<T>, info: ExtrinsicInfo): Transaction<T> | ClientError {
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
