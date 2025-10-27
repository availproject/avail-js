import type { Client } from "../client"
import type { IHeader, IHeaderAndDecodable } from "../core/interface"
import type { ExtrinsicSignature, H256 } from "../core/metadata"
import { AvailError } from "../core/misc/error"
import type { BN } from "../core/misc/polkadot"
import type { ExtrinsicInfo } from "../core/rpc"
import { BlockEncodedExtrinsic } from "./encoded"
import { type BlockEvents, BlockEventsQuery } from "./events"
import type { BlockExtrinsicMetadata } from "./shared"

// export class BlockSignedExtrinsicsQuery {
//   private xt: BlockExtrinsicsQuery
//   constructor(client: Client, blockId: H256 | string | number) {
//     this.xt = new BlockExtrinsicsQuery(client, blockId)
//   }

//   async get<T>(
//     as: IHeaderAndDecodable<T>,
//     extrinsicId: H256 | string | number,
//   ): Promise<BlockSignedExtrinsic<T> | null | AvailError> {
//     const ext = await this.xt.get(as, extrinsicId)
//     if (ext instanceof AvailError) return ext
//     if (ext == null) return null

//     return ext.asSigned()
//   }

//   async first<T>(as: IHeaderAndDecodable<T>, opts?: Options): Promise<BlockSignedExtrinsic<T> | null | AvailError> {
//     const ext = await this.xt.first(as, opts)
//     if (ext instanceof AvailError) return ext
//     if (ext == null) return null

//     return ext.asSigned()
//   }

//   async last<T>(as: IHeaderAndDecodable<T>, opts?: Options): Promise<BlockSignedExtrinsic<T> | null | AvailError> {
//     const ext = await this.xt.last(as, opts)
//     if (ext instanceof AvailError) return ext
//     if (ext == null) return null

//     return ext.asSigned()
//   }

//   async all<T>(as: IHeaderAndDecodable<T>, opts?: Options): Promise<BlockSignedExtrinsic<T>[] | AvailError> {
//     const extrinsics = await this.xt.all(as, opts)
//     if (extrinsics instanceof AvailError) return extrinsics

//     const result = []
//     for (const ext of extrinsics) {
//       const signed = ext.asSigned()
//       if (signed instanceof AvailError) return signed
//       result.push(signed)
//     }

//     return result
//   }

//   async count(as: IHeader, opts?: Options): Promise<number | AvailError> {
//     return await this.xt.count(as, opts)
//   }

//   async exists(as: IHeader, opts?: Options): Promise<boolean | AvailError> {
//     return await this.xt.exists(as, opts)
//   }

//   setRetryOnError(value: boolean | null) {
//     this.xt.setRetryOnError(value)
//   }

//   shouldRetryOnError(): boolean {
//     return this.xt.shouldRetryOnError()
//   }
// }

export class BlockSignedExtrinsic<T> {
  constructor(
    // Hex and SCALE encoded without "0x"
    readonly signature: ExtrinsicSignature,
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
  ): AvailError | BlockSignedExtrinsic<T> {
    const encoded = BlockEncodedExtrinsic.fromExtrinsicInfo(info, blockId)
    if (encoded instanceof AvailError) return encoded
    return encoded.asSigned(as)
  }
}
