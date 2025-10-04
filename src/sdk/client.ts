import { TransactionApi } from "./transaction"
import { initialize } from "../legacy"
import { AvailError } from "./core/misc/error"
import { ApiPromise } from "@polkadot/api"
import { H256 } from "./core/metadata"
import { BlockApi } from "./block"
import { RuntimeVersion } from "./core/misc/polkadot"
import { Chain, Best, Finalized } from "./chain"
import { ApiOptions } from "@polkadot/api/types"

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

  block(blockId: H256 | string | number): BlockApi {
    return new BlockApi(this, blockId)
  }

  tx(): TransactionApi {
    return new TransactionApi(this)
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
