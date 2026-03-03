import type { H256 } from "../core/metadata"
import type { Client } from "../client/client"
import type { Chain } from "../chain/chain"
import { BlockAt } from "../types"

export class BlockContext {
  constructor(
    readonly client: Client,
    readonly at: BlockAt,
  ) {}

  chain(): Chain {
    return this.client.chain()
  }
}
