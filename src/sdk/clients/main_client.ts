import { Rpc } from ".."
import { initialize } from "../../chain"
import ClientError from "../error"
import { log } from "../log"
import { AccountId, AvailHeader, H256 } from "../types"
import { AccountData, AccountInfo, BlockRef, BlockState } from "../types/metadata"
import { ApiPromise, Extrinsic, RuntimeVersion, SignedBlock } from "../types/polkadot"
import { Duration, sleep } from "../utils"
import { BlockClient } from "./block_client"
import { EventClient } from "./event_client"
import { RpcClient } from "./rpc_client"
import { Transactions } from "./transactions"

export async function sleepOrReturnError(
  durations: Duration[],
  retryOnError: boolean,
  error: ClientError,
  message: string,
): Promise<null | ClientError> {
  if (retryOnError == false || durations.length == 0) return error

  const duration = durations.pop()!
  log.warn(
    `Message: ${message}. Error: ${JSON.stringify(error)}. Going to sleep for ${duration.value / 1000} seconds and then another attempt will be made`,
  )
  await sleep(duration)

  return null
}

export class Client {
  public api: ApiPromise
  public endpoint: string
  public finalized: Finalized
  public best: Best
  public rpc: RpcClient
  private constructor(api: ApiPromise, endpoint: string) {
    this.api = api
    this.endpoint = endpoint
    this.finalized = new Finalized(this)
    this.best = new Best(this)
    this.rpc = new RpcClient(this)
  }

  // New Instance
  static async create(endpoint: string, useWsProvider?: boolean): Promise<Client | ClientError> {
    try {
      const useWs = useWsProvider ?? false
      const api = await initialize(endpoint, undefined, !useWs)
      return new Client(api, endpoint)
    } catch (e: any) {
      return new ClientError(e.toString())
    }
  }

  // Genesis Hash and Runtime Version
  public genesisHash(): H256 {
    return new H256(this.api.genesisHash)
  }

  public runtimeVersion(): RuntimeVersion {
    return this.api.runtimeVersion
  }

  async blockHeader(
    blockHash?: H256 | string,
    retryOnError: boolean = true,
    retryOnNone: boolean = false,
  ): Promise<AvailHeader | null | ClientError> {
    return await this.rpc.chain.getHeader(blockHash?.toString(), retryOnError, retryOnNone)
  }

  async blockHash(
    blockHeight?: number,
    retryOnError: boolean = true,
    retryOnNone: boolean = false,
  ): Promise<H256 | null | ClientError> {
    return await this.rpc.chain.getBlockHash(blockHeight, retryOnError, retryOnNone)
  }

  async blockHeight(
    blockHash?: H256 | string,
    retryOnError: boolean = true,
    retryOnNone: boolean = false,
  ): Promise<number | null | ClientError> {
    return await this.rpc.system.getBlockNumber(blockHash, retryOnError, retryOnNone)
  }

  async nonce(accountId: AccountId | string, retryOnError: boolean = true): Promise<number | ClientError> {
    return await this.rpc.system.accountNexIndex(accountId, retryOnError)
  }

  async blockNonce(accountId: AccountId | string, blockHash: H256 | string): Promise<number | ClientError> {
    const info = await this.accountInfo(accountId, blockHash)
    if (info instanceof ClientError) return info

    return info.nonce.toNumber()
  }

  async balance(accountId: AccountId | string, blockHash: H256 | string): Promise<AccountData | ClientError> {
    const info = await this.accountInfo(accountId, blockHash)
    if (info instanceof ClientError) return info

    return info.data
  }

  async accountInfo(
    accountId: AccountId | string,
    blockHash: H256 | string,
    retryOnError: boolean = true,
  ): Promise<AccountInfo | ClientError> {
    return await this.rpc.system.account(accountId, blockHash, retryOnError)
  }

  // (RPC) Block
  async block(
    blockHash?: H256 | string,
    retryOnError: boolean = true,
    retryOnNone: boolean = false,
  ): Promise<SignedBlock | null | ClientError> {
    return await this.rpc.chain.getBlock(blockHash?.toString(), retryOnError, retryOnNone)
  }

  // Block State
  async blockState(blockRef: BlockRef, retryOnError: boolean = true): Promise<BlockState | ClientError> {
    const realBlockHash = await this.blockHash(blockRef.height, retryOnError)
    if (realBlockHash instanceof ClientError) return realBlockHash

    if (realBlockHash == null) {
      return "DoesNotExist"
    }

    const finalizedBlockHeight = await this.finalized.blockHeight(retryOnError)
    if (finalizedBlockHeight instanceof ClientError) return finalizedBlockHeight

    if (blockRef.height > finalizedBlockHeight) {
      return "Included"
    }

    if (realBlockHash.toString() != blockRef.hash.toString()) {
      return "Discarded"
    }

    return "Finalized"
  }

  // Sign and/or Submit
  async submit(tx: string | Extrinsic | Uint8Array, retryOnError: boolean = true): Promise<H256 | ClientError> {
    return await this.rpc.author.submitExtrinsic(tx, retryOnError)
  }

  // Clients
  public blockClient(): BlockClient {
    return new BlockClient(this)
  }

  public eventClient(): EventClient {
    return new EventClient(this)
  }

  public tx(): Transactions {
    return new Transactions(this)
  }
}

