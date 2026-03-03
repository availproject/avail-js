import { RpcError } from "../../../errors/sdk-error"
import { H256 } from "./../../metadata"
import { rpcCall } from "./../raw"

export async function fetchEvents(
  endpoint: string,
  blockHash: H256 | string,
  options?: Options,
): Promise<BlockPhaseEvent[]> {
  let opt: RpcExpectedOptions | undefined = undefined
  if (options != undefined) {
    opt = {
      filter: options?.filter,
      enable_decoding: options?.enableDecoding,
      enable_encoding: options?.enableEncoding,
    }
  }

  const res = await rpcCall(endpoint, "system_fetchEventsV1", [blockHash.toString(), opt])
  if (res == null) throw new RpcError("Failed to fetch events")

  const groupedEvents = res as GroupedRuntimeEvents[]
  const blockPhaseEvent: BlockPhaseEvent[] = []
  for (const gEvents of groupedEvents) {
    let phase
    if (typeof gEvents.phase === "string") {
      phase = gEvents.phase
    } else {
      phase = gEvents.phase.ApplyExtrinsic
    }

    blockPhaseEvent.push({
      phase,
      events: gEvents.events.map((e) => {
        return {
          index: e.index,
          palletId: e.emitted_index[0],
          variantId: e.emitted_index[1],
          encodedData: e.encoded,
          decodedData: e.decoded,
        }
      }),
    })
  }

  return blockPhaseEvent
}

export interface Options {
  filter?: Filter
  enableEncoding?: boolean
  enableDecoding?: boolean
}
export type RuntimePhase = number | "Finalization" | "Initialization"
export type Filter = "All" | "OnlyExtrinsics" | "OnlyNonExtrinsics" | { Only: number[] }
export interface BlockPhaseEvent {
  phase: RuntimePhase
  events: PhaseEvent[]
}
export interface PhaseEvent {
  index: number
  palletId: number
  variantId: number
  encodedData: string | null
  decodedData: string | null
}

type RpcPhase = { ApplyExtrinsic: number } | "Finalization" | "Initialization"
interface GroupedRuntimeEvents {
  phase: RpcPhase
  events: RuntimeEvent[]
}
interface RuntimeEvent {
  index: number
  emitted_index: [number, number]
  encoded: string | null
  decoded: string | null
}

interface RpcExpectedOptions {
  filter?: Filter
  enable_encoding?: boolean
  enable_decoding?: boolean
}
