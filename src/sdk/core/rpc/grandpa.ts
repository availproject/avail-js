import type { GrandpaJustification } from "../metadata"
import { AvailError } from "../misc/error"
import { rpcCall } from "./raw"

/// Cannot Throw
export async function blockJustification(endpoint: string, at: number): Promise<string | null | AvailError> {
  const res = await rpcCall(endpoint, "grandpa_blockJustification", [at])
  if (res instanceof AvailError) return res
  if (res == null) return res
  if (typeof res !== "string") return new AvailError("Justification is not string")

  return res
}

/// Cannot Throw
export async function blockJustificationJson(
  endpoint: string,
  at: number,
): Promise<GrandpaJustification | null | AvailError> {
  const res = await rpcCall(endpoint, "grandpa_blockJustificationJson", [at])
  if (res instanceof AvailError) return res
  if (res == null) return res

  return res as GrandpaJustification
}
