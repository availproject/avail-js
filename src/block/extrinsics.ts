import type { AllowedExtrinsic, SignatureFilter, DataFormat, Extrinsic as RpcExtrinsic } from "../core/rpc/custom"
import type { H256 } from "../core/types"
import type { Client } from "../client/client"
import { Extrinsic as CoreExtrinsic } from "../core"
import { ICall, IHeader, scaleDecodeExtrinsicCall, type IHeaderAndDecodable } from "../core/interface"
import { NotFoundError } from "../errors/sdk-error"
import { ErrorOperation } from "../errors/operations"
import { BN } from "../core/polkadot"
import { BlockEvents, BlockEventsQuery } from "./events"
import { BlockContext } from "./shared"
import { BlockAt, blockAtToHashOrNumber } from "../types"
import { Preamble } from "../core/extrinsic"

export class BlockExtrinsicsQuery {
  constructor(private readonly ctx: BlockContext) {}

  async all(allowList?: AllowedExtrinsic[], sigFilter?: SignatureFilter): Promise<UntypedExtrinsic[]> {
    const at = blockAtToHashOrNumber(this.ctx.at)
    const infos = await this.ctx.chain().extrinsics(at, allowList ?? null, sigFilter ?? {}, "Extrinsic")
    return infos.map((x) => UntypedExtrinsic.fromRpcExtrinsic(x, at))
  }

  async get(extrinsicId: number | string): Promise<UntypedExtrinsic | null> {
    const filter: AllowedExtrinsic =
      typeof extrinsicId === "number" ? { TxIndex: extrinsicId } : { TxHash: extrinsicId }
    return this.first([filter])
  }

  async byHash(hash: string): Promise<UntypedExtrinsic | null> {
    return this.get(hash)
  }

  async first(allowList?: AllowedExtrinsic[], sigFilter?: SignatureFilter): Promise<UntypedExtrinsic | null> {
    const all = await this.all(allowList, sigFilter)
    return all[0] ?? null
  }

  async last(allowList?: AllowedExtrinsic[], sigFilter?: SignatureFilter): Promise<UntypedExtrinsic | null> {
    const all = await this.all(allowList, sigFilter)
    return all.at(-1) ?? null
  }

  async count(allowList?: AllowedExtrinsic[] | null, sigFilter?: SignatureFilter): Promise<number> {
    const infos = await this.ctx.chain().extrinsics(this.ctx.at, allowList ?? null, sigFilter ?? {}, "None")
    return infos.length
  }

  async exists(allowList?: AllowedExtrinsic[] | null, sigFilter?: SignatureFilter): Promise<boolean> {
    return (await this.count(allowList, sigFilter)) > 0
  }

  async getAs<T>(as: IHeaderAndDecodable<T>, extrinsicId: number | string): Promise<TypedExtrinsic<T> | null> {
    const ext = await this.get(extrinsicId)
    if (ext == null) return null
    return ext.asTyped(as)
  }

  async firstAs<T>(as: IHeaderAndDecodable<T>, sigFilter?: SignatureFilter): Promise<TypedExtrinsic<T> | null> {
    const ext = await this.first([{ PalletCall: [as.palletId(), as.variantId()] }], sigFilter)
    if (ext == null) return null
    return ext.asTyped(as)
  }

  async lastAs<T>(as: IHeaderAndDecodable<T>, sigFilter?: SignatureFilter): Promise<TypedExtrinsic<T> | null> {
    const ext = await this.last([{ PalletCall: [as.palletId(), as.variantId()] }], sigFilter)
    if (ext == null) return null
    return ext.asTyped(as)
  }

  async allAs<T>(as: IHeaderAndDecodable<T>, sigFilter?: SignatureFilter): Promise<TypedExtrinsic<T>[]> {
    const all = await this.all([{ PalletCall: [as.palletId(), as.variantId()] }], sigFilter)
    return all.map((x) => x.asTyped(as))
  }

  async rpc(
    allowList?: AllowedExtrinsic[] | null,
    sigFilter?: SignatureFilter,
    dataFormat?: DataFormat,
  ): Promise<RpcExtrinsic[]> {
    return this.ctx.chain().extrinsics(this.ctx.at, allowList ?? null, sigFilter ?? {}, dataFormat ?? "Extrinsic")
  }
}

