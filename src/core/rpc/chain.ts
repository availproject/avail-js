import { H256 } from ".."
import { callRaw } from "./index"

export async function getBlockHash(endpoint: string, blockHeight?: number): Promise<H256 | null> {
  const params = blockHeight ? [blockHeight] : undefined
  const res = await callRaw(endpoint, "chain_getBlockHash", params)
  if (res.error != null) {
    throw Error(`Code: ${res.error.code}, Message: ${res.error.message}, Data: ${res.error.data}`)
  }

  if (res.result == null) {
    return null
  }

  const hash = res.result as string
  return H256.fromString(hash)
}

export async function getFinalizedHead(endpoint: string): Promise<H256> {
  const res = await callRaw(endpoint, "chain_getFinalizedHead")
  if (res.error != null) {
    throw Error(`Code: ${res.error.code}, Message: ${res.error.message}, Data: ${res.error.data}`)
  }

  if (res.result == null) {
    throw Error("No finalized hash was returned. Something went wrong.")
  }

  const hash = res.result as string
  return H256.fromString(hash)
}

export async function getHeader(endpoint: string, blockHash?: string): Promise<any | null> {
  const params = blockHash ? [blockHash] : undefined
  const res = await callRaw(endpoint, "chain_getHeader", params)
  if (res.error != null) {
    throw Error(`Code: ${res.error.code}, Message: ${res.error.message}, Data: ${res.error.data}`)
  }

  return res.result
}

export async function getBlock(endpoint: string, blockHash?: string): Promise<any | null> {
  const params = blockHash ? [blockHash] : undefined
  const res = await callRaw(endpoint, "chain_getBlock", params)

  if (res.error != null) {
    throw Error(`Code: ${res.error.code}, Message: ${res.error.message}, Data: ${res.error.data}`)
  }

  return res.result
}
