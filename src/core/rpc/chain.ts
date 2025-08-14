import { GeneralError, H256 } from ".."
import { call } from "./utils"

export async function getBlockHash(endpoint: string, blockHeight?: number): Promise<H256 | null | GeneralError> {
  const params = blockHeight ? [blockHeight] : undefined
  const res = await call(endpoint, "chain_getBlockHash", params)
  if (res instanceof GeneralError) return res
  if (res == null) return null

  const hash = res as string
  return H256.fromHex(hash)
}

export async function getFinalizedHead(endpoint: string): Promise<H256 | GeneralError> {
  const res = await call(endpoint, "chain_getFinalizedHead")
  if (res instanceof GeneralError) return res
  if (res == null) return new GeneralError("No finalized hash was returned. Something went wrong.")

  const hash = res as string
  return H256.fromHex(hash)
}

export async function getHeader(endpoint: string, blockHash?: string): Promise<any | null | GeneralError> {
  const params = blockHash ? [blockHash] : undefined
  const res = await call(endpoint, "chain_getHeader", params)
  if (res instanceof GeneralError) return res

  return res
}

export async function getBlock(endpoint: string, blockHash?: string): Promise<any | null | GeneralError> {
  const params = blockHash ? [blockHash] : undefined
  const res = await call(endpoint, "chain_getBlock", params)
  if (res instanceof GeneralError) return res

  return res
}
