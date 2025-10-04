import type { Client } from "./client"
import { avail } from "./core"
import { Extrinsic } from "./core/extrinsic"
import { IEvent, IHeader, IHeaderAndDecodable } from "./core/interface"
import type { ExtrinsicSignature, GrandpaJustification } from "./core/metadata"
import { H256 } from "./core/metadata"
import type { BlockPhaseEvent } from "./core/rpc/system/fetch_events"
import type {
  EncodeSelector,
  ExtrinsicFilterOptions,
  ExtrinsicInfo,
  SignerPayload,
} from "./core/rpc/system/fetch_extrinsics"
import { AvailError } from "./core/misc/error"
import type { BN } from "./core/misc/polkadot"

export class BlockApi {
  private client: Client
  private blockId: H256 | string | number
  private retryOnError: boolean | null = null

  constructor(client: Client, blockId: H256 | string | number) {
    this.client = client
    this.blockId = blockId
  }

  tx(): BlockWithTx {
    return new BlockWithTx(this.client, this.blockId)
  }
  ext(): BlockWithExt {
    return new BlockWithExt(this.client, this.blockId)
  }
  raw_ext(): BlockWithRawExt {
    return new BlockWithRawExt(this.client, this.blockId)
  }
  events(): BlockEvents {
    return new BlockEvents(this.client, this.blockId)
  }

  setRetryOnError(value: boolean | null) {
    this.retryOnError = value
  }

  async justification(): Promise<GrandpaJustification | null | AvailError> {
    const retry = this.retryOnError

    let blockId = to_hash_number(this.blockId)
    if (blockId instanceof AvailError) return blockId
    if (blockId instanceof H256) {
      const height = await this.client.chain().retryOn(retry, null).blockHeight(blockId)
      if (height instanceof AvailError) return height
      if (height == null) return new AvailError("Failed to find block from the provided hash")
      blockId = height
    }

    return await this.client.chain().retryOn(retry, null).grandpaBlockJustificationJson(blockId)
  }
}

export class BlockWithRawExt {
  constructor(
    private readonly client: Client,
    private readonly blockId: H256 | string | number,
    private retryOnError: boolean | null = null,
  ) {}

  async get(
    extrinsicId: H256 | string | number,
    encodeAs?: EncodeSelector,
  ): Promise<BlockRawExtrinsic | null | AvailError> {
    let filter: ExtrinsicFilterOptions = "All"
    if (extrinsicId instanceof H256 || typeof extrinsicId === "string") {
      filter = { TxHash: [extrinsicId.toString()] }
    } else {
      filter = { TxIndex: [extrinsicId] }
    }

    return await this.first({ filter, encodeAs })
  }

  async first(opts?: BlockWithRawExt.Options): Promise<BlockRawExtrinsic | null | AvailError> {
    const retry = this.retryOnError

    opts = opts === undefined ? {} : opts
    if (opts.encodeAs === undefined) {
      opts.encodeAs = "Extrinsic"
    }

    const blockId = to_hash_number(this.blockId)
    if (blockId instanceof AvailError) return blockId

    const infos = await this.client.chain().retryOn(retry, null).systemFetchExtrinsic(blockId, opts)
    if (infos instanceof AvailError) return infos

    if (infos.length == 0) {
      return null
    }

    const info = infos[0]
    const metadata = new BlockExtrinsicMetadata(info.extHash, info.extIndex, info.palletId, info.variantId, blockId)
    return new BlockRawExtrinsic(info.data, metadata, info.signerPayload)
  }

  async last(opts?: BlockWithRawExt.Options): Promise<BlockRawExtrinsic | null | AvailError> {
    const retry = this.retryOnError

    opts = opts === undefined ? {} : opts
    if (opts.encodeAs === undefined) {
      opts.encodeAs = "Extrinsic"
    }

    const blockId = to_hash_number(this.blockId)
    if (blockId instanceof AvailError) return blockId

    const infos = await this.client.chain().retryOn(retry, null).systemFetchExtrinsic(blockId, opts)
    if (infos instanceof AvailError) return infos

    if (infos.length == 0) {
      return null
    }

    const info = infos[infos.length - 1]
    const metadata = new BlockExtrinsicMetadata(info.extHash, info.extIndex, info.palletId, info.variantId, blockId)
    return new BlockRawExtrinsic(info.data, metadata, info.signerPayload)
  }

