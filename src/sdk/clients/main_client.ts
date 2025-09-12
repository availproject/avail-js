import { rpc } from ".."
import { initialize } from "../../chain"
import { ClientError } from "../error"
import { log } from "../log"
import { AccountId, AvailHeader, H256 } from "../types"
import { AccountData, AccountInfoStruct, BlockRef, BlockState, HashLike } from "../types/metadata"
import { ApiPromise, PolkadotExtrinsic, RuntimeVersion, SignedBlock } from "../types/polkadot"
import { Duration, sleep } from "../utils"
import { Block } from "../block"
import { Rpc } from "./rpc"
import { Transactions } from "./transactions"
import { Blocks } from "../blocks"

export class Client {
  public api: ApiPromise
  public endpoint: string
  public finalized: Finalized
  public best: Best
  public rpc: Rpc
  public tx: Transactions
  private constructor(api: ApiPromise, endpoint: string) {
    this.api = api
    this.endpoint = endpoint
    this.finalized = new Finalized(this)
    this.best = new Best(this)
    this.rpc = new Rpc(this)
    this.tx = new Transactions(this)
  }

  /**
   *
   * Does not throw
   */
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
    blockHash?: HashLike,
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
    blockHash?: HashLike,
    retryOnError: boolean = true,
    retryOnNone: boolean = false,
  ): Promise<number | null | ClientError> {
    return await this.rpc.system.getBlockNumber(blockHash, retryOnError, retryOnNone)
  }

  async nonce(accountId: AccountId | string, retryOnError: boolean = true): Promise<number | ClientError> {
    return await this.rpc.system.accountNexIndex(accountId, retryOnError)
  }

  async blockNonce(accountId: AccountId | string, blockHash: HashLike): Promise<number | ClientError> {
    const info = await this.accountInfo(accountId, blockHash)
    if (info instanceof ClientError) return info

    return info.nonce.toNumber()
  }

  async balance(
    accountId: AccountId | string,
    blockHash?: HashLike,
    retryOnError: boolean = true,
  ): Promise<AccountData | ClientError> {
    if (blockHash == undefined) {
      const balance = await this.best.balance(accountId, retryOnError)
      if (balance instanceof ClientError) return balance
      return balance
    }

    const info = await this.accountInfo(accountId, blockHash, retryOnError)
    if (info instanceof ClientError) return info

    return info.data
  }

  async accountInfo(
    accountId: AccountId | string,
    blockHash: HashLike,
    retryOnError: boolean = true,
  ): Promise<AccountInfoStruct | ClientError> {
    return await this.rpc.system.account(accountId, blockHash, retryOnError)
  }

  block(blockId: H256 | string | number): Block {
    return new Block(this, blockId)
  }

  blocks(start: number, end: number): Blocks {
    return new Blocks(this, start, end)
  }

  // (RPC) Block
  async rpcBlock(
    blockHash?: HashLike,
    retryOnError: boolean = true,
    retryOnNone: boolean = false,
  ): Promise<SignedBlock | null | ClientError> {
    return await this.rpc.chain.getBlock(blockHash?.toString(), retryOnError, retryOnNone)
  }

  // Block State
  async blockState(
    blockId: BlockRef | H256 | string | number,
    retryOnError: boolean = true,
  ): Promise<BlockState | ClientError> {
    if (typeof blockId === "number") {
      const height = blockId
      const bestHeight = await this.best.blockHeight(retryOnError)
      if (bestHeight instanceof ClientError) return bestHeight
      if (height > bestHeight) return "DoesNotExist"

      const finalizedHeight = await this.finalized.blockHeight(retryOnError)
      if (finalizedHeight instanceof ClientError) return finalizedHeight
      if (height > finalizedHeight) return "Included"

      return "Finalized"
    }

    if (typeof blockId === "string") {
      const hash = H256.from(blockId)
      if (hash instanceof ClientError) return hash
      blockId = hash
    }

    if (blockId instanceof H256) {
      const hash = blockId
      const height = await this.blockHeight(hash, retryOnError)
      if (height instanceof ClientError) return height
      if (height == null) return "DoesNotExist"

      const finalizedHeight = await this.finalized.blockHeight(retryOnError)
      if (finalizedHeight instanceof ClientError) return finalizedHeight
      if (height > finalizedHeight) return "Included"

      const realHash = await this.blockHash(height, retryOnError)
      if (realHash instanceof ClientError) return realHash
      if (realHash == null) return new ClientError("Failed to fetch block hash")
      if (hash.toString() != realHash.toString()) return "Discarded"

      return "Finalized"
    }

    const height = blockId.height
    const hash = blockId.hash

    const realHash = await this.blockHash(height, retryOnError)
    if (realHash instanceof ClientError) return realHash
    if (realHash == null) return "DoesNotExist"

    const finalizedHeight = await this.finalized.blockHeight(retryOnError)
    if (finalizedHeight instanceof ClientError) return finalizedHeight
    if (height > finalizedHeight) return "Included"

    if (realHash.toString() != hash.toString()) return "Discarded"

    return "Finalized"
  }

  // Sign and/or Submit
  async submit(tx: string | PolkadotExtrinsic | Uint8Array, retryOnError: boolean = true): Promise<H256 | ClientError> {
    return await this.rpc.author.submitExtrinsic(tx, retryOnError)
  }
}

class Best {
  private client: Client
  private endpoint: string
  constructor(client: Client) {
    this.client = client
    this.endpoint = client.endpoint
  }