export interface BlockExtrinsicMetadata {
  extHash: H256
  extIndex: number
  palletId: number
  variantId: number
  at: H256 | number
}

export class UntypedExtrinsic {
  constructor(
    public readonly preamble: Preamble,
    public readonly call: Uint8Array,
    public readonly metadata: BlockExtrinsicMetadata,
  ) {}

  async events(client: Client): Promise<BlockEvents> {
    const events = await new BlockEventsQuery(new BlockContext(client, this.metadata.at)).extrinsic(this.extIndex())
    if (events.isEmpty()) {
      throw new NotFoundError("No events found for extrinsic", {
        operation: ErrorOperation.RuntimeTxLookup,
        details: { extIndex: this.extIndex, at: this.metadata.at.toString() },
      })
    }
    return events
  }

  extIndex(): number {
    return this.metadata.extIndex
  }

  extHash(): H256 {
    return this.metadata.extHash
  }

  nonce(): number | null {
    if ("bare" in this.preamble) {
      return null
    }
    if ("signed" in this.preamble) {
      return this.preamble.signed.extension.nonce
    }
    return this.preamble.general.extension.nonce
  }

  tip(): BN | null {
    if ("bare" in this.preamble) {
      return null
    }
    if ("signed" in this.preamble) {
      return this.preamble.signed.extension.tip
    }
    return this.preamble.general.extension.tip
  }

  ss58Address(): string | null {
    if ("signed" in this.preamble) {
      const address = this.preamble.signed.address
      if ("Id" in address) return address.Id.toSS58()
    }

    return null
  }

  asTyped<T>(as: IHeaderAndDecodable<T>): TypedExtrinsic<T> {
    const call = scaleDecodeExtrinsicCall(as, this.call)

    return new TypedExtrinsic(this.preamble, call, this.metadata)
  }

  is(as: IHeader): boolean {
    return this.metadata.palletId === as.palletId() && this.metadata.variantId === as.variantId()
  }

  header(): [number, number] {
    return [this.metadata.palletId, this.metadata.variantId]
  }

  static fromRpcExtrinsic(ext: RpcExtrinsic, at: H256 | number): UntypedExtrinsic {
    const metadata: BlockExtrinsicMetadata = {
      at,
      extHash: ext.extHash,
      extIndex: ext.extIndex,
      palletId: ext.palletId,
      variantId: ext.variantId,
    }
    const extrinsic = CoreExtrinsic.decode(ext.data)

    return new UntypedExtrinsic(extrinsic.preamble, extrinsic.call, metadata)
  }
}

export class TypedExtrinsic<T> {
  constructor(
    public readonly preamble: Preamble,
    public readonly call: T,
    public readonly metadata: BlockExtrinsicMetadata,
  ) {}

  extIndex(): number {
    return this.metadata.extIndex
  }

  extHash(): H256 {
    return this.metadata.extHash
  }

  nonce(): number | null {
    if ("bare" in this.preamble) {
      return null
    }
    if ("signed" in this.preamble) {
      return this.preamble.signed.extension.nonce
    }
    return this.preamble.general.extension.nonce
  }

  tip(): BN | null {
    if ("bare" in this.preamble) {
      return null
    }
    if ("signed" in this.preamble) {
      return this.preamble.signed.extension.tip
    }
    return this.preamble.general.extension.tip
  }

  ss58Address(): string | null {
    if ("signed" in this.preamble) {
      const address = this.preamble.signed.address
      if ("Id" in address) return address.Id.toSS58()
    }

    return null
  }

  is(as: IHeader): boolean {
    return this.metadata.palletId === as.palletId() && this.metadata.variantId === as.variantId()
  }

  header(): [number, number] {
    return [this.metadata.palletId, this.metadata.variantId]
  }

  static fromRpcExtrinsic<T>(as: IHeaderAndDecodable<T>, ext: RpcExtrinsic, at: H256 | number): TypedExtrinsic<T> {
    return UntypedExtrinsic.fromRpcExtrinsic(ext, at).asTyped(as)
  }
}
