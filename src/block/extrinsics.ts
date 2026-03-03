import type {
  ExtrinsicInfo,
  TransactionSignature,
  AllowedExtrinsic,
  SignatureFilter,
  DataFormat,
} from "../core/rpc/custom"
import type { H256 } from "../core/metadata"
import type { Client } from "../client/client"
import { EncodedExtrinsic } from "../core/extrinsic"
import { ICall, type IHeaderAndDecodable } from "../core/interface"
import { DecodeError } from "../errors/sdk-error"
import { NotFoundError } from "../errors/sdk-error"
import { ErrorOperation } from "../errors/operations"
import { BN } from "../core/polkadot"
import { BlockEvents, BlockEventsQuery } from "./events"
import { BlockContext } from "./shared"
import { BlockAt } from "../types"

export class BlockExtrinsicsQuery {
  constructor(private readonly ctx: BlockContext) {}

  async all(allowList?: AllowedExtrinsic[] | null, sigFilter?: SignatureFilter): Promise<UntypedBlockExtrinsic[]> {
    const infos = await this.ctx.chain().extrinsics(this.ctx.at, allowList ?? null, sigFilter ?? {}, "Extrinsic")
    return infos.map((x) => toUntypedExtrinsic(this.ctx.client, this.ctx.at, x))
  }

  async get(extrinsicId: number | string): Promise<UntypedBlockExtrinsic | null> {
    const filter: AllowedExtrinsic =
      typeof extrinsicId === "number" ? { TxIndex: extrinsicId } : { TxHash: extrinsicId }
    return this.first([filter])
  }

  async byHash(hash: string): Promise<UntypedBlockExtrinsic | null> {
    return this.get(hash)
  }

  async first(
    allowList?: AllowedExtrinsic[] | null,
    sigFilter?: SignatureFilter,
  ): Promise<UntypedBlockExtrinsic | null> {
    const all = await this.all(allowList, sigFilter)
    return all[0] ?? null
  }

  async last(
    allowList?: AllowedExtrinsic[] | null,
    sigFilter?: SignatureFilter,
  ): Promise<UntypedBlockExtrinsic | null> {
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

  async getAs<T>(as: IHeaderAndDecodable<T>, extrinsicId: number | string): Promise<TypedBlockExtrinsic<T> | null> {
    const ext = await this.get(extrinsicId)
    if (ext == null) return null
    return ext.asTyped(as)
  }

  async firstAs<T>(as: IHeaderAndDecodable<T>, sigFilter?: SignatureFilter): Promise<TypedBlockExtrinsic<T> | null> {
    const ext = await this.first([{ PalletCall: [as.palletId(), as.variantId()] }], sigFilter)
    if (ext == null) return null
    return ext.asTyped(as)
  }

  async lastAs<T>(as: IHeaderAndDecodable<T>, sigFilter?: SignatureFilter): Promise<TypedBlockExtrinsic<T> | null> {
    const ext = await this.last([{ PalletCall: [as.palletId(), as.variantId()] }], sigFilter)
    if (ext == null) return null
    return ext.asTyped(as)
  }

  async allAs<T>(as: IHeaderAndDecodable<T>, sigFilter?: SignatureFilter): Promise<TypedBlockExtrinsic<T>[]> {
    const all = await this.all([{ PalletCall: [as.palletId(), as.variantId()] }], sigFilter)
    return all.map((x) => x.asTyped(as))
  }

  async rpc(
    allowList?: AllowedExtrinsic[] | null,
    sigFilter?: SignatureFilter,
    dataFormat?: DataFormat,
  ): Promise<ExtrinsicInfo[]> {
    return this.ctx.chain().extrinsics(this.ctx.at, allowList ?? null, sigFilter ?? {}, dataFormat ?? "Extrinsic")
  }
}

export interface BlockExtrinsicMetadata {
  extHash: H256
  extIndex: number
  palletId: number
  variantId: number
  signature: TransactionSignature | null
}

export class UntypedBlockExtrinsic implements BlockExtrinsicMetadata {
  constructor(
    private readonly client: Client,
    private readonly at: BlockAt,
    readonly encoded: EncodedExtrinsic,
    readonly extHash: H256,
    readonly extIndex: number,
    readonly palletId: number,
    readonly variantId: number,
    readonly signature: TransactionSignature | null,
  ) {}

