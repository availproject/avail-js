import { ApiPromise } from "@polkadot/api"
import { initialize } from "../../chain"
import { Extrinsic, Index, RuntimeVersion } from "@polkadot/types/interfaces"
import { H256, AccountId, AccountInfo, SignedBlock, AccountData, AvailHeader } from "./../../core/index"
import { sleepSeconds } from "./../../core/utils"
import { EventClient, RpcApi, BlockClient } from "./index"
import { Core } from "./../index"
import { Logger, ILogObj } from "tslog"

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
  public static async create(endpoint: string, useWsProvider?: boolean): Promise<Client> {
    const useWs = useWsProvider ?? false
    const api = await initialize(endpoint, undefined, !useWs)
    return new Client(api, endpoint)
  }

  // Genesis Hash and Runtime Version
  public genesisHash(): H256 {
    return new H256(this.api.genesisHash)
  }

  public runtimeVersion(): RuntimeVersion {
    return this.api.runtimeVersion
  }

  // Block Header
  public async blockHeader(blockHash?: H256 | string): Promise<AvailHeader | null> {
    return await this.rpcApi().chainGetHeader(blockHash?.toString())
  }

  public async blockHeaderWithRetries(blockHash?: H256 | string): Promise<AvailHeader | null> {
    const sleepDuration = [8, 5, 3, 2, 1]

    while (true) {
      let header: AvailHeader | null
      try {
        header = await this.blockHeader(blockHash)
      } catch (e: any) {
        const duration = sleepDuration.pop()
        if (duration == undefined) {
          throw e
        }

        log.warn(`Fetching block header ended with err ${e}. Sleep for ${duration} seconds`)
        await sleepSeconds(duration)
        continue
      }

      if (header != null) {
        return header
      }

      const duration = sleepDuration.pop()
      if (duration == undefined) {
        return null
      }

      log.warn(`Fetching block header ended with null. Sleep for ${duration} seconds`)
      await sleepSeconds(duration)
    }
  }

  public async bestBlockHeader(): Promise<AvailHeader> {
    const header = await this.blockHeaderWithRetries()
    if (header == null) {
      throw Error("Failed to fetch best block header")
    }

    return header
  }

  public async finalizedBlockHeader(): Promise<AvailHeader> {
    const hash = await this.finalizedBlockHash()
    const header = await this.blockHeaderWithRetries(hash)
    if (header == null) {
      throw Error("Failed to fetch finalized block header")
    }

    return header
  }

  // Block Hash
  public async blockHash(blockHeight?: number): Promise<H256 | null> {
    return await Core.rpc.chain.getBlockHash(this.endpoint, blockHeight)
  }

  public async blockHashWithRetries(blockHeight?: number): Promise<H256 | null> {
    const sleepDuration = [8, 5, 3, 2, 1]

    while (true) {
      let hash: H256 | null
      try {
        hash = await this.blockHash(blockHeight)
      } catch (e: any) {
        const duration = sleepDuration.pop()
        if (duration == undefined) {
          throw e
        }

        log.warn(`Fetching block hash ended with err ${e}. Sleep for ${duration} seconds`)
        await sleepSeconds(duration)
        continue
      }

      if (hash != null) {
        return hash
      }

      const duration = sleepDuration.pop()
      if (duration == undefined) {
        return null
      }

      log.warn(`Fetching block hash ended with null. Sleep for ${duration} seconds`)
      await sleepSeconds(duration)
    }
  }

  public async bestBlockHash(): Promise<H256> {
    const sleepDuration = [8, 5, 3, 2, 1]

    while (true) {
      let hash: H256 | null
      try {
        hash = await this.blockHash()
      } catch (e: any) {
        const duration = sleepDuration.pop()
        if (duration == undefined) {
          throw e
        }

        log.warn(`Fetching best block hash ended with err ${e}. Sleep for ${duration} seconds`)
        await sleepSeconds(duration)
        continue
      }

      if (hash != null) {
        return hash
      }

      const duration = sleepDuration.pop()
      if (duration == undefined) {
        throw Error("Failed to fetch best block hash.")
      }

      log.warn(`Fetching best block hash ended with null. Sleep for ${duration} seconds`)
      await sleepSeconds(duration)
    }
  }

  public async finalizedBlockHash(): Promise<H256> {
    const sleepDuration = [8, 5, 3, 2, 1]

    while (true) {
      let hash: H256
      try {
        hash = await Core.rpc.chain.getFinalizedHead(this.endpoint)
      } catch (e: any) {
        const duration = sleepDuration.pop()
        if (duration == undefined) {
          throw e
        }

        log.warn(`Fetching finalized block hash ended with err ${e}. Sleep for ${duration} seconds`)
        await sleepSeconds(duration)
        continue
      }

      return hash
    }
  }

  // Block Height
  public async blockHeight(blockHash?: H256 | string): Promise<number | null> {
    const header = await this.blockHeader(blockHash)
    if (header == null) {
      return null
    }

    return header.number.toNumber()
  }

  public async bestBlockHeight(): Promise<number> {
    const header = await this.bestBlockHeader()
    return header.number.toNumber()
  }

  public async finalizedBlockHeight(): Promise<number> {
    const header = await this.finalizedBlockHeader()
    return header.number.toNumber()
  }

  // Nonce
  public async nonce(accountId: AccountId | string): Promise<number> {
    const address = accountId instanceof AccountId ? accountId.toSS58() : accountId
    const r = await this.api.rpc.system.accountNextIndex<Index>(address)
    return r.toNumber()
  }

  public async blockNonce(accountId: AccountId | string, blockHash: H256 | string): Promise<number> {
    const accountInfo = this.accountInfo(accountId, blockHash)
    return (await accountInfo).nonce.toNumber()
  }

  public async bestBlockNonce(accountId: AccountId | string): Promise<number> {
    const accountInfo = this.bestBlockAccountInfo(accountId)
    return (await accountInfo).nonce.toNumber()
  }

  public async finalizedBlockNonce(accountId: AccountId | string): Promise<number> {
    const accountInfo = this.finalizedBlockAccountInfo(accountId)
    return (await accountInfo).nonce.toNumber()
  }

  // Balance
  public async balance(accountId: AccountId | string, blockHash: H256 | string): Promise<AccountData> {
    const info = await this.accountInfo(accountId, blockHash)
    return info.data
  }

  public async bestBlockBalance(accountId: AccountId | string): Promise<AccountData> {
    const info = await this.bestBlockAccountInfo(accountId)
    return info.data
  }

  public async finalizedBlockBalance(accountId: AccountId | string): Promise<AccountData> {
    const info = await this.finalizedBlockAccountInfo(accountId)
    return info.data
  }

  // Account Info
  public async accountInfo(accountId: AccountId | string, blockHash: H256 | string): Promise<AccountInfo> {
    const address = accountId instanceof AccountId ? accountId.toSS58() : accountId
    const api = await this.api.at(blockHash.toString())
    return await api.query.system.account<AccountInfo>(address)
  }

  public async bestBlockAccountInfo(accountId: AccountId | string): Promise<AccountInfo> {
    const address = accountId instanceof AccountId ? accountId.toSS58() : accountId
    const hash = await this.bestBlockHash()
    const api = await this.api.at(hash.toString())
    return await api.query.system.account<AccountInfo>(address)
  }

  public async finalizedBlockAccountInfo(accountId: AccountId | string): Promise<AccountInfo> {
    const address = accountId instanceof AccountId ? accountId.toSS58() : accountId
    const hash = await this.finalizedBlockHash()
    const api = await this.api.at(hash.toString())
    return await api.query.system.account<AccountInfo>(address)
  }

  // (RPC) Block
  public async block(blockHash?: H256 | string): Promise<SignedBlock | null> {
    return await this.rpcApi().chainGetBlock(blockHash?.toString())
  }

  public async blockWithRetries(blockHash?: H256 | string): Promise<SignedBlock | null> {
    const sleepDuration = [8, 5, 3, 2, 1]

    while (true) {
      let block: SignedBlock | null
      try {
        block = await this.block(blockHash)
      } catch (e: any) {
        const duration = sleepDuration.pop()
        if (duration == undefined) {
          throw e
        }

        log.warn(`Fetching block ended with err ${e}. Sleep for ${duration} seconds`)
        await sleepSeconds(duration)
        continue
      }

      if (block != null) {
        return block
      }

      const duration = sleepDuration.pop()
      if (duration == undefined) {
        return null
      }

      log.warn(`Fetching block ended with null. Sleep for ${duration} seconds`)
      await sleepSeconds(duration)
    }
  }

  public async bestBlock(): Promise<SignedBlock> {
    const block = await this.blockWithRetries()
    if (block == null) {
      throw Error("Best block not found")
    }
    return block
  }

  public async finalizedBlock(): Promise<SignedBlock> {
    const hash = await this.finalizedBlockHash()
    const block = await this.blockWithRetries(hash)
    if (block == null) {
      throw Error("Finalized block not found")
    }
    return block
  }

  // Block State
  async blockState(blockLoc: Core.BlockLocation): Promise<Core.BlockState> {
    const realBlockHash = await this.blockHash(blockLoc.height)
    if (realBlockHash == null) {
      return "DoesNotExist"
    }

    const finalizedBlockHeight = await this.finalizedBlockHeight()
    if (blockLoc.height > finalizedBlockHeight) {
      return "Included"
    }

    if (realBlockHash.toString() != blockLoc.hash.toString()) {
      return "Discarded"
    }

    return "Finalized"
  }

  // Sign and/or Submit
  public async submit(tx: string | Extrinsic | Uint8Array): Promise<H256> {
    const hash = await this.api.rpc.author.submitExtrinsic(tx)
    return new H256(hash)
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
}
