export * as fetchEvents from "./fetch_events"
export * as fetchExtrinsics from "./fetch_extrinsics"

import { H256 } from "../../types"
import { ClientError } from "../../error"
import { HashLike } from "../../types/metadata"
import { call, Json } from "../utils"

/// Cannot Throw
export async function getBlockNumber(endpoint: string, blockHash: HashLike): Promise<number | null | ClientError> {
  return await call(endpoint, "system_getBlockNumber", [blockHash.toString()])
}

export interface BlockInfo {
  hash: H256
  height: number
}

interface BlockInfoTmp {
  hash: H256
  height: number
}

/// Cannot Throw
export async function latestBlockInfo(endpoint: string, useBestBlock?: boolean): Promise<BlockInfo | ClientError> {
  const params = useBestBlock == undefined ? undefined : [useBestBlock]
  const res = await call(endpoint, "system_latestBlockInfo", params)
  if (res instanceof ClientError) return res

  const info = res as BlockInfoTmp
  const h256 = H256.from(info.hash)
  if (h256 instanceof ClientError) return h256

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

export async function latestChainInfo(endpoint: string): Promise<ChainInfo | ClientError> {
  const res = await call(endpoint, "system_latestBlockInfo", undefined)
  if (res instanceof ClientError) return res

  const info = res as ChainInfoTmp
  const bestHash = H256.from(info.best_hash)
  if (bestHash instanceof ClientError) return bestHash
  const finalizedHash = H256.from(info.finalized_hash)
  if (finalizedHash instanceof ClientError) return finalizedHash
  const genesisHash = H256.from(info.genesis_hash)
  if (genesisHash instanceof ClientError) return genesisHash

  return { bestHash, bestHeight: info.best_height, finalizedHash, finalizedHeight: info.finalized_height, genesisHash }
}
