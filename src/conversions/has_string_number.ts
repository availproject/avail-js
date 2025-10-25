import { Chain } from "../chain/chain"
import { H256 } from "../core/metadata"
import { AvailError } from "../core/misc/error"

export async function toHash(rpc: Chain, value: H256 | string | number): Promise<H256 | AvailError> {
  if (value instanceof H256) return value
  if (typeof value === "string") return H256.from(value)

  const hash = await rpc.blockHash(value)
  if (hash instanceof AvailError) return hash
  if (hash == null) return new AvailError("Block Hash not found for that block height")

  return hash
}

export function toHashNumber(value: H256 | string | number): H256 | number | AvailError {
  if (value instanceof H256) return value
  if (typeof value === "string") return H256.from(value)

  return value
}
