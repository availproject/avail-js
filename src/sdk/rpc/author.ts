import { ClientError } from "../error"
import { SessionKeys } from "../types/metadata"
import { call } from "./utils"

/// Cannot Throw
export async function rotateKeys(endpoint: string): Promise<SessionKeys | ClientError> {
  const res = await call(endpoint, "author_rotateKeys", [])
  if (res instanceof ClientError) return res
  if (typeof res !== "string") return new ClientError("Rotate Keys is not string")

  return SessionKeys.from(res)
}
