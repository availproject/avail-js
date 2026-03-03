import { HashLike } from "../../../types"
import { BlockInfo, H256 } from "./../../metadata"
import { rpcCall } from "./../raw"

export async function getBlockNumber(endpoint: string, blockHash: HashLike): Promise<number | null> {
  return await rpcCall(endpoint, "system_getBlockNumber", [blockHash.toString()])
}

export async function latestBlockInfo(endpoint: string, useBestBlock?: boolean): Promise<BlockInfo> {
  const params = useBestBlock == undefined ? undefined : [useBestBlock]
  const res = await rpcCall(endpoint, "system_latestBlockInfo", params)

  const info = res as BlockInfo
  const h256 = H256.from(info.hash)

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

export async function latestChainInfo(endpoint: string): Promise<ChainInfo> {
  const res = await rpcCall(endpoint, "system_latestChainInfo", undefined)

  const info = res as ChainInfoTmp
  const bestHash = H256.from(info.best_hash)
  const finalizedHash = H256.from(info.finalized_hash)
  const genesisHash = H256.from(info.genesis_hash)

  return { bestHash, bestHeight: info.best_height, finalizedHash, finalizedHeight: info.finalized_height, genesisHash }
}