  async block(retryOnError: boolean = true): Promise<Block | ClientError> {
    const hash = await this.blockHash(retryOnError)
    if (hash instanceof ClientError) return hash
    return new Block(this.client, hash)
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
    const ref = await this.blockInfo(retryOnError)
    if (ref instanceof ClientError) return ref

    return ref.height
  }

  async rpcBlock(retryOnError: boolean = true, retryOnNone: boolean = true): Promise<SignedBlock | ClientError> {
    const block = await this.client.rpcBlock(undefined, retryOnError, retryOnNone)
    if (block == null) return new ClientError("Failed to fetch best block")

    return block
  }

  async blockInfo(retryOnError: boolean = true): Promise<BlockRef | ClientError> {
    const op = () => rpc.system.latestBlockInfo(this.endpoint, true)
    return await somethingOnError(op, "TODO", retryOnError)
  }

  async nonce(accountId: AccountId | string, retryOnError: boolean = true): Promise<number | ClientError> {
    const accountInfo = await this.accountInfo(accountId, retryOnError)
    if (accountInfo instanceof ClientError) return accountInfo

    return accountInfo.nonce.toNumber()
  }

  async balance(accountId: AccountId | string, retryOnError: boolean = true): Promise<AccountData | ClientError> {
    const info = await this.accountInfo(accountId, retryOnError)
    if (info instanceof ClientError) return info

    return info.data
  }

  async accountInfo(
    accountId: AccountId | string,
    retryOnError: boolean = true,
  ): Promise<AccountInfoStruct | ClientError> {
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

  async block(retryOnError: boolean = true): Promise<Block | ClientError> {
    const hash = await this.blockHash(retryOnError)
    if (hash instanceof ClientError) return hash
    return new Block(this.client, hash)
  }

  async blockHeader(retryOnError: boolean = true, retryOnNone: boolean = true): Promise<AvailHeader | ClientError> {
    const hash = await this.blockHash(retryOnError)
    if (hash instanceof ClientError) return hash

    const header = await this.client.blockHeader(hash, retryOnError, retryOnNone)
    if (header == null) return new ClientError("Failed to fetch finalized block header")

    return header
  }

  async blockHash(retryOnError: boolean = true): Promise<H256 | ClientError> {
    const op = () => rpc.chain.getFinalizedHead(this.endpoint)
    return await somethingOnError(op, "TODO", retryOnError)
  }

  async rpcBlock(retryOnError: boolean = true, retryOnNone: boolean = true): Promise<SignedBlock | ClientError> {
    const hash = await this.blockHash(retryOnError)
    if (hash instanceof ClientError) return hash

    const block = await this.client.rpcBlock(hash, retryOnError, retryOnNone)
    if (block == null) return new ClientError("Failed to fetch finalized block")
    return block
  }

  async blockHeight(retryOnError: boolean = true): Promise<number | ClientError> {
    const ref = await this.blockInfo(retryOnError)
    if (ref instanceof ClientError) return ref

    return ref.height
  }

  async blockInfo(retryOnError: boolean = true): Promise<BlockRef | ClientError> {
    const op = () => rpc.system.latestBlockInfo(this.endpoint, false)
    return await somethingOnError(op, "TODO", retryOnError)
  }

  async balance(accountId: AccountId | string, retryOnError: boolean = true): Promise<AccountData | ClientError> {
    const info = await this.accountInfo(accountId, retryOnError)
    if (info instanceof ClientError) return info

    return info.data
  }

  async nonce(accountId: AccountId | string, retryOnError: boolean = true): Promise<number | ClientError> {
    const accountInfo = await this.accountInfo(accountId, retryOnError)
    if (accountInfo instanceof ClientError) return accountInfo

    return accountInfo.nonce.toNumber()
  }

  async accountInfo(
    accountId: AccountId | string,
    retryOnError: boolean = true,
  ): Promise<AccountInfoStruct | ClientError> {
    const blockHash = await this.blockHash()
    if (blockHash instanceof ClientError) return blockHash

    return this.client.rpc.system.account(accountId, blockHash, retryOnError)
  }
}

export async function somethingOnError<T>(
  op: () => Promise<T | ClientError>,
  message: string,
  retryOnError: boolean = true,
): Promise<T | ClientError> {
  const durations = [8, 5, 3, 2, 1].map((x) => Duration.fromSecs(x))

  while (true) {
    const result = await op()
    if (!(result instanceof ClientError)) return result
    if (retryOnError == false || durations.length == 0) return result

    const duration = durations.pop()!
    log.warn(
      `Message: ${message}. Error: ${result.toString()}. Going to sleep for ${duration.value / 1000} seconds and then another attempt will be made`,
    )
    await sleep(duration)
  }
}

export async function somethingOnErrorNone<T>(
  op: () => Promise<T | null | ClientError>,
  message: string,
  retryOnError: boolean = true,
  retryOnNone: boolean = false,
): Promise<T | null | ClientError> {
  const durations = [8, 5, 3, 2, 1].map((x) => Duration.fromSecs(x))

  while (true) {
    const result = await op()
    if (result instanceof ClientError) {
      if (retryOnError == false || durations.length == 0) return result
      const duration = durations.pop()!
      log.warn(
        `Message: ${message}. Error: ${result.toString()}. Going to sleep for ${duration.value / 1000} seconds and then another attempt will be made`,
      )
      await sleep(duration)
      continue
    }

    if (result == null) {
      if (retryOnNone == false || durations.length == 0) return result
      const duration = durations.pop()!
      log.warn(`Got null. Sleep for ${duration} seconds`)
      await sleep(duration)
      continue
    }

    return result
  }
}
