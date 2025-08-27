import ClientError from "../../error"
import { HashLike } from "../../types/metadata"
import { RpcError, call } from "../utils"

export async function fetchEvents(
  endpoint: string,
  blockHash: HashLike,
  options?: Options | null,
): Promise<GroupedRuntimeEvents[] | ClientError> {
  const params = [blockHash.toString(), options]
  const res = await call(endpoint, "system_fetchEventsV1", params)
  if (res instanceof ClientError) return res
  if (res == null) return new ClientError("Failed to fetch events")

  return res
}

export interface Options {
  filter?: Filter | null
  enable_encoding?: boolean | null
  enable_decoding?: boolean | null
}
export type Filter = "All" | "OnlyExtrinsics" | "OnlyNonExtrinsics" | { Only: number[] }

export interface RpcResponse {
  result: GroupedRuntimeEvents[] | null
  error: RpcError | null
}

export interface GroupedRuntimeEvents {
  phase: Phase
  events: RuntimeEvent[]
}

export interface RuntimeEvent {
  index: number
  // (Pallet Id, Variant Id)
  emitted_index: [number, number]
  encoded: string | null
  decoded: string | null
}

export type Phase = { ApplyExtrinsic: number } | "Finalization" | "Initialization"