  async all(opts?: BlockWithRawExt.Options): Promise<BlockRawExtrinsic[] | AvailError> {
    const retry = this.retryOnError

    opts = opts === undefined ? {} : opts
    if (opts.encodeAs === undefined) {
      opts.encodeAs = "Extrinsic"
    }

    const blockId = to_hash_number(this.blockId)
    if (blockId instanceof AvailError) return blockId

    const result = await this.client.chain().retryOn(retry, null).systemFetchExtrinsic(blockId, opts)
    if (result instanceof AvailError) return result

    return result.map((info) => {
      const metadata = new BlockExtrinsicMetadata(info.extHash, info.extIndex, info.palletId, info.variantId, blockId)
      return new BlockRawExtrinsic(info.data, metadata, info.signerPayload)
    })
  }

  async count(opts?: BlockWithRawExt.Options): Promise<number | AvailError> {
    opts = opts === undefined ? {} : opts
    opts.encodeAs = "None"

    const res = await this.all(opts)
    if (res instanceof AvailError) return res

    return res.length
  }

  async exists(opts?: BlockWithRawExt.Options): Promise<boolean | AvailError> {
    opts = opts === undefined ? {} : opts
    opts.encodeAs = "None"

    const res = await this.first(opts)
    if (res instanceof AvailError) return res

    return res != null
  }

  setRetryOnError(value: boolean | null) {
    this.retryOnError = value
  }
}

export namespace BlockWithRawExt {
  export type Options = {
    filter?: ExtrinsicFilterOptions
    ss58Address?: string
    appId?: number
    nonce?: number
    encodeAs?: EncodeSelector
  }
}

export class BlockWithExt {
  private readonly rxt: BlockWithRawExt
  constructor(client: Client, blockId: H256 | string | number) {
    this.rxt = new BlockWithRawExt(client, blockId)
  }

  async get<T>(
    as: IHeaderAndDecodable<T>,
    extrinsicId: H256 | string | number,
  ): Promise<BlockExtrinsic<T> | null | AvailError> {
    let txFilter: ExtrinsicFilterOptions
    if (extrinsicId instanceof H256 || typeof extrinsicId === "string") {
      txFilter = { TxHash: [extrinsicId.toString()] }
    } else {
      txFilter = { TxIndex: [extrinsicId] }
    }

    return await this.first(as, { filter: txFilter })
  }

  async first<T>(
    as: IHeaderAndDecodable<T>,
    opts?: BlockWithExt.Options,
  ): Promise<BlockExtrinsic<T> | null | AvailError> {
    opts = opts === undefined ? {} : opts
    const opts2: BlockWithRawExt.Options = opts

    if (opts2.filter === undefined) {
      opts2.filter = { PalletCall: [[as.palletId(), as.variantId()]] }
    }
    opts2.encodeAs = "Extrinsic"

    const rawExt = await this.rxt.first(opts2)
    if (rawExt instanceof AvailError || rawExt == null) return rawExt

    const ext = BlockExtrinsic.fromBlockRawExt(as, rawExt)
    return ext
  }

  async last<T>(
    as: IHeaderAndDecodable<T>,
    opts?: BlockWithExt.Options,
  ): Promise<BlockExtrinsic<T> | null | AvailError> {
    opts = opts === undefined ? {} : opts
    const opts2: BlockWithRawExt.Options = opts

    if (opts2.filter === undefined) {
      opts2.filter = { PalletCall: [[as.palletId(), as.variantId()]] }
    }
    opts2.encodeAs = "Extrinsic"

    const rawExt = await this.rxt.last(opts2)
    if (rawExt instanceof AvailError || rawExt == null) return rawExt

    const ext = BlockExtrinsic.fromBlockRawExt(as, rawExt)
    return ext
  }

