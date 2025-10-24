import { AvailError } from "../misc/error"
import { H256 } from "./../metadata"
import { rpcCall } from "./raw"

export interface PerDispatchClassU32 {
  normal: number
  operational: number
  mandatory: number
}

export interface BlockLength {
  max: PerDispatchClassU32
  cols: number
  rows: number
  chunk_size: number
}

export async function blockLength(endpoint: string, at?: H256 | string): Promise<BlockLength | AvailError> {
  const params = at !== undefined ? [at.toString()] : undefined
  const res = await rpcCall(endpoint, "kate_blockLength", params)
  if (res instanceof AvailError) return res

  return res as BlockLength
}
