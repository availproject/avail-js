import type { Client } from "../client"
import type { IHeader, IHeaderAndDecodable } from "../core/interface"
import { ExtrinsicSignature, H256 } from "../core/metadata"
import { AvailError } from "../core/misc/error"
import type { BN } from "../core/misc/polkadot"
import type { ExtrinsicInfo } from "../core/rpc"
import { BlockEncodedExtrinsic, BlockEncodedExtrinsicsQuery } from "./encoded"
import { BlockEvents, BlockEventsQuery } from "./events"
import type { Options } from "./extrinsic_options"
import type { BlockExtrinsicMetadata } from "./shared"
import { BlockSignedExtrinsic } from "./signed"

export class BlockExtrinsicsQuery {
  private xt: BlockEncodedExtrinsicsQuery
  constructor(client: Client, blockId: H256 | string | number) {
    this.xt = new BlockEncodedExtrinsicsQuery(client, blockId)
  }

  async get<T>(
    as: IHeaderAndDecodable<T>,
    extrinsicId: H256 | string | number,
  ): Promise<BlockExtrinsic<T> | null | AvailError> {
    if (typeof extrinsicId === "string") {
      const hash = H256.from(extrinsicId)
      if (hash instanceof AvailError) return hash
      extrinsicId = hash
    }

    const opts: Options = {}
    if (typeof extrinsicId === "number") {
      opts.filter = { TxIndex: [extrinsicId] }
    } else {
      opts.filter = { TxHash: [extrinsicId.toString()] }
    }

    return await this.first(as, opts)
  }

  async first<T>(as: IHeaderAndDecodable<T>, opts?: Options): Promise<BlockExtrinsic<T> | null | AvailError> {
    const opts2 = opts ?? {}
    opts2.filter = opts2.filter ?? { PalletCall: [[as.palletId(), as.variantId()]] }

    const encoded = await this.xt.first(opts2)
    if (encoded instanceof AvailError) return encoded
    if (encoded == null) return null

    return encoded.asExtrinsic(as)
  }

  async last<T>(as: IHeaderAndDecodable<T>, opts?: Options): Promise<BlockExtrinsic<T> | null | AvailError> {
    const opts2 = opts ?? {}
    opts2.filter = opts2.filter ?? { PalletCall: [[as.palletId(), as.variantId()]] }

    const encoded = await this.xt.last(opts2)
    if (encoded instanceof AvailError) return encoded
    if (encoded == null) return null

    return encoded.asExtrinsic(as)
  }

  async all<T>(as: IHeaderAndDecodable<T>, opts?: Options): Promise<BlockExtrinsic<T>[] | AvailError> {
    const opts2 = opts ?? {}
    opts2.filter = opts2.filter ?? { PalletCall: [[as.palletId(), as.variantId()]] }

    const all = await this.xt.all(opts2)
    if (all instanceof AvailError) return all

    const result = []
    for (const encoded of all) {
      const ext = encoded.asExtrinsic(as)
      if (ext instanceof AvailError) return ext

      result.push(ext)
    }

    return result
  }

  async count(as: IHeader, opts?: Options): Promise<number | AvailError> {
    const opts2 = opts ?? {}
    opts2.filter = { PalletCall: [[as.palletId(), as.variantId()]] }
    return await this.xt.count(opts2)
  }

  async exists(as: IHeader, opts?: Options): Promise<boolean | AvailError> {
    const count = await this.count(as, opts)
    if (count instanceof AvailError) return count
    return count > 0
  }

  setRetryOnError(value: boolean | null) {
    this.xt.setRetryOnError(value)
  }

  shouldRetryOnError(): boolean {
    return this.xt.shouldRetryOnError()
  }
}

/**
 * Raw block extrinsic. Can be signed or unsigned
 */
export class BlockExtrinsic<T> {
  constructor(
    // Hex and SCALE encoded without "0x"
    readonly signature: ExtrinsicSignature | null,
    readonly call: T,
    readonly metadata: BlockExtrinsicMetadata,
  ) {}

  async events(client: Client): Promise<BlockEvents | AvailError> {
    const query = new BlockEventsQuery(client, this.metadata.blockId)
    const events = await query.extrinsic(this.extIndex())
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
    if (!("Id" in this.signature.address)) return null

    return this.signature.address.Id.toSS58()
  }

  asSigned(): AvailError | BlockSignedExtrinsic<T> {
    if (this.signature == null) return new AvailError("Extrinsic is unsigned; expected a signature.")
    return new BlockSignedExtrinsic(this.signature, this.call, this.metadata)
  }

  is(as: IHeader): boolean {
    return this.metadata.palletId == as.palletId() && this.metadata.variantId == as.variantId()
  }

  header(): [number, number] {
    return [this.metadata.palletId, this.metadata.variantId]
  }

  static fromExtrinsicInfo<T>(
    as: IHeaderAndDecodable<T>,
    info: ExtrinsicInfo,
    blockId: H256 | number,
  ): AvailError | BlockExtrinsic<T> {
    const encoded = BlockEncodedExtrinsic.fromExtrinsicInfo(info, blockId)
    if (encoded instanceof AvailError) return encoded
    return encoded.asExtrinsic(as)
  }
}
