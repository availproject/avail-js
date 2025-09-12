import { ClientError } from "./error"
import { BN, H256 } from "./types"
import { ExtrinsicSignature } from "./types/metadata"
import { Client } from "./clients/main_client"
import { IEvent, IHeader, IHeaderAndDecodable } from "./interface"
import { EncodeSelector, TransactionFilterOptions, ExtrinsicInfo, SignerPayload } from "./rpc/system/fetch_extrinsics"
import { avail } from "."
import { Extrinsic, SignedExtrinsic } from "./transaction"

import { BlockPhaseEvent } from "./rpc/system/fetch_events"
export { BlockPhaseEvent } from "./rpc/system/fetch_events"

export class Block {
  /** Decoded signed extrinsics */
  readonly sxt: BSxt
  /** Decoded extrinsics. Can be signed or unsigned */
  readonly ext: BExt
  /** Raw extrinsics */
  readonly rxt: BRxt
  /** Events */
  readonly event: BEvent

  constructor(client: Client, blockId: H256 | string | number) {
    this.rxt = new BRxt(client, blockId)
    this.sxt = new BSxt(this.rxt, blockId)
    this.ext = new BExt(this.rxt, blockId)
    this.event = new BEvent(client, blockId)
  }
}

class BSxt {
  constructor(
    private readonly bExt: BRxt,
    private readonly blockId: H256 | string | number,
  ) {}

  async get<T>(
    as: IHeaderAndDecodable<T>,
    transactionId: H256 | string | number,
    retryOnError: boolean = true,
  ): Promise<BlockSignedExtrinsic<T> | null | ClientError> {
    let txFilter: TransactionFilterOptions
    if (transactionId instanceof H256 || typeof transactionId === "string") {
      txFilter = { TxHash: [transactionId.toString()] }
    } else {
      txFilter = { TxIndex: [transactionId] }
    }

    return await this.first(as, { filter: txFilter, retryOnError })
  }

  async first<T>(
    as: IHeaderAndDecodable<T>,
    opts?: BlockExtOpts1,
  ): Promise<BlockSignedExtrinsic<T> | null | ClientError> {
    const result = await this.all(as, opts)
    if (result instanceof ClientError) return result
    return result.length > 0 ? result[0] : null
  }

  async last<T>(
    as: IHeaderAndDecodable<T>,
    opts?: BlockExtOpts1,
  ): Promise<BlockSignedExtrinsic<T> | null | ClientError> {
    const result = await this.all(as, opts)
    if (result instanceof ClientError) return result
    return result.length > 0 ? result[result.length - 1] : null
  }

  async all<T>(as: IHeaderAndDecodable<T>, opts?: BlockExtOpts1): Promise<BlockSignedExtrinsic<T>[] | ClientError> {
    opts = opts === undefined ? {} : opts
    const opts2: BlockExtOpts2 = opts

    if (opts2.filter === undefined) {
      opts2.filter = { PalletCall: [[as.palletId(), as.variantId()]] }
    }
    opts2.encodeAs = "Extrinsic"

    const infos = await this.bExt.all(opts2)
    if (infos instanceof ClientError) return infos

    const result: BlockSignedExtrinsic<T>[] = []
    for (const info of infos) {
      const transaction = toBlockSignedExtrinsic(as, info, this.blockId)
      if (transaction instanceof ClientError) return transaction
      result.push(transaction)
    }

    return result
  }

  async count<T>(as: IHeaderAndDecodable<T>, opts?: BlockExtOpts1): Promise<number | ClientError> {
    opts = opts === undefined ? {} : opts
    const opts2: BlockExtOpts2 = opts

    if (opts2.filter === undefined) {
      opts2.filter = { PalletCall: [[as.palletId(), as.variantId()]] }
    }
    opts2.encodeAs = "None"

    const infos = await this.bExt.all(opts2)
    if (infos instanceof ClientError) return infos

    return infos.length
  }

  async exists<T>(as: IHeaderAndDecodable<T>, opts?: BlockExtOpts1): Promise<boolean | ClientError> {
    const count = await this.count(as, opts)
    if (count instanceof ClientError) return count
    return count > 0
  }
}

class BExt {
  constructor(
    private readonly bExt: BRxt,
    private readonly blockId: H256 | string | number,
  ) {}

  async get<T>(
    as: IHeaderAndDecodable<T>,
    transactionId: H256 | string | number,
    retryOnError: boolean = true,
  ): Promise<BlockExtrinsic<T> | null | ClientError> {
    let txFilter: TransactionFilterOptions
    if (transactionId instanceof H256 || typeof transactionId === "string") {
      txFilter = { TxHash: [transactionId.toString()] }
    } else {
      txFilter = { TxIndex: [transactionId] }
    }

    return await this.first(as, { filter: txFilter, retryOnError })
  }

