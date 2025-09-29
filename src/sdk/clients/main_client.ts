import { rpc } from ".."
import { initialize } from "../../chain"
import { ClientError } from "../error"
import { AccountId, AvailHeader, H256 } from "../types"
import { AccountData, AccountInfoStruct, BlockRef, BlockState, AccountInfo, SessionKeys } from "../types/metadata"
import { ApiPromise, PolkadotExtrinsic, RuntimeVersion, SignedBlock, Index } from "../types/polkadot"
import { Block } from "../block"
import { TransactionApi } from "./transactions"
import { fetchExtrinsics, fetchEvents, ChainInfo, BlockInfo } from "./../rpc/system"
import { GrandpaJustification } from "../rpc/grandpa"
import { withRetryOnError, withRetryOnErrorAndNone } from "./utils"

export class Client {
  public api: ApiPromise
  public endpoint: string
  private global_retires: boolean
  private constructor(api: ApiPromise, endpoint: string) {
    this.api = api
    this.endpoint = endpoint
    this.global_retires = true
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
  genesisHash(): H256 {
    return new H256(this.api.genesisHash)
  }

  runtimeVersion(): RuntimeVersion {
    return this.api.runtimeVersion
  }

  block(blockId: H256 | string | number): Block {
    return new Block(this, blockId)
  }

  rpc(): RpcApi {
    return new RpcApi(this)
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

class Best {
  private client: Client
  private retryOnError: boolean | null = null

  constructor(client: Client) {
    this.client = client
  }

  retryOn(error: boolean | null): Best {
    this.retryOnError = error
    return this
  }

  // Block stuff
  async blockHeader(): Promise<AvailHeader | ClientError> {
    const retryOnError = this.retryOnError ?? this.client.isGlobalRetiresEnabled()

    const blockHash = await this.blockHash()
    if (blockHash instanceof ClientError) return blockHash

    const header = await this.client.rpc().retryOn(retryOnError, true).blockHeader(blockHash)
    if (header == null) return new ClientError("Failed to fetch best block header")

    return header
  }

  async block(): Promise<Block | ClientError> {
    const hash = await this.blockHash()
    if (hash instanceof ClientError) return hash
    return new Block(this.client, hash)
  }

  async blockInfo(): Promise<BlockInfo | ClientError> {
    const retryOnError = this.retryOnError ?? this.client.isGlobalRetiresEnabled()
    return await this.client.rpc().retryOn(retryOnError, null).blockInfo(true)
  }

  async blockHash(): Promise<H256 | ClientError> {
    const info = await this.blockInfo()
    if (info instanceof ClientError) return info
    return info.hash
  }

  async blockHeight(): Promise<number | ClientError> {
    const info = await this.blockInfo()
    if (info instanceof ClientError) return info
    return info.height
  }

  async legacyBlock(): Promise<SignedBlock | ClientError> {
    const retryOnError = this.retryOnError ?? this.client.isGlobalRetiresEnabled()

    const blockHash = await this.blockHash()
    if (blockHash instanceof ClientError) return blockHash

    let block = await this.client.rpc().retryOn(retryOnError, true).legacyBlock(blockHash)
    if (block instanceof ClientError) return block
    if (block == null) return new ClientError("Failed to fetch legacy block")

    return block
  }

  // Account stuff
  async accountNonce(accountId: AccountId | string): Promise<number | ClientError> {
    const accountInfo = await this.accountInfo(accountId)
    if (accountInfo instanceof ClientError) return accountInfo

    return accountInfo.nonce
  }

  async accountBalance(accountId: AccountId | string): Promise<AccountData | ClientError> {
    const info = await this.accountInfo(accountId)
    if (info instanceof ClientError) return info

    return info.data
  }

  async accountInfo(accountId: AccountId | string): Promise<AccountInfo | ClientError> {
    const retryOnError = this.retryOnError ?? this.client.isGlobalRetiresEnabled()

    const blockHash = await this.blockHash()
    if (blockHash instanceof ClientError) return blockHash

    return await this.client.rpc().retryOn(retryOnError, null).accountInfo(accountId, blockHash)
  }
}

class Finalized {
  private client: Client
  private retryOnError: boolean | null = null

  constructor(client: Client) {
    this.client = client
  }

  retryOn(error: boolean | null): Finalized {
    this.retryOnError = error
    return this
  }

  // Block stuff
  async blockHeader(): Promise<AvailHeader | ClientError> {
    const retryOnError = this.retryOnError ?? this.client.isGlobalRetiresEnabled()

    const blockHash = await this.blockHash()
    if (blockHash instanceof ClientError) return blockHash

    const header = await this.client.rpc().retryOn(retryOnError, true).blockHeader(blockHash)
    if (header == null) return new ClientError("Failed to fetch best block header")

    return header
  }

  async block(): Promise<Block | ClientError> {
    const hash = await this.blockHash()
    if (hash instanceof ClientError) return hash
    return new Block(this.client, hash)
  }

  async blockInfo(): Promise<BlockInfo | ClientError> {
    const retryOnError = this.retryOnError ?? this.client.isGlobalRetiresEnabled()
    return await this.client.rpc().retryOn(retryOnError, null).blockInfo(false)
  }

  async blockHash(): Promise<H256 | ClientError> {
    const info = await this.blockInfo()
    if (info instanceof ClientError) return info
    return info.hash
  }

  async blockHeight(): Promise<number | ClientError> {
    const info = await this.blockInfo()
    if (info instanceof ClientError) return info
    return info.height
  }

  async legacyBlock(): Promise<SignedBlock | ClientError> {
    const retryOnError = this.retryOnError ?? this.client.isGlobalRetiresEnabled()

    const blockHash = await this.blockHash()
    if (blockHash instanceof ClientError) return blockHash

    let block = await this.client.rpc().retryOn(retryOnError, true).legacyBlock(blockHash)
    if (block instanceof ClientError) return block
    if (block == null) return new ClientError("Failed to fetch legacy block")

    return block
  }

  // Account stuff
  async accountNonce(accountId: AccountId | string): Promise<number | ClientError> {
    const accountInfo = await this.accountInfo(accountId)
    if (accountInfo instanceof ClientError) return accountInfo

    return accountInfo.nonce
  }

  async accountBalance(accountId: AccountId | string): Promise<AccountData | ClientError> {
    const info = await this.accountInfo(accountId)
    if (info instanceof ClientError) return info

    return info.data
  }

  async accountInfo(accountId: AccountId | string): Promise<AccountInfo | ClientError> {
    const retryOnError = this.retryOnError ?? this.client.isGlobalRetiresEnabled()

    const blockHash = await this.blockHash()
    if (blockHash instanceof ClientError) return blockHash

    return await this.client.rpc().retryOn(retryOnError, null).accountInfo(accountId, blockHash)
  }
}

export class RpcApi {
  private client: Client
  private retryOnError: boolean | null = null
  private retryOnNone: boolean | null = null
  constructor(client: Client) {
    this.client = client
  }

  retryOn(onError: boolean | null, onNone: boolean | null): RpcApi {
    this.retryOnError = onError
    this.retryOnNone = onNone
    return this
  }

  async blockHash(blockHeight?: number): Promise<H256 | null | ClientError> {
    const retryOnError = this.retryOnError ?? this.client.isGlobalRetiresEnabled()
    const retryOnNone = this.retryOnNone ?? false

    const op = () => rpc.chain.getBlockHash(this.client.endpoint, blockHeight)
    return await withRetryOnErrorAndNone(op, retryOnError, retryOnNone)
  }

  async blockHeader(at?: H256 | string | number): Promise<AvailHeader | null | ClientError> {
    const retryOnError = this.retryOnError ?? this.client.isGlobalRetiresEnabled()
    const retryOnNone = this.retryOnNone ?? false

    let blockHash = await to_block_hash(this, at)
    if (blockHash instanceof ClientError) return blockHash

    const op = () => rpc.chain.getHeader(this.client.endpoint, blockHash)
    const result = await withRetryOnErrorAndNone(op, retryOnError, retryOnNone)

    try {
      return this.client.api.registry.createType("Header", result) as AvailHeader
    } catch (e: any) {
      return new ClientError(e.toString())
    }
  }

  async legacyBlock(at?: H256 | string): Promise<SignedBlock | null | ClientError> {
    const retryOnError = this.retryOnError ?? this.client.isGlobalRetiresEnabled()
    const retryOnNone = this.retryOnNone ?? false

    const op = () => rpc.chain.getBlock(this.client.endpoint, at === undefined ? at : at.toString())
    return await withRetryOnErrorAndNone(op, retryOnError, retryOnNone)
  }

  async blockNonce(accountId: AccountId | string, at: H256 | string | number): Promise<number | ClientError> {
    const result = await this.accountInfo(accountId, at)
    if (result instanceof ClientError) return result
    return result.nonce
  }

  async accountNonce(accountId: AccountId | string): Promise<number | ClientError> {
    const retryOnError = this.retryOnError ?? this.client.isGlobalRetiresEnabled()
    const address = accountId instanceof AccountId ? accountId.toSS58() : accountId

    const op = async () => {
      try {
        const r = await this.client.api.rpc.system.accountNextIndex<Index>(address)
        return r.toNumber()
      } catch (e: any) {
        return new ClientError(e.toString())
      }
    }

    return await withRetryOnError(op, retryOnError)
  }

  async accountBalance(accountId: AccountId | string, at: H256 | string | number): Promise<AccountData | ClientError> {
    const result = await this.accountInfo(accountId, at)
    if (result instanceof ClientError) return result
    return result.data
  }

  async accountInfo(accountId: AccountId | string, at: H256 | string | number): Promise<AccountInfo | ClientError> {
    const retryOnError = this.retryOnError ?? this.client.isGlobalRetiresEnabled()
    const address = accountId instanceof AccountId ? accountId.toSS58() : accountId
    let blockHash = await to_block_hash(this, at)
    if (blockHash instanceof ClientError) return blockHash
    if (blockHash === undefined) return new ClientError("This cannot happen")

    const op = async () => {
      try {
        const api = await this.client.api.at(blockHash)
        const struct = await api.query.system.account<AccountInfoStruct>(address)
        return new AccountInfo(
          struct.nonce.toNumber(),
          struct.consumers.toNumber(),
          struct.providers.toNumber(),
          struct.sufficients.toNumber(),
          struct.data,
        )
      } catch (e: any) {
        return new ClientError(e.toString())
      }
    }
    return await withRetryOnError(op, retryOnError)
  }

  // Block State
  async blockState(blockId: H256 | string | number): Promise<BlockState | ClientError> {
    const blockId2 = to_hash_number(blockId)
    if (blockId2 instanceof ClientError) return blockId2

    const chainInfo = await this.chainInfo()
    if (chainInfo instanceof ClientError) return chainInfo

    let num = 0
    if (typeof blockId2 === "number") {
      num = blockId2
    }
    if (blockId2 instanceof H256) {
      const h = blockId2
      if (h == chainInfo.finalizedHash) return "Finalized"
      if (h == chainInfo.bestHash) return "Included"

      const n = await this.blockHeight(h)
      if (n instanceof ClientError) return n
      if (n == null) return "DoesNotExist"

      const blockHash = await this.blockHash(n)
      if (blockHash instanceof ClientError) return blockHash
      if (blockHash == null) return "DoesNotExist"
      if (blockHash.toString() != h.toString()) return "Discarded"

      num = n
    }

    if (num > chainInfo.bestHeight) return "DoesNotExist"
    if (num > chainInfo.finalizedHeight) return "Included"

    return "Finalized"
  }

  async blockHeight(at: H256 | string): Promise<number | null | ClientError> {
    const retryOnError = this.retryOnError ?? this.client.isGlobalRetiresEnabled()
    const op = () => rpc.system.getBlockNumber(this.client.endpoint, at.toString())
    return await withRetryOnError(op, retryOnError)
  }

  async blockInfo(useBestBlock?: boolean): Promise<BlockInfo | ClientError> {
    const retryOnError = this.retryOnError ?? this.client.isGlobalRetiresEnabled()
    const bestBlock = useBestBlock ?? false

    const op = () => rpc.system.latestBlockInfo(this.client.endpoint, bestBlock)
    return await withRetryOnError(op, retryOnError)
  }

  async chainInfo(): Promise<ChainInfo | ClientError> {
    const retryOnError = this.retryOnError ?? this.client.isGlobalRetiresEnabled()

    const op = () => rpc.system.latestChainInfo(this.client.endpoint)
    return await withRetryOnError(op, retryOnError)
  }

  async submitExtrinsic(tx: string | PolkadotExtrinsic | Uint8Array): Promise<H256 | ClientError> {
    const retryOnError = this.retryOnError ?? this.client.isGlobalRetiresEnabled()
    const op = () => this.client.api.rpc.author.submitExtrinsic(tx)
    const result = await withRetryOnError(op, retryOnError)

    if (result instanceof ClientError) return result
    return H256.from(result)
  }

  /*   TODO
  async grandpaBlockJustification(blockHeight: number): Promise<GrandpaJustification | null | ClientError> {
      const retryOnError = this.retryOnError ?? this.client.isGlobalRetiresEnabled()
      const op = () => rpc.grandpa.blockJustification(this.client.endpoint, blockHeight)
      return await withRetryOnError(op, retryOnError)
    } 
  */

  async grandpaBlockJustificationJson(blockHeight: number): Promise<GrandpaJustification | null | ClientError> {
    const retryOnError = this.retryOnError ?? this.client.isGlobalRetiresEnabled()
    const op = () => rpc.grandpa.blockJustificationJson(this.client.endpoint, blockHeight)
    return await withRetryOnError(op, retryOnError)
  }

  async fetchExtrinsic(
    blockId: H256 | string | number,
    options?: fetchExtrinsics.Options,
  ): Promise<fetchExtrinsics.ExtrinsicInfo[] | ClientError> {
    const retryOnError = this.retryOnError ?? this.client.isGlobalRetiresEnabled()
    const op = () => fetchExtrinsics.fetchExtrinsics(this.client.endpoint, blockId, options)
    return await withRetryOnError(op, retryOnError)
  }

  async fetchEvents(
    blockId: H256 | string | number,
    options?: fetchEvents.Options,
  ): Promise<fetchEvents.BlockPhaseEvent[] | ClientError> {
    const retryOnError = this.retryOnError ?? this.client.isGlobalRetiresEnabled()
    let blockHash = await to_string_2(this, blockId)
    if (blockHash instanceof ClientError) return blockHash

    const op = () => fetchEvents.fetchEvents(this.client.endpoint, blockHash, options)
    return await withRetryOnError(op, retryOnError)
  }

  async rotateKeys(): Promise<SessionKeys | ClientError> {
    const retryOnError = this.retryOnError ?? this.client.isGlobalRetiresEnabled()
    const op = () => rpc.author.rotateKeys(this.client.endpoint)
    return await withRetryOnError(op, retryOnError)
  }
}

async function to_block_hash(rpc: RpcApi, value?: H256 | string | number): Promise<string | undefined | ClientError> {
  if (value === undefined) return value
  if (value instanceof H256) return value.toHex()
  if (typeof value === "string") return value

  const hash = await rpc.blockHash(value)
  if (hash instanceof ClientError) return hash
  if (hash == null) return new ClientError("Block Hash not found for that block height")
  return hash.toHex()
}

async function to_string(rpc: RpcApi, value?: H256 | string | number): Promise<string | undefined | ClientError> {
  if (value === undefined) return value
  if (value instanceof H256) return value.toHex()
  if (typeof value === "string") return value

  const hash = await rpc.blockHash(value)
  if (hash instanceof ClientError) return hash
  if (hash == null) return new ClientError("Block Hash not found for that block height")
  return hash.toHex()
}

async function to_string_2(rpc: RpcApi, value: H256 | string | number): Promise<string | ClientError> {
  if (value instanceof H256) return value.toHex()
  if (typeof value === "string") return value

  const hash = await rpc.blockHash(value)
  if (hash instanceof ClientError) return hash
  if (hash == null) return new ClientError("Block Hash not found for that block height")
  return hash.toHex()
}

function to_hash_number(value: H256 | string | number): H256 | number | ClientError {
  if (typeof value === "number") return value
  return H256.from(value)
}
