import { RpcError } from "../../errors/sdk-error"
import { H256 } from "./../metadata"
import { rpcCall } from "./raw"

export async function getBlockHash(endpoint: string, blockHeight?: number): Promise<H256 | null> {
  const params = blockHeight !== undefined ? [blockHeight] : undefined
  const res = await rpcCall(endpoint, "chain_getBlockHash", params)
  if (res == null) return null
  if (typeof res !== "string") throw new RpcError("Block Hash is not string")

  return H256.from(res)
}

export async function getFinalizedHead(endpoint: string): Promise<H256> {
  const res = await rpcCall(endpoint, "chain_getFinalizedHead")
  if (res == null) throw new RpcError("No finalized hash was returned. Something went wrong.")
  if (typeof res !== "string") throw new RpcError("Finalized Head is not string")

  return H256.from(res)
}

export async function getHeader(endpoint: string, blockHash?: string): Promise<any | null> {
  const params = blockHash !== undefined ? [blockHash] : undefined
  return await rpcCall(endpoint, "chain_getHeader", params)
}

export async function getBlock(endpoint: string, blockHash?: string): Promise<any | null> {
  const params = blockHash !== undefined ? [blockHash] : undefined
  return await rpcCall(endpoint, "chain_getBlock", params)
}
