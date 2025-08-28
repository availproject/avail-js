import { ClientError } from "../../error"
import { HashLike } from "../../types/metadata"
import { call } from "../utils"

export async function fetchEvents(
  endpoint: string,
  blockHash: HashLike,
  options?: Options,
): Promise<PhaseEvents[] | ClientError> {
  let opt: RpcExpectedOptions | undefined = undefined
  if (options != undefined) {
    opt = {
      filter: options?.filter,
      enable_decoding: options?.enableDecoding,
      enable_encoding: options?.enableEncoding,
    }
  }

  const params = [blockHash.toString(), opt]
  const res = await call(endpoint, "system_fetchEventsV1", params)
  if (res instanceof ClientError) return res
  if (res == null) return new ClientError("Failed to fetch events")

  const groupedEvents = res as GroupedRuntimeEvents[]
  const phaseEvents: PhaseEvents[] = []
  for (const gEvents of groupedEvents) {
    phaseEvents.push({
      phase: gEvents.phase,
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

  return phaseEvents
}

export type Phase = { ApplyExtrinsic: number } | "Finalization" | "Initialization"
export interface Options {
  filter?: Filter
  enableEncoding?: boolean
  enableDecoding?: boolean
}
export type Filter = "All" | "OnlyExtrinsics" | "OnlyNonExtrinsics" | { Only: number[] }
export interface PhaseEvents {
  phase: Phase
  events: PhaseEvent[]
}
export interface PhaseEvent {
  index: number
  palletId: number
  variantId: number
  encodedData: string | null
  decodedData: string | null
}

interface GroupedRuntimeEvents {
  phase: Phase
  events: RuntimeEvent[]
}
interface RuntimeEvent {
  index: number
  emitted_index: [number, number]
  encoded: string | null
  decoded: string | null
}

interface RpcExpectedOptions {
  filter?: Filter | null
  enable_encoding?: boolean | null
  enable_decoding?: boolean | null
}
