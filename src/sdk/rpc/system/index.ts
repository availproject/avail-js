export { fetchEvents } from "./fetch_events"
export { fetchExtrinsics } from "./fetch_extrinsics"
export { latestBlockInfo } from "./latest_block_info"

import ClientError from "../../error"
import { HashLike } from "../../types/metadata"
import { call } from "../utils"

/// Cannot Throw
export async function getBlockNumber(endpoint: string, blockHash: HashLike): Promise<number | null | ClientError> {
  return await call(endpoint, "system_getBlockNumber", [blockHash.toString()])
}
