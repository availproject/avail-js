import { AvailError } from "../error"
import { SessionKeys } from "../types/metadata"
import { call } from "./utils"

/// Cannot Throw
export async function rotateKeys(endpoint: string): Promise<SessionKeys | AvailError> {
  const res = await call(endpoint, "author_rotateKeys", [])
  if (res instanceof AvailError) return res
  if (typeof res !== "string") return new AvailError("Rotate Keys is not string")

  return SessionKeys.from(res)
}
