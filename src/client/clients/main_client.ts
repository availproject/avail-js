import { ApiPromise } from "@polkadot/api"
import { initialize } from "../../chain"
import { Extrinsic, Index, RuntimeVersion } from "@polkadot/types/interfaces"
import {
  AccountId,
  AccountInfo,
  SignedBlock,
  AccountData,
  AvailHeader,
  GeneralError,
  Duration,
  OS,
  BlockState,
} from "./../../core"
import { EventClient, RpcApi, BlockClient } from "./index"
import { Rpc, BlockRef, TxRef, H256 } from "./../../"
import { Logger, ILogObj } from "tslog"
import { Transactions } from "../transactions"

const log: Logger<ILogObj> = new Logger()
log.settings.hideLogPositionForProduction = true
export { log }

async function sleepOrReturnError(
  durations: Duration[],
  retryOnError: boolean,
  error: GeneralError,
  message: string,
): Promise<null | GeneralError> {
  if (retryOnError == false || durations.length == 0) return error

  const duration = durations.pop()!
  log.warn(
    `Message: ${message}. Error: ${error}. Going to sleep for ${duration.value / 1000} seconds and then another attempt will be made`,
  )
  await OS.sleep(duration)

  return null
}

export class Client {
  public api: ApiPromise
  public endpoint: string
  public finalized: Finalized
  public best: Best
  private constructor(api: ApiPromise, endpoint: string) {
    this.api = api
    this.endpoint = endpoint
    this.finalized = new Finalized(this)
    this.best = new Best(this)
  }

  // New Instance
  public static async create(endpoint: string, useWsProvider?: boolean): Promise<Client | GeneralError> {
    try {
      const useWs = useWsProvider ?? false
      const api = await initialize(endpoint, undefined, !useWs)
      return new Client(api, endpoint)
    } catch (e: any) {
      return new GeneralError(e.toString())
    }
  }

  // Genesis Hash and Runtime Version
  public genesisHash(): H256 {
    return new H256(this.api.genesisHash)
  }

  public runtimeVersion(): RuntimeVersion {
    return this.api.runtimeVersion
  }

  // Block Header
  public async blockHeader(
    blockHash?: H256 | string,
    retryOnError: boolean = true,
    retryOnNone: boolean = false,
  ): Promise<AvailHeader | null | GeneralError> {
    const durations = [8, 5, 3, 2, 1].map((x) => Duration.fromSecs(x))

    while (true) {
      const result = await this.rpcApi().chainGetHeader(blockHash?.toString())
      if (result instanceof GeneralError) {
        const error = await sleepOrReturnError(durations, retryOnError, result, "Fetching block header failed")
        if (error instanceof GeneralError) return error
        continue
      }

      if (result != null || !retryOnNone || durations.length == 0) return result
      const duration = durations.pop()!
      log.warn(`Fetching block header ended with null. Sleep for ${duration} seconds`)
      await OS.sleep(duration)
    }
  }

  // Block Hash
  public async blockHash(
    blockHeight?: number,
    retryOnError: boolean = true,
    retryOnNone: boolean = false,
  ): Promise<H256 | null | GeneralError> {
    const durations = [8, 5, 3, 2, 1].map((x) => Duration.fromSecs(x))

    while (true) {
      const result = await Rpc.chain.getBlockHash(this.endpoint, blockHeight)
      if (result instanceof GeneralError) {
        const error = await sleepOrReturnError(durations, retryOnError, result, "Fetching block hash failed")
        if (error instanceof GeneralError) return error
        continue
      }

      if (result != null || !retryOnNone || durations.length == 0) return result
      const duration = durations.pop()!
      log.warn(`Fetching block hash ended with null. Sleep for ${duration} seconds`)
      await OS.sleep(duration)
    }
  }

  // Block Height
  public async blockHeight(
    blockHash?: H256 | string,
    retryOnError: boolean = true,
    retryOnNone: boolean = false,
  ): Promise<number | null | GeneralError> {
    const header = await this.blockHeader(blockHash, retryOnError, retryOnNone)
    if (header instanceof GeneralError || header == null) return header

    return header.number.toNumber()
  }

  // Nonce
  public async nonce(accountId: AccountId | string): Promise<number | GeneralError> {
    try {
      const address = accountId instanceof AccountId ? accountId.toSS58() : accountId
      const r = await this.api.rpc.system.accountNextIndex<Index>(address)
      return r.toNumber()
    } catch (e: any) {
      return new GeneralError(e.toString())
    }
  }

