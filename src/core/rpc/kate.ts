import { HashLike } from "../../types"
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

export async function blockLength(endpoint: string, at?: HashLike): Promise<BlockLength> {
  const params = at !== undefined ? [at.toString()] : undefined
  const res = await rpcCall(endpoint, "kate_blockLength", params)

  return res as BlockLength
}
