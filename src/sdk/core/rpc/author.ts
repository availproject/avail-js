import { AvailError } from "../misc/error"
import { SessionKeys } from "./../metadata"
import { rpcCall } from "./raw"

/// Cannot Throw
export async function rotateKeys(endpoint: string): Promise<SessionKeys | AvailError> {
  const res = await rpcCall(endpoint, "author_rotateKeys", [])
  if (res instanceof AvailError) return res
  if (typeof res !== "string") return new AvailError("Rotate Keys is not string")

  return SessionKeys.from(res)
}
