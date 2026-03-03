import { AvailError } from "../error"
import { SessionKeys } from "./../metadata"
import { rpcCall } from "./raw"

export async function rotateKeys(endpoint: string): Promise<SessionKeys> {
  const res = await rpcCall(endpoint, "author_rotateKeys", [])
  if (typeof res !== "string") throw new AvailError("Rotate Keys is not string")

  return SessionKeys.from(res)
}
