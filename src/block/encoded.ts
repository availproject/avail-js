import type { Client } from "../client"
import { RawExtrinsic } from "../core/extrinsic"
import { ICall, type IHeader, type IHeaderAndDecodable } from "../core/interface"
import { type ExtrinsicSignature, H256 } from "../core/metadata"
import { AvailError } from "../core/misc/error"
import type { BN } from "../core/misc/polkadot"
import type { ExtrinsicInfo } from "../core/rpc"
import { type BlockEvents, BlockEventsQuery } from "./events"
import { BlockExtrinsic } from "./extrinsic"
import { type Options, toRpcOptions } from "./extrinsic_options"
import { BlockContext, BlockExtrinsicMetadata } from "./shared"
import { BlockSignedExtrinsic } from "./signed"

export class BlockEncodedExtrinsicsQuery {
  private ctx: BlockContext
  constructor(client: Client, blockId: H256 | string | number) {
    this.ctx = new BlockContext(client, blockId)
  }

  async get(extrinsicId: H256 | string | number): Promise<BlockEncodedExtrinsic | null | AvailError> {
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

    return await this.first(opts)
  }

  async first(opts?: Options): Promise<BlockEncodedExtrinsic | null | AvailError> {
    const opts2 = opts ?? {}
    const options = toRpcOptions(opts2, "Extrinsic")

    const blockId = this.ctx.hashNumber()
    if (blockId instanceof AvailError) return blockId

    const chain = this.ctx.chain()
    const result = await chain.systemFetchExtrinsics(blockId, options)
    if (result instanceof AvailError) return result
    if (result.length == 0) return null

    const info = result[0]
    const ext = BlockEncodedExtrinsic.fromExtrinsicInfo(info, blockId)
    if (ext instanceof AvailError) return ext

    return ext
  }

  async last(opts?: Options): Promise<BlockEncodedExtrinsic | null | AvailError> {
    const opts2 = opts ?? {}
    const options = toRpcOptions(opts2, "Extrinsic")

    const blockId = this.ctx.hashNumber()
    if (blockId instanceof AvailError) return blockId

    const chain = this.ctx.chain()
    const result = await chain.systemFetchExtrinsics(blockId, options)
    if (result instanceof AvailError) return result
    if (result.length == 0) return null

    const info = result[result.length - 1]
    const ext = BlockEncodedExtrinsic.fromExtrinsicInfo(info, blockId)
    if (ext instanceof AvailError) return ext

    return ext
  }

  async all(opts?: Options): Promise<BlockEncodedExtrinsic[] | AvailError> {
    const opts2 = opts ?? {}
    const options = toRpcOptions(opts2, "Extrinsic")

    const blockId = this.ctx.hashNumber()
    if (blockId instanceof AvailError) return blockId

    const chain = this.ctx.chain()
    const infos = await chain.systemFetchExtrinsics(blockId, options)
    if (infos instanceof AvailError) return infos
    if (infos.length == 0) return []

    const result = []
    for (const info of infos) {
      const ext = BlockEncodedExtrinsic.fromExtrinsicInfo(info, blockId)
      if (ext instanceof AvailError) return ext

      result.push(ext)
    }

    return result
  }

  async count(opts?: Options): Promise<number | AvailError> {
    const opts2 = opts ?? {}
    const options = toRpcOptions(opts2, "None")

    const chain = this.ctx.chain()
    const infos = await chain.systemFetchExtrinsics(this.ctx.blockId, options)
    if (infos instanceof AvailError) return infos

    return infos.length
  }

  async exists(opts?: Options): Promise<boolean | AvailError> {
    const count = await this.count(opts)
    if (count instanceof AvailError) return count

    return count > 0
  }

  setRetryOnError(value: boolean | null) {
    this.ctx.setRetryOnError(value)
  }

  shouldRetryOnError(): boolean {
    return this.ctx.shouldRetryOnError()
  }
}

/**
 * Raw block extrinsic. Can be signed or unsigned
 */
export class BlockEncodedExtrinsic {
  constructor(
    // Hex and SCALE encoded without "0x"
    readonly signature: ExtrinsicSignature | null,
    readonly call: Uint8Array,
    readonly metadata: BlockExtrinsicMetadata,
  ) { }

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

  asExtrinsic<T>(as: IHeaderAndDecodable<T>): AvailError | BlockExtrinsic<T> {
    const call = ICall.decode(as, this.call, true)
    if (call instanceof AvailError) return call
    return new BlockExtrinsic(this.signature, call, this.metadata)
  }

  asSigned<T>(as: IHeaderAndDecodable<T>): AvailError | BlockSignedExtrinsic<T> {
    const extrinsic = this.asExtrinsic(as)
    if (extrinsic instanceof AvailError) return extrinsic
    if (extrinsic.signature == null) return new AvailError("Extrinsic is unsigned; expected a signature.")
    return new BlockSignedExtrinsic(extrinsic.signature, extrinsic.call, extrinsic.metadata)
  }

  is(as: IHeader): boolean {
    return this.metadata.palletId == as.palletId() && this.metadata.variantId == as.variantId()
  }

  header(): [number, number] {
    return [this.metadata.palletId, this.metadata.variantId]
  }

  static fromExtrinsicInfo(info: ExtrinsicInfo, blockId: H256 | number): AvailError | BlockEncodedExtrinsic {
    if (info.data == null) return new AvailError("Expected data for encoded extrinsic")

    const extrinsic = RawExtrinsic.decode(info.data)
    if (extrinsic instanceof AvailError) return extrinsic

    const metadata = BlockExtrinsicMetadata.fromExtrinsicInfo(info, blockId)
    return new BlockEncodedExtrinsic(extrinsic.signature, extrinsic.call, metadata)
  }
}