  async all<T>(as: IHeaderAndDecodable<T>, opts?: BlockWithExt.Options): Promise<BlockExtrinsic<T>[] | AvailError> {
    opts = opts === undefined ? {} : opts
    const opts2: BlockWithRawExt.Options = opts

    if (opts2.filter === undefined) {
      opts2.filter = { PalletCall: [[as.palletId(), as.variantId()]] }
    }
    opts2.encodeAs = "Extrinsic"

    const rawExts = await this.rxt.all(opts2)
    if (rawExts instanceof AvailError) return rawExts

    const result: BlockExtrinsic<T>[] = []
    for (const rawExt of rawExts) {
      if (rawExt.data == null) {
        return new AvailError("Fetched raw extrinsic had no data.")
      }
      const ext = BlockExtrinsic.fromBlockRawExt(as, rawExt)
      if (ext instanceof AvailError) return ext
      result.push(ext)
    }

    return result
  }

  async count<T>(as: IHeaderAndDecodable<T>, opts?: BlockWithExt.Options): Promise<number | AvailError> {
    opts = opts === undefined ? {} : opts
    const opts2: BlockWithRawExt.Options = opts

    if (opts2.filter === undefined) {
      opts2.filter = { PalletCall: [[as.palletId(), as.variantId()]] }
    }
    opts2.encodeAs = "None"

    const infos = await this.rxt.all(opts2)
    if (infos instanceof AvailError) return infos

    return infos.length
  }

  async exists<T>(as: IHeaderAndDecodable<T>, opts?: BlockWithExt.Options): Promise<boolean | AvailError> {
    const count = await this.count(as, opts)
    if (count instanceof AvailError) return count
    return count > 0
  }

  setRetryOnError(value: boolean | null) {
    this.rxt.setRetryOnError(value)
  }
}

export namespace BlockWithExt {
  export type Options = {
    filter?: ExtrinsicFilterOptions
    ss58Address?: string
    appId?: number
    nonce?: number
  }
}

export class BlockWithTx {
  private readonly ext: BlockWithExt
  constructor(client: Client, blockId: H256 | string | number) {
    this.ext = new BlockWithExt(client, blockId)
  }

  async get<T>(
    as: IHeaderAndDecodable<T>,
    extrinsicId: H256 | string | number,
  ): Promise<BlockTransaction<T> | null | AvailError> {
    const ext = await this.ext.get(as, extrinsicId)
    if (ext instanceof AvailError || ext == null) return ext

    return BlockTransaction.fromBlockExt(ext)
  }

  async first<T>(
    as: IHeaderAndDecodable<T>,
    opts?: BlockWithTx.Options,
  ): Promise<BlockTransaction<T> | null | AvailError> {
    const ext = await this.ext.first(as, opts)
    if (ext instanceof AvailError || ext == null) return ext

    return BlockTransaction.fromBlockExt(ext)
  }

  async last<T>(
    as: IHeaderAndDecodable<T>,
    opts?: BlockWithExt.Options,
  ): Promise<BlockTransaction<T> | null | AvailError> {
    const ext = await this.ext.last(as, opts)
    if (ext instanceof AvailError || ext == null) return ext

    return BlockTransaction.fromBlockExt(ext)
  }

  async all<T>(as: IHeaderAndDecodable<T>, opts?: BlockWithExt.Options): Promise<BlockTransaction<T>[] | AvailError> {
    const exts = await this.ext.all(as, opts)
    if (exts instanceof AvailError) return exts
    const txs = []
    for (const ext of exts) {
      const tx = BlockTransaction.fromBlockExt(ext)
      if (tx instanceof AvailError) return tx
      txs.push(tx)
    }

    return txs
  }

  async count<T>(as: IHeaderAndDecodable<T>, opts?: BlockWithExt.Options): Promise<number | AvailError> {
    return this.ext.count(as, opts)
  }