  public async blockNonce(accountId: AccountId | string, blockHash: H256 | string): Promise<number | GeneralError> {
    const accountInfo = await this.accountInfo(accountId, blockHash)
    if (accountInfo instanceof GeneralError) {
      return accountInfo
    }
    return accountInfo.nonce.toNumber()
  }

  // Balance
  public async balance(accountId: AccountId | string, blockHash: H256 | string): Promise<AccountData | GeneralError> {
    const info = await this.accountInfo(accountId, blockHash)
    if (info instanceof GeneralError) {
      return info
    }
    return info.data
  }

  // Account Info
  public async accountInfo(
    accountId: AccountId | string,
    blockHash: H256 | string,
  ): Promise<AccountInfo | GeneralError> {
    try {
      const address = accountId instanceof AccountId ? accountId.toSS58() : accountId
      const api = await this.api.at(blockHash.toString())
      return await api.query.system.account<AccountInfo>(address)
    } catch (e: any) {
      return new GeneralError(e.toString())
    }
  }

  // (RPC) Block
  public async block(
    blockHash?: H256 | string,
    retryOnError: boolean = true,
    retryOnNone: boolean = false,
  ): Promise<SignedBlock | null | GeneralError> {
    const durations = [8, 5, 3, 2, 1].map((x) => Duration.fromSecs(x))

    while (true) {
      const result = this.rpcApi().chainGetBlock(blockHash?.toString())
      if (result instanceof GeneralError) {
        const error = await sleepOrReturnError(durations, retryOnError, result, "Fetching block failed")
        if (error instanceof GeneralError) return error
        continue
      }

      if (result != null || !retryOnNone || durations.length == 0) return result
      const duration = durations.pop()!
      log.warn(`Fetching block ended with null. Sleep for ${duration} seconds`)
      await OS.sleep(duration)
    }
  }

  // Block State
  async blockState(blockRef: BlockRef): Promise<BlockState | GeneralError> {
    const realBlockHash = await this.blockHash(blockRef.height)
    if (realBlockHash instanceof GeneralError) {
      return realBlockHash
    }

    if (realBlockHash == null) {
      return "DoesNotExist"
    }

    const finalizedBlockHeight = await this.finalized.blockHeight()
    if (finalizedBlockHeight instanceof GeneralError) {
      return finalizedBlockHeight
    }

    if (blockRef.height > finalizedBlockHeight) {
      return "Included"
    }

    if (realBlockHash.toString() != blockRef.hash.toString()) {
      return "Discarded"
    }

    return "Finalized"
  }

  // Sign and/or Submit
  public async submit(tx: string | Extrinsic | Uint8Array): Promise<H256 | GeneralError> {
    return this.rpcApi().authorSubmitExtrinsic(tx)
  }

  // Clients
  public blockClient(): BlockClient {
    return new BlockClient(this)
  }

  public eventClient(): EventClient {
    return new EventClient(this)
  }

  public rpcApi(): RpcApi {
    return new RpcApi(this)
  }

  public tx(): Transactions {
    return new Transactions(this)
  }
}

class Best {
  private client: Client
  private api: ApiPromise
  private endpoint: string
  constructor(client: Client) {
    this.client = client
    this.endpoint = client.endpoint
    this.api = client.api
  }

  async blockHeader(retryOnError: boolean = true, retryOnNone: boolean = true): Promise<AvailHeader | GeneralError> {
    const header = await this.client.blockHeader(undefined, retryOnError, retryOnNone)
    if (header == null) return new GeneralError("Failed to fetch best block header")

    return header
  }

  async blockHash(retryOnError: boolean = true, retryOnNone: boolean = true): Promise<H256 | GeneralError> {
    const result = await this.client.blockHash(undefined, retryOnError, retryOnNone)
    if (result == null) return new GeneralError("Failed to fetch best block hash.")

    return result
  }

  async blockHeight(): Promise<number | GeneralError> {
    const ref = await this.blockRef()
    if (ref instanceof GeneralError) return ref

    return ref.height
  }

  async block(retryOnError: boolean = true, retryOnNone: boolean = true): Promise<SignedBlock | GeneralError> {
    const block = await this.client.block(undefined, retryOnError, retryOnNone)
    if (block == null) return new GeneralError("Failed to fetch best block")
    return block
  }

