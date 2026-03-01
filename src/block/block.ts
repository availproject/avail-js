import type { BlockPhaseEvent, Options as FetchEventsOptions } from "../core/rpc/system/fetch_events"
import type { ExtrinsicInfo, Options as FetchExtrinsicsOptions } from "../core/rpc/system/fetch_extrinsics"
import type { BlockInfo, BlockState, H256, PerDispatchClassWeight } from "../core/metadata"
import type { AccountId, GrandpaJustification, Weight } from "../core/metadata"
import { Weight as WeightModel } from "../core/metadata"
import { EncodedExtrinsic } from "../core/extrinsic"
import { ICall, type IHeaderAndDecodable } from "../core/interface"
import { AvailError } from "../core/error"
import type { AvailHeader } from "../core/header"
import type { SignedBlock } from "../core/polkadot"
import type { Client } from "../client/client"
import { NotFoundError } from "../errors/sdk-error"
import { ErrorOperation } from "../errors/operations"
import { BN } from "../core/polkadot"

export class Block {
  constructor(
    private readonly client: Client,
    private readonly blockId: H256 | string | number,
  ) {}

  async info(): Promise<BlockInfo> {
    return this.client.chain().blockInfoFrom(this.blockId)
  }

  async hash(): Promise<H256> {
    return (await this.info()).hash
  }

  async height(): Promise<number> {
    return (await this.info()).height
  }

  async header(): Promise<AvailHeader> {
    const header = await this.client.chain().blockHeader(this.blockId)
    if (header == null) {
      throw new NotFoundError("Failed to fetch block header", {
        operation: ErrorOperation.BlockHeader,
        details: { blockId: this.blockId.toString() },
      })
    }
    return header
  }

  async signed(): Promise<SignedBlock> {
    const block = await this.client.chain().signedBlock(this.blockId as H256 | string)
    if (block == null) {
      throw new NotFoundError("Failed to fetch signed block", {
        operation: ErrorOperation.BlockSigned,
        details: { blockId: this.blockId.toString() },
      })
    }
    return block
  }

  async state(): Promise<BlockState> {
    return this.client.chain().blockState(this.blockId)
  }

  async timestamp(): Promise<number> {
    return this.client.chain().blockTimestamp(this.blockId as H256 | string)
  }

  async author() {
    return this.client.chain().blockAuthor(this.blockId)
  }

  async eventCount(): Promise<number> {
    return this.client.chain().blockEventCount(this.blockId)
  }

  async extrinsicCount(): Promise<number> {
    return this.extrinsics().count()
  }

  async nonce(accountId: AccountId | string): Promise<number> {
    return this.client.chain().blockNonce(accountId, this.blockId)
  }

  async justification(): Promise<GrandpaJustification | null> {
    return this.client.chain().blockJustification(this.blockId)
  }

  async extrinsicWeight(): Promise<Weight> {
    const total = await this.events().all({ filter: "All", enableEncoding: false, enableDecoding: true })
    let refTime = new BN(0)
    let proofSize = new BN(0)

    for (const phase of total) {
      for (const event of phase.events) {
        const decoded = event.decodedData as unknown
        if (
          !Array.isArray(decoded) ||
          decoded.length < 2 ||
          typeof decoded[0] !== "number" ||
          typeof decoded[1] !== "number"
        ) {
          continue
        }

        const isSystemSuccessOrFailure = decoded[0] === 0 && (decoded[1] === 0 || decoded[1] === 1)
        if (!isSystemSuccessOrFailure) {
          continue
        }

        const payload = decoded[2] as unknown
        if (
          typeof payload !== "object" ||
          payload == null ||
          !Array.isArray((payload as { data?: unknown[] }).data) ||
          (payload as { data: unknown[] }).data.length === 0
        ) {
          continue
        }

        const dispatchInfo = (payload as { data: unknown[] }).data[0] as unknown
        const weight = (
          dispatchInfo as { weight?: { refTime?: string | number | bigint; proofSize?: string | number | bigint } }
        )?.weight
        if (weight == null) {
          continue
        }

        const ref = new BN(String(weight.refTime ?? 0))
        const proof = new BN(String(weight.proofSize ?? 0))
        refTime = refTime.add(ref)
        proofSize = proofSize.add(proof)
      }
    }

    return new WeightModel(refTime, proofSize)
  }

  async weight(): Promise<PerDispatchClassWeight> {
    return this.client.chain().blockWeight(this.blockId)
  }

  extrinsics(): BlockExtrinsicsQuery {
    return new BlockExtrinsicsQuery(this.client, this.blockId)
  }

  events(): BlockEventsQuery {
    return new BlockEventsQuery(this.client, this.blockId)
  }
}

export class BlockExtrinsicsQuery {
  constructor(
    private readonly client: Client,
    private readonly blockId: H256 | string | number,
  ) {}

  async all(options?: FetchExtrinsicsOptions): Promise<UntypedBlockExtrinsic[]> {
    const infos = await this.client.chain().fetchExtrinsics(this.blockId, {
      ...options,
      encodeAs: "Extrinsic",
    })
    return infos.map((x) => toUntypedExtrinsic(this.client, this.blockId, x))
  }

  async get(extrinsicId: number | string): Promise<UntypedBlockExtrinsic | null> {
    const filter = typeof extrinsicId === "number" ? { TxIndex: [extrinsicId] } : { TxHash: [extrinsicId] }
    const result = await this.all({ filter })
    return result[0] ?? null
  }

  async byHash(hash: string): Promise<UntypedBlockExtrinsic | null> {
    return this.get(hash)
  }