  async first<T>(as: IHeaderAndDecodable<T>, opts?: BlockExtOpts1): Promise<BlockExtrinsic<T> | null | ClientError> {
    const result = await this.all(as, opts)
    if (result instanceof ClientError) return result
    return result.length > 0 ? result[0] : null
  }

  async last<T>(as: IHeaderAndDecodable<T>, opts?: BlockExtOpts1): Promise<BlockExtrinsic<T> | null | ClientError> {
    const result = await this.all(as, opts)
    if (result instanceof ClientError) return result
    return result.length > 0 ? result[result.length - 1] : null
  }

  async all<T>(as: IHeaderAndDecodable<T>, opts?: BlockExtOpts1): Promise<BlockExtrinsic<T>[] | ClientError> {
    opts = opts === undefined ? {} : opts
    const opts2: BlockExtOpts2 = opts

    if (opts2.filter === undefined) {
      opts2.filter = { PalletCall: [[as.palletId(), as.variantId()]] }
    }
    opts2.encodeAs = "Extrinsic"

    const infos = await this.bExt.all(opts2)
    if (infos instanceof ClientError) return infos

    const result: BlockExtrinsic<T>[] = []
    for (const info of infos) {
      const transaction = toBlockExtrinsic(as, info, this.blockId)
      if (transaction instanceof ClientError) return transaction
      result.push(transaction)
    }

    return result
  }

  async count<T>(as: IHeaderAndDecodable<T>, opts?: BlockExtOpts1): Promise<number | ClientError> {
    opts = opts === undefined ? {} : opts
    const opts2: BlockExtOpts2 = opts

    if (opts2.filter === undefined) {
      opts2.filter = { PalletCall: [[as.palletId(), as.variantId()]] }
    }
    opts2.encodeAs = "None"

    const infos = await this.bExt.all(opts2)
    if (infos instanceof ClientError) return infos

    return infos.length
  }

  async exists<T>(as: IHeaderAndDecodable<T>, opts?: BlockExtOpts1): Promise<boolean | ClientError> {
    const count = await this.count(as, opts)
    if (count instanceof ClientError) return count
    return count > 0
  }
}

class BRxt {
  constructor(
    private readonly client: Client,
    private readonly blockId: H256 | string | number,
  ) {}

  async get(
    transactionId: H256 | string | number,
    encodeAs?: EncodeSelector,
    retryOnError: boolean = true,
  ): Promise<BlockRawExtrinsic | null | ClientError> {
    let transactionFilter: TransactionFilterOptions = "All"
    if (transactionId instanceof H256 || typeof transactionId === "string") {
      transactionFilter = { TxHash: [transactionId.toString()] }
    } else {
      transactionFilter = { TxIndex: [transactionId] }
    }

    return await this.first({ filter: transactionFilter, encodeAs, retryOnError })
  }

  async first(opts?: BlockExtOpts2): Promise<BlockRawExtrinsic | null | ClientError> {
    const result = await this.all(opts)
    if (result instanceof ClientError) return result
    return result.length > 0 ? result[0] : null
  }

  async last(opts?: BlockExtOpts2): Promise<BlockRawExtrinsic | null | ClientError> {
    const result = await this.all(opts)
    if (result instanceof ClientError) return result
    return result.length > 0 ? result[result.length - 1] : null
  }

  async all(opts?: BlockExtOpts2): Promise<BlockRawExtrinsic[] | ClientError> {
    opts = opts !== undefined ? opts : {}
    if (opts.encodeAs === undefined) {
      opts.encodeAs = "Extrinsic"
    }

    const result = await this.client.rpc.system.fetchExtrinsic(this.blockId, opts, opts.retryOnError)
    if (result instanceof ClientError) return result

    return result.map((info) => {
      const base = new BlockExtrinsicBase(info.txHash, info.txIndex, info.palletId, info.variantId, this.blockId)
      return new BlockRawExtrinsic(info.data, info.signerPayload, base)
    })
  }

  async count(opts?: BlockExtOpts2): Promise<number | ClientError> {
    opts = opts === undefined ? {} : opts
    opts.encodeAs = "None"

    const res = await this.all(opts)
    if (res instanceof ClientError) return res

    return res.length
  }

  async exists(opts?: BlockExtOpts2): Promise<boolean | ClientError> {
    opts = opts === undefined ? {} : opts
    opts.encodeAs = "None"

    const res = await this.first(opts)
    if (res instanceof ClientError) return res

    return res != null
  }
}

