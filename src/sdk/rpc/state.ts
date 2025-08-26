import ClientError from "../error"
import { H256 } from "../types"
import { Hex } from "../utils"
import { call } from "./utils"

/// Cannot Throw
export async function getStorage(endpoint: string, key: string, at?: H256): Promise<Uint8Array | null | ClientError> {
  const res = await call(endpoint, "state_getStorage", [key, at?.toHex()])
  if (res instanceof ClientError) return res
  if (res == null) return null
  if (typeof res !== "string") return new ClientError("Get Storage Value is not string")

  return Hex.decode(res)
}

/// Cannot Throw
export async function getKeysPaged(
  endpoint: string,
  prefix: string | null,
  count: number,
  startKey: string | null,
  at?: H256,
): Promise<string[] | ClientError> {
  const res = await call(endpoint, "state_getKeysPaged", [prefix, count, startKey, at?.toHex()])
  if (res instanceof ClientError) return res
  if (!Array.isArray(res)) return new ClientError("Get Keys Paged Value is not an array")

  return res as string[]
}
