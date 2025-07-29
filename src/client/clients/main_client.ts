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
} from "./../../core/index"
import { EventClient, RpcApi, BlockClient } from "./index"
import { Core } from "./../index"
import { Logger, ILogObj } from "tslog"
import { Transactions } from "../transactions"

const log: Logger<ILogObj> = new Logger()
log.settings.hideLogPositionForProduction = true
export { log }

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
  public async blockHeader(blockHash?: H256 | string): Promise<AvailHeader | null | GeneralError> {
    return await this.rpcApi().chainGetHeader(blockHash?.toString())
  }

  public async blockHeaderWithRetries(blockHash?: H256 | string): Promise<AvailHeader | null | GeneralError> {
    const sleepDuration = [8, 5, 3, 2, 1]

    while (true) {
      const result = await this.blockHeader(blockHash)
      if (result instanceof GeneralError) {
        const duration = sleepDuration.pop()
        if (duration == undefined) {
          return result
        }

        log.warn(`Fetching block header ended with err ${result.value}. Sleep for ${duration} seconds`)
        await OS.sleep(Duration.fromSecs(duration))
        continue
      }

      if (result != null) {
        return result
      }

      const duration = sleepDuration.pop()
      if (duration == undefined) {
        return null
      }

      log.warn(`Fetching block header ended with null. Sleep for ${duration} seconds`)
      await OS.sleep(Duration.fromSecs(duration))
    }
  }

  public async bestBlockHeader(): Promise<AvailHeader | GeneralError> {
    const header = await this.blockHeaderWithRetries()
    if (header == null) {
      return new GeneralError("Failed to fetch best block header")
    }

    return header
  }

  public async finalizedBlockHeader(): Promise<AvailHeader | GeneralError> {
    const hash = await this.finalizedBlockHash()
    if (hash instanceof GeneralError) {
      return hash
    }

    const header = await this.blockHeaderWithRetries(hash)
    if (header == null) {
      return new GeneralError("Failed to fetch finalized block header")
    }

    return header
  }

  // Block Hash
  public async blockHash(blockHeight?: number): Promise<H256 | null | GeneralError> {
    return await Core.rpc.chain.getBlockHash(this.endpoint, blockHeight)
  }

  public async blockHashWithRetries(blockHeight?: number): Promise<H256 | null | GeneralError> {
    const sleepDuration = [8, 5, 3, 2, 1]

    while (true) {
      const result = await this.blockHash(blockHeight)
      if (result instanceof GeneralError) {
        const duration = sleepDuration.pop()
        if (duration == undefined) {
          return result
        }

        log.warn(`Fetching block hash ended with err ${result.value}. Sleep for ${duration} seconds`)
        await OS.sleep(Duration.fromSecs(duration))
        continue
      }

      if (result != null) {
        return result
      }

      const duration = sleepDuration.pop()
      if (duration == undefined) {
        return null
      }

      log.warn(`Fetching block hash ended with null. Sleep for ${duration} seconds`)
      await OS.sleep(Duration.fromSecs(duration))
    }
  }

  public async bestBlockHash(): Promise<H256 | GeneralError> {
    const sleepDuration = [8, 5, 3, 2, 1]

    while (true) {
      const result = await this.blockHash()
      if (result instanceof GeneralError) {
        const duration = sleepDuration.pop()
        if (duration == undefined) {
          return result
        }

        log.warn(`Fetching best block hash ended with err ${result.value}. Sleep for ${duration} seconds`)
        await OS.sleep(Duration.fromSecs(duration))
        continue
      }

      if (result != null) {
        return result
      }

      const duration = sleepDuration.pop()
      if (duration == undefined) {
        return new GeneralError("Failed to fetch best block hash.")
      }

      log.warn(`Fetching best block hash ended with null. Sleep for ${duration} seconds`)
      await OS.sleep(Duration.fromSecs(duration))
    }
  }

  public async finalizedBlockHash(): Promise<H256 | GeneralError> {
    const sleepDuration = [8, 5, 3, 2, 1]

    while (true) {
      const result = await Core.rpc.chain.getFinalizedHead(this.endpoint)
      if (result instanceof GeneralError) {
        const duration = sleepDuration.pop()
        if (duration == undefined) {
          return result
        }

        log.warn(`Fetching finalized block hash ended with err ${result.value}. Sleep for ${duration} seconds`)
        await OS.sleep(Duration.fromSecs(duration))
        continue
      }

      return result
    }
  }

  // Block Height
  public async blockHeight(blockHash?: H256 | string): Promise<number | null | GeneralError> {
    const header = await this.blockHeader(blockHash)
    if (header instanceof GeneralError) return header

    if (header == null) {
      return null
    }

    return header.number.toNumber()
  }

  public async blockHeightWithRetries(blockHash?: H256 | string): Promise<number | null | GeneralError> {
    const header = await this.blockHeaderWithRetries(blockHash)
    if (header instanceof GeneralError) return header

    if (header == null) {
      return null
    }

    return header.number.toNumber()
  }

  public async bestBlockHeight(): Promise<number | GeneralError> {
    const header = await this.bestBlockHeader()
    if (header instanceof GeneralError) {
      return header
    }
    return header.number.toNumber()
  }

  public async finalizedBlockHeight(): Promise<number | GeneralError> {
    const header = await this.finalizedBlockHeader()
    if (header instanceof GeneralError) {
      return header
    }

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
  public async block(blockHash?: H256 | string): Promise<SignedBlock | null | GeneralError> {
    return await this.rpcApi().chainGetBlock(blockHash?.toString())
  }

  public async blockWithRetries(blockHash?: H256 | string): Promise<SignedBlock | null | GeneralError> {
    const sleepDuration = [8, 5, 3, 2, 1]

    while (true) {
      const result = await this.block(blockHash)
      if (result instanceof GeneralError) {
        const duration = sleepDuration.pop()
        if (duration == undefined) {
          return result
        }

        log.warn(`Fetching block ended with err ${result.value}. Sleep for ${duration} seconds`)
        await OS.sleep(Duration.fromSecs(duration))
        continue
      }

      if (result != null) {
        return result
      }

      const duration = sleepDuration.pop()
      if (duration == undefined) {
        return null
      }

      log.warn(`Fetching block ended with null. Sleep for ${duration} seconds`)
      await OS.sleep(Duration.fromSecs(duration))
    }
  }

  public async bestBlock(): Promise<SignedBlock | GeneralError> {
    const block = await this.blockWithRetries()
    if (block == null) {
      return new GeneralError("Best block not found")
    }
    return block
  }

  public async finalizedBlock(): Promise<SignedBlock | GeneralError> {
    const hash = await this.finalizedBlockHash()
    if (hash instanceof GeneralError) {
      return hash
    }
    const block = await this.blockWithRetries(hash)
    if (block == null) {
      return new GeneralError("Finalized block not found")
    }
    return block
  }

  // Block Location
  async bestBlockLoc(): Promise<Core.BlockLocation | GeneralError> {
    const hash = await this.bestBlockHash()
    if (hash instanceof GeneralError) return hash

    const height = await this.blockHeightWithRetries(hash)
    if (height instanceof GeneralError) return height

    if (height == null) {
      return new GeneralError("Best block header not found")
    }

    return { hash: hash, height: height }
  }

  async finalizedBlockLoc(): Promise<Core.BlockLocation | GeneralError> {
    const hash = await this.finalizedBlockHash()
    if (hash instanceof GeneralError) return hash

    const height = await this.blockHeightWithRetries(hash)
    if (height instanceof GeneralError) return height

    if (height == null) {
      return new GeneralError("Best block header not found")
    }

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