  async first(options?: FetchExtrinsicsOptions): Promise<UntypedBlockExtrinsic | null> {
    const all = await this.all(options)
    return all[0] ?? null
  }

  async last(options?: FetchExtrinsicsOptions): Promise<UntypedBlockExtrinsic | null> {
    const all = await this.all(options)
    return all.at(-1) ?? null
  }

  async count(options?: FetchExtrinsicsOptions): Promise<number> {
    const infos = await this.client.chain().fetchExtrinsics(this.blockId, {
      ...options,
      encodeAs: "None",
    })
    return infos.length
  }

  async exists(options?: FetchExtrinsicsOptions): Promise<boolean> {
    return (await this.count(options)) > 0
  }

  async getAs<T>(as: IHeaderAndDecodable<T>, extrinsicId: number | string): Promise<TypedBlockExtrinsic<T> | null> {
    const ext = await this.get(extrinsicId)
    if (ext == null) return null
    return ext.asTyped(as)
  }

  async firstAs<T>(as: IHeaderAndDecodable<T>, options?: FetchExtrinsicsOptions): Promise<TypedBlockExtrinsic<T> | null> {
    const ext = await this.first({
      ...options,
      filter: { PalletCall: [[as.palletId(), as.variantId()]] },
    })
    if (ext == null) return null
    return ext.asTyped(as)
  }

  async lastAs<T>(as: IHeaderAndDecodable<T>, options?: FetchExtrinsicsOptions): Promise<TypedBlockExtrinsic<T> | null> {
    const ext = await this.last({
      ...options,
      filter: { PalletCall: [[as.palletId(), as.variantId()]] },
    })
    if (ext == null) return null
    return ext.asTyped(as)
  }

  async allAs<T>(as: IHeaderAndDecodable<T>, options?: FetchExtrinsicsOptions): Promise<TypedBlockExtrinsic<T>[]> {
    const all = await this.all({
      ...options,
      filter: { PalletCall: [[as.palletId(), as.variantId()]] },
    })
    return all.map((x) => x.asTyped(as))
  }

  async rpcExtrinsics(options?: FetchExtrinsicsOptions): Promise<ExtrinsicInfo[]> {
    return this.client.chain().fetchExtrinsics(this.blockId, options)
  }
}

export interface BlockExtrinsicMetadata {
  extHash: H256
  extIndex: number
  palletId: number
  variantId: number
  signerPayload: ExtrinsicInfo["signerPayload"]
}

export class UntypedBlockExtrinsic implements BlockExtrinsicMetadata {
  constructor(
    private readonly client: Client,
    private readonly blockId: H256 | string | number,
    readonly encoded: EncodedExtrinsic,
    readonly extHash: H256,
    readonly extIndex: number,
    readonly palletId: number,
    readonly variantId: number,
    readonly signerPayload: ExtrinsicInfo["signerPayload"],
  ) {}

  async events(): Promise<BlockPhaseEvent> {
    const phase = await new BlockEventsQuery(this.client, this.blockId).extrinsic(this.extIndex)
    if (phase == null) {
      throw new NotFoundError("No events found for extrinsic", {
        operation: ErrorOperation.RuntimeTxLookup,
        details: { extIndex: this.extIndex, blockId: this.blockId.toString() },
      })
    }
    return phase
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
    if (call instanceof AvailError) {
      throw call
    }

    return new TypedBlockExtrinsic(
      this.client,
      this.blockId,
      this.encoded,
      call,
      this.extHash,
      this.extIndex,
      this.palletId,
      this.variantId,
      this.signerPayload,
    )
  }
}

export class TypedBlockExtrinsic<T> implements BlockExtrinsicMetadata {
  constructor(
    private readonly client: Client,
    private readonly blockId: H256 | string | number,
    private readonly encoded: EncodedExtrinsic,
    readonly call: T,
    readonly extHash: H256,
    readonly extIndex: number,
    readonly palletId: number,
    readonly variantId: number,
    readonly signerPayload: ExtrinsicInfo["signerPayload"],
  ) {}

  async events(): Promise<BlockPhaseEvent> {
    const phase = await new BlockEventsQuery(this.client, this.blockId).extrinsic(this.extIndex)
    if (phase == null) {
      throw new NotFoundError("No events found for extrinsic", {
        operation: ErrorOperation.RuntimeTxLookup,
        details: { extIndex: this.extIndex, blockId: this.blockId.toString() },
      })
    }
    return phase
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

function toUntypedExtrinsic(client: Client, blockId: H256 | string | number, info: ExtrinsicInfo): UntypedBlockExtrinsic {
  if (info.data == null) {
    throw new NotFoundError("Missing extrinsic payload", {
      operation: ErrorOperation.RuntimeTxLookup,
      details: { extIndex: info.extIndex, extHash: info.extHash.toString() },
    })
  }

  const decoded = EncodedExtrinsic.decode(info.data)
  if (decoded instanceof AvailError) {
    throw decoded
  }

  return new UntypedBlockExtrinsic(
    client,
    blockId,
    decoded,
    info.extHash,
    info.extIndex,
    info.palletId,
    info.variantId,
    info.signerPayload,
  )
}


export class BlockEventsQuery {
  constructor(
    private readonly client: Client,
    private readonly blockId: H256 | string | number,
  ) {}

  async all(options?: FetchEventsOptions): Promise<BlockPhaseEvent[]> {
    return this.client.chain().fetchEvents(this.blockId, options)
  }

  async extrinsic(index: number): Promise<BlockPhaseEvent | null> {
    const result = await this.all({ filter: { Only: [index] }, enableEncoding: true, enableDecoding: false })
    return result[0] ?? null
  }
}