  async events(): Promise<BlockEvents> {
    const events = await new BlockEventsQuery(new BlockContext(this.client, this.at)).extrinsic(this.extIndex)
    if (events.isEmpty()) {
      throw new NotFoundError("No events found for extrinsic", {
        operation: ErrorOperation.RuntimeTxLookup,
        details: { extIndex: this.extIndex, at: this.at.toString() },
      })
    }
    return events
  }

  nonce(): number | null {
    return this.encoded.signature?.extra.nonce ?? null
  }

  tip(): BN | null {
    return this.encoded.signature?.extra.tip ?? null
  }

  ss58Address(): string | null {
    const address = this.encoded.signature?.address
    if (address == null) return null
    if ("Id" in address) return address.Id.toSS58()
    return null
  }

  header(): [number, number] {
    return [this.palletId, this.variantId]
  }

  is<T>(as: IHeaderAndDecodable<T>): boolean {
    return this.palletId === as.palletId() && this.variantId === as.variantId()
  }

  asTyped<T>(as: IHeaderAndDecodable<T>): TypedBlockExtrinsic<T> {
    const call = ICall.decode(as, this.encoded.call, true)

    return new TypedBlockExtrinsic(
      this.client,
      this.at,
      this.encoded,
      call,
      this.extHash,
      this.extIndex,
      this.palletId,
      this.variantId,
      this.signature,
    )
  }
}

export class TypedBlockExtrinsic<T> implements BlockExtrinsicMetadata {
  constructor(
    private readonly client: Client,
    private readonly at: BlockAt,
    private readonly encoded: EncodedExtrinsic,
    readonly call: T,
    readonly extHash: H256,
    readonly extIndex: number,
    readonly palletId: number,
    readonly variantId: number,
    readonly signature: TransactionSignature | null,
  ) {}

  async events(): Promise<BlockEvents> {
    const events = await new BlockEventsQuery(new BlockContext(this.client, this.at)).extrinsic(this.extIndex)
    if (events.isEmpty()) {
      throw new NotFoundError("No events found for extrinsic", {
        operation: ErrorOperation.RuntimeTxLookup,
        details: { extIndex: this.extIndex, at: this.at.toString() },
      })
    }
    return events
  }

  nonce(): number | null {
    return this.encoded.signature?.extra.nonce ?? null
  }

  tip(): BN | null {
    return this.encoded.signature?.extra.tip ?? null
  }

  ss58Address(): string | null {
    const address = this.encoded.signature?.address
    if (address == null) return null
    if ("Id" in address) return address.Id.toSS58()
    return null
  }

  header(): [number, number] {
    return [this.palletId, this.variantId]
  }

  is(as: IHeaderAndDecodable<T>): boolean {
    return this.palletId === as.palletId() && this.variantId === as.variantId()
  }
}

function toUntypedExtrinsic(client: Client, at: BlockAt, info: ExtrinsicInfo): UntypedBlockExtrinsic {
  if (info.data === "") {
    throw new NotFoundError("Missing extrinsic payload", {
      operation: ErrorOperation.RuntimeTxLookup,
      details: { extIndex: info.extIndex, extHash: info.extHash.toString() },
    })
  }

  const decoded = EncodedExtrinsic.decode(info.data)

  return new UntypedBlockExtrinsic(
    client,
    at,
    decoded,
    info.extHash,
    info.extIndex,
    info.palletId,
    info.variantId,
    info.signature,
  )
}
