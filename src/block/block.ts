import type { BlockPhaseEvent, Options as FetchEventsOptions } from "../core/rpc/system/fetch_events"
import type { ExtrinsicInfo, Options as FetchExtrinsicsOptions } from "../core/rpc/system/fetch_extrinsics"
import type { BlockInfo, BlockState, H256, PerDispatchClassWeight } from "../core/metadata"
import type { AccountId, GrandpaJustification, Weight } from "../core/metadata"
import { Weight as WeightModel } from "../core/metadata"
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
    return (await this.extrinsics().all({ encodeAs: "None" })).length
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

  async all(options?: FetchExtrinsicsOptions): Promise<ExtrinsicInfo[]> {
    return this.client.chain().fetchExtrinsics(this.blockId, options)
  }

  async get(index: number): Promise<ExtrinsicInfo | null> {
    const result = await this.all({ encodeAs: "Extrinsic", filter: { TxIndex: [index] } })
    return result[0] ?? null
  }

  async byHash(hash: string): Promise<ExtrinsicInfo | null> {
    const result = await this.all({ encodeAs: "Extrinsic", filter: { TxHash: [hash] } })
    return result[0] ?? null
  }
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
