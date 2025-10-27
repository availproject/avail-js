import { Transaction } from "./transaction"
import { AvailError } from "./core/error"
import type { ApiPromise } from "@polkadot/api"
import { H256 } from "./core/metadata"
import { Block } from "./block/block"
import type { RuntimeVersion } from "./core/polkadot"
import { Chain } from "./chain/chain"
import { Best } from "./chain/best"
import { Finalized } from "./chain/finalized"
import type { ApiOptions } from "@polkadot/api/types"
import { initialize } from "./core/api"

export class Client {
  public api: ApiPromise
  public endpoint: string
  private global_retires: boolean
  public constructor(api: ApiPromise, endpoint: string) {
    this.api = api
    this.endpoint = endpoint
    this.global_retires = true
  }

  static async create(
    endpoint: string,
    opts?: { useWsProvider?: boolean; api?: ApiOptions },
  ): Promise<Client | AvailError> {
    try {
      const useWs = opts?.useWsProvider ?? false
      const api = await initialize(endpoint, opts?.api, !useWs)
      return new Client(api, endpoint)
    } catch (e: any) {
      return new AvailError(e instanceof Error ? e.message : String(e))
    }
  }

  genesisHash(): H256 {
    return new H256(this.api.genesisHash)
  }

  runtimeVersion(): RuntimeVersion {
    return this.api.runtimeVersion
  }

  block(blockId: H256 | string | number): Block {
    return new Block(this, blockId)
  }

  tx(): Transaction {
    return new Transaction(this)
  }

  chain(): Chain {
    return new Chain(this)
  }

  best(): Best {
    return new Best(this)
  }

  finalized(): Finalized {
    return new Finalized(this)
  }

  isGlobalRetiresEnabled(): boolean {
    return this.global_retires
  }

  setGlobalRetiresEnabled(value: boolean) {
    this.global_retires = value
  }
}