  async exists<T>(as: IHeaderAndDecodable<T>, opts?: BlockWithExt.Options): Promise<boolean | AvailError> {
    return this.ext.exists(as, opts)
  }

  setRetryOnError(value: boolean | null) {
    this.ext.setRetryOnError(value)
  }
}

export namespace BlockWithTx {
  export type Options = {
    filter?: ExtrinsicFilterOptions
    ss58Address?: string
    appId?: number
    nonce?: number
  }
}

export class BlockEvents {
  private retryOnError: boolean | null = null
  constructor(
    private readonly client: Client,
    private readonly blockId: H256 | string | number,
  ) {}

  async ext(txIndex: number): Promise<ExtrinsicEvents | null | AvailError> {
    const result = await this.block({
      filter: { Only: [txIndex] },
      enableEncoding: true,
      enableDecoding: false,
    })

    if (result instanceof AvailError) return result
    if (result.length == 0) return null

    const events: ExtrinsicEvent[] = []
    for (const event of result[0].events) {
      if (event.encodedData == null) return new AvailError("Fetch events endpoint returned an event with no data.")
      events.push({ index: event.index, palletId: event.palletId, variantId: event.variantId, data: event.encodedData })
    }

    return new ExtrinsicEvents(events)
  }

  async block(opts?: BlockEvents.Options): Promise<BlockPhaseEvent[] | AvailError> {
    const retry = this.retryOnError

    const result = await this.client.chain().retryOn(retry, null).systemFetchEvents(this.blockId, opts)
    return result
  }

  setRetryOnError(value: boolean | null) {
    this.retryOnError = value
  }
}

export namespace BlockEvents {
  export type Options = {
    filter?: "All" | "OnlyExtrinsics" | "OnlyNonExtrinsics" | { Only: number[] }
    enableEncoding?: boolean
    enableDecoding?: boolean
  }
}

export class BlockExtrinsicMetadata {
  constructor(
    public readonly extHash: H256,
    public readonly extIndex: number,
    public readonly palletId: number,
    public readonly variantId: number,
    public readonly blockId: H256 | number,
  ) {}
}

/**
 * Raw block extrinsic. Can be signed or unsigned
 */
export class BlockRawExtrinsic {
  constructor(
    // Hex and SCALE encoded without "0x"
    readonly data: string | null,
    readonly metadata: BlockExtrinsicMetadata,
    readonly signerPayload: SignerPayload | null,
  ) {}

  async events(client: Client): Promise<ExtrinsicEvents | AvailError> {
    const events = await new BlockEvents(client, this.metadata.blockId).ext(this.extIndex())
    if (events instanceof AvailError) return events
    if (events == null) return new AvailError("No events found for extrinsic")

    return events
  }

  extIndex(): number {
    return this.metadata.extIndex
  }

  extHash(): H256 {
    return this.metadata.extHash
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

  static fromExtrinsicInfo(info: ExtrinsicInfo, blockId: H256 | number): BlockRawExtrinsic {
    const metadata = new BlockExtrinsicMetadata(info.extHash, info.extIndex, info.palletId, info.variantId, blockId)
    return new BlockRawExtrinsic(info.data, metadata, info.signerPayload)
  }
}

/**
 * Decoded block extrinsic. Can be signed or unsigned
 */
export class BlockExtrinsic<T> {
  constructor(
    readonly signature: ExtrinsicSignature | null,
    readonly call: T,
    readonly metadata: BlockExtrinsicMetadata,
  ) {}

  async events(client: Client): Promise<ExtrinsicEvents | AvailError> {
    const events = await new BlockEvents(client, this.metadata.blockId).ext(this.extIndex())
    if (events instanceof AvailError) return events
    if (events == null) return new AvailError("No events found for extrinsic")

    return events
  }

  extIndex(): number {
    return this.metadata.extIndex
  }

  extHash(): H256 {
    return this.metadata.extHash
  }

