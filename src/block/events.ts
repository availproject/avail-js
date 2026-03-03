import type { AllowedEvents, PhaseEvents, RuntimePhase } from "../core/rpc/custom"
import { BN } from "../core/polkadot"
import type { BlockContext } from "./shared"
import { IHeader, IHeaderAndDecodable } from "../core/interface"
import { Decoder } from "../core/scale"
import { ExtrinsicFailed, ExtrinsicSuccess } from "../core/pallets/system/events"

export class BlockEventsQuery {
  constructor(private readonly ctx: BlockContext) {}

  async extrinsic(txIndex: number): Promise<BlockEvents> {
    const events = await this.all({ Only: [txIndex] })
    return new BlockEvents(events)
  }

  async system(): Promise<BlockEvents> {
    const events = await this.all("OnlyNonExtrinsics")
    const filtered = events.filter((e) => typeof e.phase === "string")
    return new BlockEvents(filtered)
  }

  async all(allowList: AllowedEvents = "All"): Promise<BlockEvent[]> {
    const phaseEvents = await this.rpc(allowList, true)
    const result: BlockEvent[] = []
    for (const group of phaseEvents) {
      for (const event of group.events) {
        result.push({
          phase: group.phase,
          index: event.index,
          palletId: event.palletId,
          variantId: event.variantId,
          data: event.data,
        })
      }
    }
    return result
  }

  async rpc(allowList: AllowedEvents, fetchData: boolean): Promise<PhaseEvents[]> {
    return this.ctx.chain().events(this.ctx.at, allowList, fetchData)
  }

  async eventCount(): Promise<number> {
    return this.ctx.chain().blockEventCount(this.ctx.at)
  }

  // TODO
  async extrinsicWeight(): Promise<{ refTime: BN; proofSize: BN }> {
    const total = await this.all()
    let refTime = new BN(0)
    let proofSize = new BN(0)

    for (const phase of total) {
      if (typeof phase.phase != "string") {
        continue
      }
      // TODO
    }

    return { refTime, proofSize }
  }
}

export interface BlockEvent {
  phase: RuntimePhase
  index: number
  palletId: number
  variantId: number
  data: string
}

export class BlockEvents {
  constructor(readonly events: BlockEvent[]) {}

  async first<T>(as: IHeaderAndDecodable<T>): Promise<T | null> {
    for (const event of this.events) {
      if (event.palletId == as.palletId() && event.variantId == as.variantId()) {
        return as.decode(Decoder.from(event.data))
      }
    }
    return null
  }

  async last<T>(as: IHeaderAndDecodable<T>): Promise<T | null> {
    let e: BlockEvent | null = null
    for (const event of this.events) {
      if (event.palletId == as.palletId() && event.variantId == as.variantId()) {
        e = event
      }
    }
    if (e != null) {
      return as.decode(Decoder.from(e.data))
    }

    return null
  }

  async all<T>(as: IHeaderAndDecodable<T>): Promise<T[]> {
    let list: T[] = []
    for (const event of this.events) {
      if (event.palletId == as.palletId() && event.variantId == as.variantId()) {
        list.push(as.decode(Decoder.from(event.data)))
      }
    }

    return list
  }

  isExtrinsicSuccessPresent(): boolean {
    return this.isPresentParts(ExtrinsicSuccess.palletId(), ExtrinsicSuccess.variantId())
  }

  isExtrinsicFailedPresent(): boolean {
    return this.isPresentParts(ExtrinsicFailed.palletId(), ExtrinsicFailed.variantId())
  }

  isPresent(as: IHeader): boolean {
    return this.count(as) > 0
  }

  isPresentParts(palletId: number, variantId: number): boolean {
    return this.countParts(palletId, variantId) > 0
  }

  count(as: IHeader): number {
    return this.countParts(as.palletId(), as.variantId())
  }

  countParts(palletId: number, variantId: number): number {
    let count = 0
    for (const event of this.events) {
      if (event.palletId === palletId && event.variantId === variantId) {
        count++
      }
    }
    return count
  }

  len(): number {
    return this.events.length
  }

  isEmpty(): boolean {
    return this.events.length === 0
  }
}
