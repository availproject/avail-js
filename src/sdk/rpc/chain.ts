import ClientError from "../error"
import { H256 } from "../types"
import { call } from "./utils"

/// Cannot Throw
export async function getBlockHash(endpoint: string, blockHeight?: number): Promise<H256 | null | ClientError> {
  const params = blockHeight ? [blockHeight] : undefined
  const res = await call(endpoint, "chain_getBlockHash", params)
  if (res instanceof ClientError) return res
  if (res == null) return null
  if (typeof res !== "string") return new ClientError("Block Hash is not string")

  return H256.fromHex(res)
}

/// Cannot Throw
export async function getFinalizedHead(endpoint: string): Promise<H256 | ClientError> {
  const res = await call(endpoint, "chain_getFinalizedHead")
  if (res instanceof ClientError) return res
  if (res == null) return new ClientError("No finalized hash was returned. Something went wrong.")
  if (typeof res !== "string") return new ClientError("Finalized Head is not string")

  return H256.fromHex(res)
}

/// Cannot Throw
export async function getHeader(endpoint: string, blockHash?: string): Promise<any | null | ClientError> {
  const params = blockHash ? [blockHash] : undefined
  return await call(endpoint, "chain_getHeader", params)
}

/// Cannot Throw
export async function getBlock(endpoint: string, blockHash?: string): Promise<any | null | ClientError> {
  const params = blockHash ? [blockHash] : undefined
  return await call(endpoint, "chain_getBlock", params)
}
