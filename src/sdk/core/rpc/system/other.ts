import { H256 } from "./../../metadata"
import { AvailError } from "../../misc/error"
import { rpcCall } from "./../raw"

export async function getBlockNumber(endpoint: string, blockHash: H256 | string): Promise<number | null | AvailError> {
  return await rpcCall(endpoint, "system_getBlockNumber", [blockHash.toString()])
}

export interface BlockInfo {
  hash: H256
  height: number
}

interface BlockInfoTmp {
  hash: H256
  height: number
}

export async function latestBlockInfo(endpoint: string, useBestBlock?: boolean): Promise<BlockInfo | AvailError> {
  const params = useBestBlock == undefined ? undefined : [useBestBlock]
  const res = await rpcCall(endpoint, "system_latestBlockInfo", params)
  if (res instanceof AvailError) return res

  const info = res as BlockInfoTmp
  const h256 = H256.from(info.hash)
  if (h256 instanceof AvailError) return h256

  return { hash: h256, height: info.height }
}

export interface ChainInfo {
  bestHash: H256
  bestHeight: number
  finalizedHash: H256
  finalizedHeight: number
  genesisHash: H256
}

interface ChainInfoTmp {
  best_hash: string
  best_height: number
  finalized_hash: string
  finalized_height: number
  genesis_hash: string
}

export async function latestChainInfo(endpoint: string): Promise<ChainInfo | AvailError> {
  const res = await rpcCall(endpoint, "system_latestBlockInfo", undefined)
  if (res instanceof AvailError) return res

  const info = res as ChainInfoTmp
  const bestHash = H256.from(info.best_hash)
  if (bestHash instanceof AvailError) return bestHash
  const finalizedHash = H256.from(info.finalized_hash)
  if (finalizedHash instanceof AvailError) return finalizedHash
  const genesisHash = H256.from(info.genesis_hash)
  if (genesisHash instanceof AvailError) return genesisHash

  return { bestHash, bestHeight: info.best_height, finalizedHash, finalizedHeight: info.finalized_height, genesisHash }
}
