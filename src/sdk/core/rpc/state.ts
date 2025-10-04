import { AvailError } from "../misc/error"
import { H256 } from "./../metadata"
import { u8aToHex } from "@polkadot/util"
import { hexDecode } from "../misc/utils"
import { rpcCall } from "./raw"

export async function call(
  endpoint: string,
  method: string,
  data: Uint8Array | string,
  at?: H256 | string,
): Promise<string | AvailError> {
  if (typeof data === "string") {
    return await rpcCall(endpoint, "state_call", [method, data, at?.toString()])
  } else {
    const da = u8aToHex(data, undefined, true)
    return await rpcCall(endpoint, "state_call", [method, da, at?.toString()])
  }
}

/// Cannot Throw
export async function getStorage(endpoint: string, key: string, at?: H256): Promise<Uint8Array | null | AvailError> {
  const res = await rpcCall(endpoint, "state_getStorage", [key, at?.toHex()])
  if (res instanceof AvailError) return res
  if (res == null) return null
  if (typeof res !== "string") return new AvailError("Get Storage Value is not string")

  return hexDecode(res)
}

/// Cannot Throw
export async function getKeysPaged(
  endpoint: string,
  prefix: string | null,
  count: number,
  startKey: string | null,
  at?: H256,
): Promise<string[] | AvailError> {
  const res = await rpcCall(endpoint, "state_getKeysPaged", [prefix, count, startKey, at?.toHex()])
  if (res instanceof AvailError) return res
  if (!Array.isArray(res)) return new AvailError("Get Keys Paged Value is not an array")

  return res as string[]
}