class BEvent {
  constructor(
    private readonly client: Client,
    private readonly blockId: H256 | string | number,
  ) {}

  async ext(txIndex: number, retryOnError: boolean = true): Promise<ExtrinsicEvents | null | ClientError> {
    const result = await this.block({
      filter: { Only: [txIndex] },
      enableEncoding: true,
      enableDecoding: false,
      retryOnError,
    })

    if (result instanceof ClientError) return result
    if (result.length == 0) return null

    const events: ExtrinsicEvent[] = []
    for (const event of result[0].events) {
      if (event.encodedData == null) return new ClientError("Fetch events endpoint returned an event with no data.")
      events.push({ index: event.index, palletId: event.palletId, variantId: event.variantId, data: event.encodedData })
    }

    return new ExtrinsicEvents(events)
  }

  async block(opts?: BlockEventsOptions): Promise<BlockPhaseEvent[] | ClientError> {
    const result = await this.client.rpc.system.fetchEvents(this.blockId, opts, opts?.retryOnError)
    if (result instanceof ClientError) return result

    return result
  }
}

export interface BlockExtOpts1 {
  filter?: TransactionFilterOptions
  ss58Address?: string
  appId?: number
  nonce?: number
  retryOnError?: boolean
}

export interface BlockExtOpts2 extends BlockExtOpts1 {
  encodeAs?: EncodeSelector
}

export interface BlockEventsOptions {
  filter?: "All" | "OnlyExtrinsics" | "OnlyNonExtrinsics" | { Only: number[] }
  enableEncoding?: boolean
  enableDecoding?: boolean
  retryOnError?: boolean
}

export class BlockExtrinsicBase {
  constructor(
    public readonly txHash: H256,
    public readonly txIndex: number,
    public readonly palletId: number,
    public readonly variantId: number,
    public readonly blockId: H256 | string | number,
  ) {}

  async events(client: Client): Promise<ExtrinsicEvents | ClientError> {
    const events = await new BEvent(client, this.blockId).ext(this.txIndex, true)
    if (events instanceof ClientError) return events
    if (events == null) return new ClientError("No events found for extrinsic")

    return events
  }
}

/**
 * Decoded and signed block extrinsic.
 */
export class BlockSignedExtrinsic<T> extends BlockExtrinsicBase {
  constructor(
    public readonly signature: ExtrinsicSignature,
    public readonly call: T,
    base: BlockExtrinsicBase,
  ) {
    super(base.txHash, base.txIndex, base.palletId, base.variantId, base.blockId)
  }

  appId(): number {
    return this.signature.extra.appId
  }

  nonce(): number {
    return this.signature.extra.nonce
  }

  tip(): BN {
    return this.signature.extra.tip
  }

  ss58Address(): string | null {
    if ("Id" in this.signature.signer.value) {
      return this.signature.signer.value.Id.toSS58()
    }
    return null
  }
}

/**
 * Decoded block extrinsic. Can be signed or unsigned
 */
export class BlockExtrinsic<T> extends BlockExtrinsicBase {
  constructor(
    public readonly signature: ExtrinsicSignature | null,
    public readonly call: T,
    base: BlockExtrinsicBase,
  ) {
    super(base.txHash, base.txIndex, base.palletId, base.variantId, base.blockId)
  }

  appId(): number | null {
    if (this.signature == null) return null
    return this.signature.extra.appId
  }

  nonce(): number | null {
    if (this.signature == null) return null
    return this.signature.extra.nonce
  }

  tip(): BN | null {
    if (this.signature == null) return null
    return this.signature.extra.tip
  }

  ss58Address(): string | null {
    if (this.signature == null) return null

    if ("Id" in this.signature.signer.value) {
      return this.signature.signer.value.Id.toSS58()
    }

    return null
  }
}

/**
 * Raw block extrinsic. Can be signed or unsigned
 */
export class BlockRawExtrinsic extends BlockExtrinsicBase {
  constructor(
    // Hex and SCALE encoded without "0x"
    public readonly data: string | null,
    public readonly signerPayload: SignerPayload | null,
    base: BlockExtrinsicBase,
  ) {
    super(base.txHash, base.txIndex, base.palletId, base.variantId, base.blockId)
  }

  appId(): number | null {
    if (this.signerPayload == null) return null
    return this.signerPayload.appId
  }

  nonce(): number | null {
    if (this.signerPayload == null) return null
    return this.signerPayload.nonce
  }

