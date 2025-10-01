import { AvailError, ChainApi, H256, core, BlockApi } from "."
import { TransactionApi } from "./transaction_api"
import { Best, Finalized } from "./chain_api"
import { initialize } from "../chain"

export class Client {
  public api: core.ApiPromise
  public endpoint: string
  private global_retires: boolean
  private constructor(api: core.ApiPromise, endpoint: string) {
    this.api = api
    this.endpoint = endpoint
    this.global_retires = true
  }

  static async create(endpoint: string, useWsProvider?: boolean): Promise<Client | AvailError> {
    try {
      const useWs = useWsProvider ?? false
      const api = await initialize(endpoint, undefined, !useWs)
      return new Client(api, endpoint)
    } catch (e: any) {
      return new AvailError(e instanceof Error ? e.message : String(e))
    }
  }

  genesisHash(): H256 {
    return new H256(this.api.genesisHash)
  }

  runtimeVersion(): core.RuntimeVersion {
    return this.api.runtimeVersion
  }

  block(blockId: H256 | string | number): BlockApi {
    return new BlockApi(this, blockId)
  }

  tx(): TransactionApi {
    return new TransactionApi(this)
  }

  chain(): ChainApi {
    return new ChainApi(this)
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
