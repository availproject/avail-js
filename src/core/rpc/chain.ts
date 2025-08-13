import { GeneralError, H256 } from ".."
import { callRaw } from "./utils"

export async function getBlockHash(endpoint: string, blockHeight?: number): Promise<H256 | null | GeneralError> {
  const params = blockHeight ? [blockHeight] : undefined
  const res = await callRaw(endpoint, "chain_getBlockHash", params)
  if (res instanceof GeneralError) {
    return res
  }

  if (res.error != null) {
    return new GeneralError(`Code: ${res.error.code}, Message: ${res.error.message}, Data: ${res.error.data}`)
  }

  if (res.result == null) {
    return null
  }

  const hash = res.result as string
  return H256.fromHex(hash)
}

export async function getFinalizedHead(endpoint: string): Promise<H256 | GeneralError> {
  const res = await callRaw(endpoint, "chain_getFinalizedHead")
  if (res instanceof GeneralError) {
    return res
  }

  if (res.error != null) {
    return new GeneralError(`Code: ${res.error.code}, Message: ${res.error.message}, Data: ${res.error.data}`)
  }

  if (res.result == null) {
    return new GeneralError("No finalized hash was returned. Something went wrong.")
  }

  const hash = res.result as string
  return H256.fromHex(hash)
}

export async function getHeader(endpoint: string, blockHash?: string): Promise<any | null | GeneralError> {
  const params = blockHash ? [blockHash] : undefined
  const res = await callRaw(endpoint, "chain_getHeader", params)
  if (res instanceof GeneralError) {
    return res
  }

  if (res.error != null) {
    return new GeneralError(`Code: ${res.error.code}, Message: ${res.error.message}, Data: ${res.error.data}`)
  }

  return res.result
}

export async function getBlock(endpoint: string, blockHash?: string): Promise<any | null | GeneralError> {
  const params = blockHash ? [blockHash] : undefined
  const res = await callRaw(endpoint, "chain_getBlock", params)
  if (res instanceof GeneralError) {
    return res
  }

  if (res.error != null) {
    return new GeneralError(`Code: ${res.error.code}, Message: ${res.error.message}, Data: ${res.error.data}`)
  }

  return res.result
}
