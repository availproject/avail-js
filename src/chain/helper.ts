import { H256 } from "../core/types"
import { BlockAt, blockAtToHashOrNumber } from "../types"
import { Chain } from "./chain"

export async function blockAtToHash(chain: Chain, value: BlockAt): Promise<H256 | null> {
  const hashOrNumber = blockAtToHashOrNumber(value)
  if (hashOrNumber instanceof H256) return hashOrNumber

  return await chain.blockHash(hashOrNumber)
}

export async function blockAtToHeight(chain: Chain, value: BlockAt): Promise<number | null> {
  const hashOrNumber = blockAtToHashOrNumber(value)
  if (typeof hashOrNumber == "number") return hashOrNumber

  return await chain.blockHeight(hashOrNumber)
}