  ss58Address(): string | null {
    if (this.signerPayload == null) return null

    return this.signerPayload.ss58Address
  }
}

export interface ExtrinsicEvent {
  index: number
  palletId: number
  variantId: number
  data: string
}

export class ExtrinsicEvents {
  constructor(public readonly events: ExtrinsicEvent[]) {}

  first<T>(as: IHeaderAndDecodable<T>): T | null
  first<T>(as: IHeaderAndDecodable<T>, unsafe: true): T
  first<T>(as: IHeaderAndDecodable<T>, unsafe?: boolean): T | null {
    const pos = this.events.findIndex((v) => v.palletId == as.palletId() && v.variantId == as.variantId())
    if (pos == -1) {
      if (unsafe) throw new Error(`Failed to find event with palletId: ${as.palletId()}, variantId: ${as.variantId()}`)
      return null
    }

    const decoded = IEvent.decode(as, this.events[pos].data, true)
    if (decoded instanceof ClientError) {
      if (unsafe === true) throw decoded
      return null
    }

    return decoded
  }

  last<T>(as: IHeaderAndDecodable<T>): T | null
  last<T>(as: IHeaderAndDecodable<T>, unsafe: true): T
  last<T>(as: IHeaderAndDecodable<T>, unsafe?: boolean): T | null {
    if (this.events.length == 0) return null

    for (let i = this.events.length - 1; i >= 0; --i) {
      if (this.events[i].palletId != as.palletId() || this.events[i].variantId != as.variantId()) {
        continue
      }

      const decoded = IEvent.decode(as, this.events[i].data, true)
      if (decoded instanceof ClientError) {
        if (unsafe === true) throw decoded
        return null
      }
      return decoded
    }

    if (unsafe) throw new Error(`Failed to find event with palletId: ${as.palletId()}, variantId: ${as.variantId()}`)
    return null
  }

  all<T>(as: IHeaderAndDecodable<T>): T[] | ClientError
  all<T>(as: IHeaderAndDecodable<T>, unsafe: true): T[]
  all<T>(as: IHeaderAndDecodable<T>, unsafe?: boolean): T[] | ClientError {
    const result = []

    for (const event of this.events) {
      if (!(event.palletId == as.palletId() && event.variantId == as.variantId())) {
        continue
      }

      const decoded = IEvent.decode(as, event.data, true)
      if (decoded instanceof ClientError) {
        if (unsafe === true) throw decoded

        return decoded
      }

      result.push(decoded)
    }

    return result
  }

  isExtrinsicSuccessPresent(): boolean {
    return this.exists(avail.system.events.ExtrinsicSuccess)
  }

  isExtrinsicFailedPresent(): boolean {
    return this.exists(avail.system.events.ExtrinsicFailed)
  }

  proxyExecutedSuccessfully(): boolean | null {
    const executed = this.first(avail.proxy.events.ProxyExecuted)
    if (executed == null) return null
    return executed.result == "Ok"
  }

  multisigExecutedSuccessfully(): boolean | null {
    const executed = this.first(avail.multisig.events.MultisigExecuted)
    if (executed == null) return null
    return executed.result == "Ok"
  }

  exists(as: IHeader): boolean
  exists(palletId: number, variantId: number): boolean
  exists(first: number | IHeader, second?: number): boolean {
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
export function toBlockExtrinsic<T>(
  as: IHeaderAndDecodable<T>,
  info: ExtrinsicInfo,
  blockId: H256 | string | number,
): BlockExtrinsic<T> | ClientError {
  if (info.data == null) return new ClientError("Fetch extrinsics endpoint returned an extrinsic with no data.")

  const decoded = Extrinsic.decode(as, info.data)
  if (decoded instanceof ClientError) return decoded

  const base = new BlockExtrinsicBase(info.txHash, info.txIndex, info.palletId, info.variantId, blockId)

  return new BlockExtrinsic(decoded.signature, decoded.call, base)
}

/** @internal */
export function toBlockSignedExtrinsic<T>(
  as: IHeaderAndDecodable<T>,
  info: ExtrinsicInfo,
  blockId: H256 | string | number,
): BlockSignedExtrinsic<T> | ClientError {
  if (info.data == null) return new ClientError("Fetch extrinsics endpoint returned an extrinsic with no data.")

  const decoded = SignedExtrinsic.decode(as, info.data)
  if (decoded instanceof ClientError) return decoded

  const base = new BlockExtrinsicBase(info.txHash, info.txIndex, info.palletId, info.variantId, blockId)
  return new BlockSignedExtrinsic(decoded.signature, decoded.call, base)
}
