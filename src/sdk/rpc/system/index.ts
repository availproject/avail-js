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

/// Cannot Throw
export async function latestBlockInfo(endpoint: string, useBestBlock?: boolean): Promise<BlockInfo | ClientError> {
  const params = useBestBlock == undefined ? undefined : [useBestBlock]
  const res = await call(endpoint, "system_latestBlockInfo", params)
  if (res instanceof ClientError) return res

  const hash = Json.parseString(res.hash)
  if (hash instanceof ClientError) return hash

  const height = Json.parseNumber(res.height)
  if (height instanceof ClientError) return height

  const h256 = H256.from(hash)
  if (h256 instanceof ClientError) return h256

  return { hash: h256, height }
}