  appId(): number | null {
    if (this.signature == null) return null
    return this.signature?.extra.appId
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

  static fromBlockRawExt<T>(as: IHeaderAndDecodable<T>, value: BlockRawExtrinsic): BlockExtrinsic<T> | AvailError {
    if (value.data == null) {
      return new AvailError("No data found in raw extrinsic")
    }

    const result = Extrinsic.decode(as, value.data)
    if (result instanceof AvailError) return result

    return new BlockExtrinsic(result.signature, result.call, value.metadata)
  }

  static fromExtrinsicInfo<T>(
    as: IHeaderAndDecodable<T>,
    info: ExtrinsicInfo,
    blockId: H256 | number,
  ): BlockExtrinsic<T> | AvailError {
    const raw_ext = BlockRawExtrinsic.fromExtrinsicInfo(info, blockId)
    return BlockExtrinsic.fromBlockRawExt(as, raw_ext)
  }
}

/**
 * Decoded and signed block extrinsic.
 */
export class BlockTransaction<T> {
  constructor(
    readonly signature: ExtrinsicSignature,
    readonly call: T,
    readonly metadata: BlockExtrinsicMetadata,
  ) {}

  async events(client: Client): Promise<ExtrinsicEvents | AvailError> {
    const events = await new BlockEvents(client, this.metadata.blockId).ext(this.extIndex())
    if (events instanceof AvailError) return events
    if (events == null) return new AvailError("No events found for extrinsic")

    return events
  }

  extIndex(): number {
    return this.metadata.extIndex
  }

  extHash(): H256 {
    return this.metadata.extHash
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

  static fromBlockExt<T>(value: BlockExtrinsic<T>): BlockTransaction<T> | AvailError {
    if (value.signature == null) {
      return new AvailError("No signature found in extrinsic")
    }
    return new BlockTransaction(value.signature, value.call, value.metadata)
  }

  static fromBlockRawExt<T>(as: IHeaderAndDecodable<T>, value: BlockRawExtrinsic): BlockTransaction<T> | AvailError {
    const ext = BlockExtrinsic.fromBlockRawExt(as, value)
    if (ext instanceof AvailError) return ext

    return BlockTransaction.fromBlockExt(ext)
  }

  static fromExtrinsicInfo<T>(
    as: IHeaderAndDecodable<T>,
    info: ExtrinsicInfo,
    blockId: H256 | number,
  ): BlockExtrinsic<T> | AvailError {
    const ext = BlockExtrinsic.fromExtrinsicInfo(as, info, blockId)
    if (ext instanceof AvailError) return ext

    return BlockTransaction.fromBlockExt(ext)
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
    if (decoded instanceof AvailError) {
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
      if (decoded instanceof AvailError) {
        if (unsafe === true) throw decoded
        return null
      }
      return decoded
    }

    if (unsafe) throw new Error(`Failed to find event with palletId: ${as.palletId()}, variantId: ${as.variantId()}`)
    return null
  }

  all<T>(as: IHeaderAndDecodable<T>): T[] | AvailError
  all<T>(as: IHeaderAndDecodable<T>, unsafe: true): T[]
  all<T>(as: IHeaderAndDecodable<T>, unsafe?: boolean): T[] | AvailError {
    const result = []

    for (const event of this.events) {
      if (!(event.palletId == as.palletId() && event.variantId == as.variantId())) {
        continue
      }

      const decoded = IEvent.decode(as, event.data, true)
      if (decoded instanceof AvailError) {
        if (unsafe === true) throw decoded

        return decoded
      }

      result.push(decoded)
    }

    return result
  }

  isExtrinsicSuccessPresent(): boolean {
    return this.is_present(avail.system.events.ExtrinsicSuccess)
  }

  isExtrinsicFailedPresent(): boolean {
    return this.is_present(avail.system.events.ExtrinsicFailed)
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

  is_present(as: IHeader): boolean
  is_present(palletId: number, variantId: number): boolean
  is_present(first: number | IHeader, second?: number): boolean {
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

function to_hash_number(value: H256 | string | number): H256 | number | AvailError {
  if (typeof value === "number") return value
  return H256.from(value)
}