  // Block Location
  async blockRef(retryOnError: boolean = true): Promise<BlockRef | GeneralError> {
    const durations = [8, 5, 3, 2, 1].map((x) => Duration.fromSecs(x))

    while (true) {
      const result = await Rpc.system.latestBlockInfo(this.endpoint, true)
      if (result instanceof GeneralError) {
        const error = await sleepOrReturnError(durations, retryOnError, result, "Fetching finalized block hash failed")
        if (error instanceof GeneralError) return error
        continue
      }

      return result
    }
  }

  async blockNonce(accountId: AccountId | string): Promise<number | GeneralError> {
    const accountInfo = await this.blockAccountInfo(accountId)
    if (accountInfo instanceof GeneralError) {
      return accountInfo
    }
    return accountInfo.nonce.toNumber()
  }

  async blockBalance(accountId: AccountId | string): Promise<AccountData | GeneralError> {
    const info = await this.blockAccountInfo(accountId)
    if (info instanceof GeneralError) {
      return info
    }
    return info.data
  }

  async blockAccountInfo(accountId: AccountId | string): Promise<AccountInfo | GeneralError> {
    try {
      const address = accountId instanceof AccountId ? accountId.toSS58() : accountId
      const hash = await this.blockHash()
      if (hash instanceof GeneralError) {
        return hash
      }
      const api = await this.api.at(hash.toString())
      return await api.query.system.account<AccountInfo>(address)
    } catch (e: any) {
      return new GeneralError(e.toString())
    }
  }
}

class Finalized {
  private client: Client
  private api: ApiPromise
  private endpoint: string
  constructor(client: Client) {
    this.client = client
    this.endpoint = client.endpoint
    this.api = client.api
  }

  async block(retryOnError: boolean = true, retryOnNone: boolean = true): Promise<SignedBlock | GeneralError> {
    const hash = await this.blockHash(retryOnError)
    if (hash instanceof GeneralError) return hash

    const block = await this.client.block(hash, retryOnError, retryOnNone)
    if (block == null) return new GeneralError("Failed to fetch finalized block")
    return block
  }

  async blockHeader(retryOnError: boolean = true, retryOnNone: boolean = true): Promise<AvailHeader | GeneralError> {
    const hash = await this.blockHash(retryOnError)
    if (hash instanceof GeneralError) return hash

    const header = await this.client.blockHeader(hash, retryOnError, retryOnNone)
    if (header == null) return new GeneralError("Failed to fetch finalized block header")

    return header
  }

  async blockHash(retryOnError: boolean = true): Promise<H256 | GeneralError> {
    const durations = [8, 5, 3, 2, 1].map((x) => Duration.fromSecs(x))

    while (true) {
      const result = await Rpc.chain.getFinalizedHead(this.endpoint)
      if (result instanceof GeneralError) {
        const error = await sleepOrReturnError(durations, retryOnError, result, "Fetching finalized block hash failed")
        if (error instanceof GeneralError) return error
        continue
      }

      return result
    }
  }

  async blockHeight(): Promise<number | GeneralError> {
    const ref = await this.blockRef()
    if (ref instanceof GeneralError) return ref

    return ref.height
  }

  async blockRef(retryOnError: boolean = true): Promise<BlockRef | GeneralError> {
    const durations = [8, 5, 3, 2, 1].map((x) => Duration.fromSecs(x))

    while (true) {
      const result = await Rpc.system.latestBlockInfo(this.endpoint, false)
      if (result instanceof GeneralError) {
        const error = await sleepOrReturnError(durations, retryOnError, result, "Fetching finalized block hash failed")
        if (error instanceof GeneralError) return error
        continue
      }

      return result
    }
  }

  async blockAccountInfo(accountId: AccountId | string): Promise<AccountInfo | GeneralError> {
    try {
      const address = accountId instanceof AccountId ? accountId.toSS58() : accountId
      const hash = await this.blockHash()
      if (hash instanceof GeneralError) {
        return hash
      }
      const api = await this.api.at(hash.toString())
      return await api.query.system.account<AccountInfo>(address)
    } catch (e: any) {
      return new GeneralError(e.toString())
    }
  }

  async blockBalance(accountId: AccountId | string): Promise<AccountData | GeneralError> {
    const info = await this.blockAccountInfo(accountId)
    if (info instanceof GeneralError) {
      return info
    }
    return info.data
  }

  async blockNonce(accountId: AccountId | string): Promise<number | GeneralError> {
    const accountInfo = await this.blockAccountInfo(accountId)
    if (accountInfo instanceof GeneralError) {
      return accountInfo
    }
    return accountInfo.nonce.toNumber()
  }
}
