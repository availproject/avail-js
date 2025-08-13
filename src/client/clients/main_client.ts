import { ApiPromise } from "@polkadot/api"
import { initialize } from "../../chain"
import { Extrinsic, Index, RuntimeVersion } from "@polkadot/types/interfaces"
import {
  H256,
  AccountId,
  AccountInfo,
  SignedBlock,
  AccountData,
  AvailHeader,
  GeneralError,
  Duration,
  OS,
} from "./../../core"
import { EventClient, RpcApi, BlockClient } from "./index"
import { Core } from "./../index"
import { rpc } from "./../../core"
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
  private constructor(api: ApiPromise, endpoint: string) {
    this.api = api
    this.endpoint = endpoint
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

  public async bestBlockHeader(
    retryOnError: boolean = true,
    retryOnNone: boolean = true,
  ): Promise<AvailHeader | GeneralError> {
    const header = await this.blockHeader(undefined, retryOnError, retryOnNone)
    if (header == null) return new GeneralError("Failed to fetch best block header")
    return header
  }

  public async finalizedBlockHeader(
    retryOnError: boolean = true,
    retryOnNone: boolean = true,
  ): Promise<AvailHeader | GeneralError> {
    const hash = await this.finalizedBlockHash(retryOnError)
    if (hash instanceof GeneralError) return hash

    const header = await this.blockHeader(hash, retryOnError, retryOnNone)
    if (header == null) return new GeneralError("Failed to fetch finalized block header")

    return header
  }

  // Block Hash
  public async blockHash(
    blockHeight?: number,
    retryOnError: boolean = true,
    retryOnNone: boolean = false,
  ): Promise<H256 | null | GeneralError> {
    const durations = [8, 5, 3, 2, 1].map((x) => Duration.fromSecs(x))

    while (true) {
      const result = await rpc.chain.getBlockHash(this.endpoint, blockHeight)
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

  public async bestBlockHash(retryOnError: boolean = true, retryOnNone: boolean = true): Promise<H256 | GeneralError> {
    const result = await this.blockHash(undefined, retryOnError, retryOnNone)
    if (result == null) {
      return new GeneralError("Failed to fetch best block hash.")
    }
    return result
  }

  public async finalizedBlockHash(retryOnError: boolean = true): Promise<H256 | GeneralError> {
    const durations = [8, 5, 3, 2, 1].map((x) => Duration.fromSecs(x))

    while (true) {
      const result = await rpc.chain.getFinalizedHead(this.endpoint)
      if (result instanceof GeneralError) {
        const error = await sleepOrReturnError(durations, retryOnError, result, "Fetching finalized block hash failed")
        if (error instanceof GeneralError) return error
        continue
      }

      return result
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

  public async bestBlockHeight(): Promise<number | GeneralError> {
    const header = await this.bestBlockHeader()
    if (header instanceof GeneralError) return header

    return header.number.toNumber()
  }

  public async finalizedBlockHeight(): Promise<number | GeneralError> {
    const header = await this.finalizedBlockHeader()
    if (header instanceof GeneralError) return header

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

  public async bestBlockNonce(accountId: AccountId | string): Promise<number | GeneralError> {
    const accountInfo = await this.bestBlockAccountInfo(accountId)
    if (accountInfo instanceof GeneralError) {
      return accountInfo
    }
    return accountInfo.nonce.toNumber()
  }

  public async finalizedBlockNonce(accountId: AccountId | string): Promise<number | GeneralError> {
    const accountInfo = await this.finalizedBlockAccountInfo(accountId)
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

  public async bestBlockBalance(accountId: AccountId | string): Promise<AccountData | GeneralError> {
    const info = await this.bestBlockAccountInfo(accountId)
    if (info instanceof GeneralError) {
      return info
    }
    return info.data
  }

  public async finalizedBlockBalance(accountId: AccountId | string): Promise<AccountData | GeneralError> {
    const info = await this.finalizedBlockAccountInfo(accountId)
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

  public async bestBlockAccountInfo(accountId: AccountId | string): Promise<AccountInfo | GeneralError> {
    try {
      const address = accountId instanceof AccountId ? accountId.toSS58() : accountId
      const hash = await this.bestBlockHash()
      if (hash instanceof GeneralError) {
        return hash
      }
      const api = await this.api.at(hash.toString())
      return await api.query.system.account<AccountInfo>(address)
    } catch (e: any) {
      return new GeneralError(e.toString())
    }
  }

  public async finalizedBlockAccountInfo(accountId: AccountId | string): Promise<AccountInfo | GeneralError> {
    try {
      const address = accountId instanceof AccountId ? accountId.toSS58() : accountId
      const hash = await this.finalizedBlockHash()
      if (hash instanceof GeneralError) {
        return hash
      }
      const api = await this.api.at(hash.toString())
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

  public async bestBlock(
    retryOnError: boolean = true,
    retryOnNone: boolean = true,
  ): Promise<SignedBlock | GeneralError> {
    const block = await this.block(undefined, retryOnError, retryOnNone)
    if (block == null) return new GeneralError("Failed to fetch best block")
    return block
  }

  public async finalizedBlock(
    retryOnError: boolean = true,
    retryOnNone: boolean = true,
  ): Promise<SignedBlock | GeneralError> {
    const hash = await this.finalizedBlockHash(retryOnError)
    if (hash instanceof GeneralError) return hash

    const block = await this.block(hash, retryOnError, retryOnNone)
    if (block == null) return new GeneralError("Failed to fetch finalized block")
    return block
  }

  // Block Location
  async bestBlockLoc(
    retryOnError: boolean = true,
    retryOnNone: boolean = true,
  ): Promise<Core.BlockLocation | GeneralError> {
    const hash = await this.bestBlockHash(retryOnError, retryOnNone)
    if (hash instanceof GeneralError) return hash

    const height = await this.blockHeight(hash, retryOnError, retryOnNone)
    if (height instanceof GeneralError) return height
    if (height == null) return new GeneralError("Failed to fetch best block header")

    return { hash: hash, height: height }
  }

  async finalizedBlockLoc(
    retryOnError: boolean = true,
    retryOnNone: boolean = true,
  ): Promise<Core.BlockLocation | GeneralError> {
    const hash = await this.finalizedBlockHash(retryOnError)
    if (hash instanceof GeneralError) return hash

    const height = await this.blockHeight(hash, retryOnError, retryOnNone)
    if (height instanceof GeneralError) return height
    if (height == null) return new GeneralError("Failed to fetch finalized block header")

    return { hash: hash, height: height }
  }

  // Block State
  async blockState(blockLoc: Core.BlockLocation): Promise<Core.BlockState | GeneralError> {
    const realBlockHash = await this.blockHash(blockLoc.height)
    if (realBlockHash instanceof GeneralError) {
      return realBlockHash
    }

    if (realBlockHash == null) {
      return "DoesNotExist"
    }

    const finalizedBlockHeight = await this.finalizedBlockHeight()
    if (finalizedBlockHeight instanceof GeneralError) {
      return finalizedBlockHeight
    }

    if (blockLoc.height > finalizedBlockHeight) {
      return "Included"
    }

    if (realBlockHash.toString() != blockLoc.hash.toString()) {
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
