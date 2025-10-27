import type { Client } from "../client"
import type { Options, Filter, RuntimePhase, PhaseEvent } from "../core/rpc/system/fetch_events"
import { H256, Weight } from "../core/metadata"
import { AvailError } from "../core/error"
import type { BlockPhaseEvent } from "../core/rpc"
import { BlockContext } from "./shared"
import { IEvent, type IHeader, type IHeaderAndDecodable } from "../core/interface"
import { avail } from "../core"
import { BN } from "../core/polkadot"

export class BlockEventsQuery {
  private ctx: BlockContext

  constructor(client: Client, blockId: H256 | string | number) {
    this.ctx = new BlockContext(client, blockId)
  }

  async extrinsic(txIndex: number): Promise<BlockEvents | AvailError> {
    const events = await this.all({ Only: [txIndex] })
    if (events instanceof AvailError) return events

    return new BlockEvents(events)
  }

  async system(): Promise<BlockEvents | AvailError> {
    const events = await this.all("OnlyNonExtrinsics")
    if (events instanceof AvailError) return events

    const filteredEvents = events.filter((v) => typeof v.phase != "number")
    return new BlockEvents(filteredEvents)
  }

  async all(filter?: Filter): Promise<BlockEvent[] | AvailError> {
    const filt = filter ?? "All"
    const blockId = this.ctx.blockId
    const chain = this.ctx.chain()

    const blockPhaseEvents = await chain.systemFetchEvents(blockId, {
      filter: filt,
      enableEncoding: true,
      enableDecoding: false,
    })
    if (blockPhaseEvents instanceof AvailError) return blockPhaseEvents

    const result = []
    for (const blockPhaseEvent of blockPhaseEvents) {
      const phase = blockPhaseEvent.phase
      for (const phaseEvent of blockPhaseEvent.events) {
        const event = fromPhaseEvent(phaseEvent, phase)
        if (event instanceof AvailError) return event
        result.push(event)
      }
    }

    return result
  }

  async raw(opts?: Options): Promise<BlockPhaseEvent[] | AvailError> {
    const chain = this.ctx.chain()
    return chain.systemFetchEvents(this.ctx.blockId, opts)
  }

  setRetryOnError(value: boolean | null) {
    this.ctx.setRetryOnError(value)
  }

  shouldRetryOnError(): boolean {
    return this.ctx.shouldRetryOnError()
  }

  async extrinsicWeight(): Promise<Weight | AvailError> {
    const weight = new Weight(new BN(0), new BN(0))

    const events = await this.all("OnlyExtrinsics")
    if (events instanceof AvailError) return events

    const success = [avail.system.events.ExtrinsicSuccess.palletId(), avail.system.events.ExtrinsicSuccess.variantId()]
    const failed = [avail.system.events.ExtrinsicFailed.palletId(), avail.system.events.ExtrinsicFailed.variantId()]
    for (const event of events) {
      const header = [event.palletId, event.variantId]
      if (header[0] == success[0] && header[1] === success[1]) {
        const decoded = IEvent.decode(avail.system.events.ExtrinsicSuccess, event.data, true)
        if (decoded instanceof AvailError) return decoded
        weight.proofSize = weight.proofSize.add(decoded.dispatchInfo.weight.proofSize)
        weight.refTime = weight.refTime.add(decoded.dispatchInfo.weight.refTime)
      } else if (header[0] == failed[0] && header[1] == failed[1]) {
        const decoded = IEvent.decode(avail.system.events.ExtrinsicFailed, event.data, true)
        if (decoded instanceof AvailError) return decoded
        weight.proofSize = weight.proofSize.add(decoded.dispatchInfo.weight.proofSize)
        weight.refTime = weight.refTime.add(decoded.dispatchInfo.weight.refTime)
      }
    }

    return weight
  }
}

export interface BlockEvent {
  phase: RuntimePhase
  index: number
  palletId: number
  variantId: number
  data: string
}

function fromPhaseEvent(event: PhaseEvent, phase: RuntimePhase): AvailError | BlockEvent {
  if (event.encodedData == null) return new AvailError("The node did not return encoded data for this event")
  return { phase, index: event.index, palletId: event.palletId, variantId: event.variantId, data: event.encodedData }
}

export class BlockEvents {
  constructor(public readonly events: BlockEvent[]) {}

  first<T>(as: IHeaderAndDecodable<T>): T | null {
    const pos = this.events.findIndex((v) => v.palletId == as.palletId() && v.variantId == as.variantId())
    if (pos == -1) return null

    return IEvent.decode(as, this.events[pos].data)
  }

  last<T>(as: IHeaderAndDecodable<T>): T | null {
    const pos = this.events.findLastIndex((v) => v.palletId == as.palletId() && v.variantId == as.variantId())
    if (pos == -1) return null

    return IEvent.decode(as, this.events[pos].data)
  }

  all<T>(as: IHeaderAndDecodable<T>): T[] | AvailError {
    const result = []

    for (const event of this.events) {
      if (event.palletId != as.palletId() || event.variantId != as.variantId()) continue

      const decoded = IEvent.decode(as, event.data, true)
      if (decoded instanceof AvailError) return decoded

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

  len(): number {
    return this.events.length
  }

  isEmpty(): boolean {
    return this.events.length == 0
  }
}
