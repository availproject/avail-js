import type { H256 } from "../core/metadata"
import type { Client } from "../client/client"
import type { Chain } from "../chain/chain"

export class BlockContext {
  constructor(
    readonly client: Client,
    readonly at: H256 | string | number,
  ) {}

  chain(): Chain {
    return this.client.chain()
  }
}