class Best {
  private client: Client
  private endpoint: string
  constructor(client: Client) {
    this.client = client
    this.endpoint = client.endpoint
  }

  async blockHeader(retryOnError: boolean = true, retryOnNone: boolean = true): Promise<AvailHeader | ClientError> {
    const header = await this.client.blockHeader(undefined, retryOnError, retryOnNone)
    if (header == null) return new ClientError("Failed to fetch best block header")

    return header
  }

  async blockHash(retryOnError: boolean = true, retryOnNone: boolean = true): Promise<H256 | ClientError> {
    const result = await this.client.blockHash(undefined, retryOnError, retryOnNone)
    if (result == null) return new ClientError("Failed to fetch best block hash.")

    return result
  }

  async blockHeight(retryOnError: boolean = true): Promise<number | ClientError> {
    const ref = await this.blockRef(retryOnError)
    if (ref instanceof ClientError) return ref

    return ref.height
  }

  async block(retryOnError: boolean = true, retryOnNone: boolean = true): Promise<SignedBlock | ClientError> {
    const block = await this.client.block(undefined, retryOnError, retryOnNone)
    if (block == null) return new ClientError("Failed to fetch best block")

    return block
  }

  // Block Location
  async blockRef(retryOnError: boolean = true): Promise<BlockRef | ClientError> {
    const durations = [8, 5, 3, 2, 1].map((x) => Duration.fromSecs(x))

    while (true) {
      const result = await Rpc.system.latestBlockInfo(this.endpoint, true)
      if (result instanceof ClientError) {
        const error = await sleepOrReturnError(durations, retryOnError, result, "Fetching finalized block hash failed")
        if (error instanceof ClientError) return error
        continue
      }

      return result
    }
  }

  async blockNonce(accountId: AccountId | string, retryOnError: boolean = true): Promise<number | ClientError> {
    const accountInfo = await this.blockAccountInfo(accountId, retryOnError)
    if (accountInfo instanceof ClientError) return accountInfo

    return accountInfo.nonce.toNumber()
  }

  async blockBalance(accountId: AccountId | string, retryOnError: boolean = true): Promise<AccountData | ClientError> {
    const info = await this.blockAccountInfo(accountId, retryOnError)
    if (info instanceof ClientError) return info

    return info.data
  }

  async blockAccountInfo(
    accountId: AccountId | string,
    retryOnError: boolean = true,
  ): Promise<AccountInfo | ClientError> {
    const blockHash = await this.blockHash()
    if (blockHash instanceof ClientError) return blockHash

    return this.client.rpc.system.account(accountId, blockHash, retryOnError)
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

  async block(retryOnError: boolean = true, retryOnNone: boolean = true): Promise<SignedBlock | ClientError> {
    const hash = await this.blockHash(retryOnError)
    if (hash instanceof ClientError) return hash

    const block = await this.client.block(hash, retryOnError, retryOnNone)
    if (block == null) return new ClientError("Failed to fetch finalized block")
    return block
  }

  async blockHeader(retryOnError: boolean = true, retryOnNone: boolean = true): Promise<AvailHeader | ClientError> {
    const hash = await this.blockHash(retryOnError)
    if (hash instanceof ClientError) return hash

    const header = await this.client.blockHeader(hash, retryOnError, retryOnNone)
    if (header == null) return new ClientError("Failed to fetch finalized block header")

    return header
  }

  async blockHash(retryOnError: boolean = true): Promise<H256 | ClientError> {
    const durations = [8, 5, 3, 2, 1].map((x) => Duration.fromSecs(x))

    while (true) {
      const result = await Rpc.chain.getFinalizedHead(this.endpoint)
      if (result instanceof ClientError) {
        const error = await sleepOrReturnError(durations, retryOnError, result, "Fetching finalized block hash failed")
        if (error instanceof ClientError) return error
        continue
      }

      return result
    }
  }

  async blockHeight(retryOnError: boolean = true): Promise<number | ClientError> {
    const ref = await this.blockRef(retryOnError)
    if (ref instanceof ClientError) return ref

    return ref.height
  }

  async blockRef(retryOnError: boolean = true): Promise<BlockRef | ClientError> {
    const durations = [8, 5, 3, 2, 1].map((x) => Duration.fromSecs(x))

    while (true) {
      const result = await Rpc.system.latestBlockInfo(this.endpoint, false)
      if (result instanceof ClientError) {
        const error = await sleepOrReturnError(durations, retryOnError, result, "Fetching finalized block hash failed")
        if (error instanceof ClientError) return error
        continue
      }

      return result
    }
  }

  async blockBalance(accountId: AccountId | string, retryOnError: boolean = true): Promise<AccountData | ClientError> {
    const info = await this.blockAccountInfo(accountId, retryOnError)
    if (info instanceof ClientError) return info

    return info.data
  }

  async blockNonce(accountId: AccountId | string, retryOnError: boolean = true): Promise<number | ClientError> {
    const accountInfo = await this.blockAccountInfo(accountId, retryOnError)
    if (accountInfo instanceof ClientError) return accountInfo

    return accountInfo.nonce.toNumber()
  }

  async blockAccountInfo(
    accountId: AccountId | string,
    retryOnError: boolean = true,
  ): Promise<AccountInfo | ClientError> {
    const blockHash = await this.blockHash()
    if (blockHash instanceof ClientError) return blockHash

    return this.client.rpc.system.account(accountId, blockHash, retryOnError)
  }
}
