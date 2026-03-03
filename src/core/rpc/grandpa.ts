import type { GrandpaJustification } from "../metadata"
import { AvailError } from "../error"
import { rpcCall } from "./raw"

export async function blockJustification(endpoint: string, at: number): Promise<string | null> {
  const res = await rpcCall(endpoint, "grandpa_blockJustification", [at])
  if (res == null) return res
  if (typeof res !== "string") throw new AvailError("Justification is not string")

  return res
}

export async function blockJustificationJson(
  endpoint: string,
  at: number,
): Promise<GrandpaJustification | null> {
  const res = await rpcCall(endpoint, "grandpa_blockJustificationJson", [at])
  if (res == null) return res

  return res as GrandpaJustification
}
