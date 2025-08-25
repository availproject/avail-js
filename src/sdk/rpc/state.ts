import ClientError from "../error"
import { H256 } from "../types"
import { Hex } from "../utils"
import { call } from "./utils"

/// Cannot Throw
export async function get_storage(endpoint: string, key: String, at?: H256): Promise<Uint8Array | null | ClientError> {
  const res = await call(endpoint, "state_getStorage", [key, at?.toHex()])
  if (res instanceof ClientError) return res
  if (res == null) return null
  if (typeof res !== "string") return new ClientError("Get Storage Value is not string")

  return Hex.decode(res)
}
