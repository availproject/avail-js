import {
  rpc,
  H256,
  Client,
  AvailError,
  AccountId,
  AvailHeader,
  BlockApi,
  AccountData,
  AccountInfo,
  SessionKeys,
  BlockInfo,
  ChainInfo,
  GrandpaJustification,
} from "."
import { withRetryOnError, withRetryOnErrorAndNone } from "./utils"
import { AccountInfoStruct, BlockState } from "./core/types/metadata"
import { PolkadotExtrinsic, SignedBlock, Index } from "./core/types/polkadot"

export class Best {
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
  async blockHeader(): Promise<AvailHeader | AvailError> {
    const retryOnError = this.retryOnError ?? this.client.isGlobalRetiresEnabled()

    const blockHash = await this.blockHash()
    if (blockHash instanceof AvailError) return blockHash

    const header = await this.client.chain().retryOn(retryOnError, true).blockHeader(blockHash)
    if (header == null) return new AvailError("Failed to fetch best block header")

    return header
  }

  async block(): Promise<BlockApi | AvailError> {
    const hash = await this.blockHash()
    if (hash instanceof AvailError) return hash
    return new BlockApi(this.client, hash)
  }

  async blockInfo(): Promise<BlockInfo | AvailError> {
    const retryOnError = this.retryOnError ?? this.client.isGlobalRetiresEnabled()
    return await this.client.chain().retryOn(retryOnError, null).blockInfo(true)
  }

  async blockHash(): Promise<H256 | AvailError> {
    const info = await this.blockInfo()
    if (info instanceof AvailError) return info
    return info.hash
  }

  async blockHeight(): Promise<number | AvailError> {
    const info = await this.blockInfo()
    if (info instanceof AvailError) return info
    return info.height
  }

  async legacyBlock(): Promise<SignedBlock | AvailError> {
    const retryOnError = this.retryOnError ?? this.client.isGlobalRetiresEnabled()

    const blockHash = await this.blockHash()
    if (blockHash instanceof AvailError) return blockHash

    let block = await this.client.chain().retryOn(retryOnError, true).legacyBlock(blockHash)
    if (block instanceof AvailError) return block
    if (block == null) return new AvailError("Failed to fetch legacy block")

    return block
  }

  // Account stuff
  async accountNonce(accountId: AccountId | string): Promise<number | AvailError> {
    const accountInfo = await this.accountInfo(accountId)
    if (accountInfo instanceof AvailError) return accountInfo

    return accountInfo.nonce
  }

  async accountBalance(accountId: AccountId | string): Promise<AccountData | AvailError> {
    const info = await this.accountInfo(accountId)
    if (info instanceof AvailError) return info

    return info.data
  }

  async accountInfo(accountId: AccountId | string): Promise<AccountInfo | AvailError> {
    const retryOnError = this.retryOnError ?? this.client.isGlobalRetiresEnabled()

    const blockHash = await this.blockHash()
    if (blockHash instanceof AvailError) return blockHash

    return await this.client.chain().retryOn(retryOnError, null).accountInfo(accountId, blockHash)
  }
}

export class Finalized {
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
  async blockHeader(): Promise<AvailHeader | AvailError> {
    const retryOnError = this.retryOnError ?? this.client.isGlobalRetiresEnabled()

    const blockHash = await this.blockHash()
    if (blockHash instanceof AvailError) return blockHash

    const header = await this.client.chain().retryOn(retryOnError, true).blockHeader(blockHash)
    if (header == null) return new AvailError("Failed to fetch best block header")

    return header
  }

  async block(): Promise<BlockApi | AvailError> {
    const hash = await this.blockHash()
    if (hash instanceof AvailError) return hash
    return new BlockApi(this.client, hash)
  }

  async blockInfo(): Promise<BlockInfo | AvailError> {
    const retryOnError = this.retryOnError ?? this.client.isGlobalRetiresEnabled()
    return await this.client.chain().retryOn(retryOnError, null).blockInfo(false)
  }

  async blockHash(): Promise<H256 | AvailError> {
    const info = await this.blockInfo()
    if (info instanceof AvailError) return info
    return info.hash
  }

  async blockHeight(): Promise<number | AvailError> {
    const info = await this.blockInfo()
    if (info instanceof AvailError) return info
    return info.height
  }

  async legacyBlock(): Promise<SignedBlock | AvailError> {
    const retryOnError = this.retryOnError ?? this.client.isGlobalRetiresEnabled()

    const blockHash = await this.blockHash()
    if (blockHash instanceof AvailError) return blockHash

    let block = await this.client.chain().retryOn(retryOnError, true).legacyBlock(blockHash)
    if (block instanceof AvailError) return block
    if (block == null) return new AvailError("Failed to fetch legacy block")

    return block
  }

  // Account stuff
  async accountNonce(accountId: AccountId | string): Promise<number | AvailError> {
    const accountInfo = await this.accountInfo(accountId)
    if (accountInfo instanceof AvailError) return accountInfo

    return accountInfo.nonce
  }

  async accountBalance(accountId: AccountId | string): Promise<AccountData | AvailError> {
    const info = await this.accountInfo(accountId)
    if (info instanceof AvailError) return info

    return info.data
  }

  async accountInfo(accountId: AccountId | string): Promise<AccountInfo | AvailError> {
    const retryOnError = this.retryOnError ?? this.client.isGlobalRetiresEnabled()

    const blockHash = await this.blockHash()
    if (blockHash instanceof AvailError) return blockHash

    return await this.client.chain().retryOn(retryOnError, null).accountInfo(accountId, blockHash)
  }
}

export class ChainApi {
  private client: Client
  private retryOnError: boolean | null = null
  private retryOnNone: boolean | null = null
  constructor(client: Client) {
    this.client = client
  }

  retryOn(onError: boolean | null, onNone: boolean | null): ChainApi {
    this.retryOnError = onError
    this.retryOnNone = onNone
    return this
  }

  async blockHash(blockHeight?: number): Promise<H256 | null | AvailError> {
    const retryOnError = this.retryOnError ?? this.client.isGlobalRetiresEnabled()
    const retryOnNone = this.retryOnNone ?? false

    const op = () => rpc.chain.getBlockHash(this.client.endpoint, blockHeight)
    return await withRetryOnErrorAndNone(op, retryOnError, retryOnNone)
  }

  async blockHeader(at?: H256 | string | number): Promise<AvailHeader | null | AvailError> {
    const retryOnError = this.retryOnError ?? this.client.isGlobalRetiresEnabled()
    const retryOnNone = this.retryOnNone ?? false

    let blockHash = await to_block_hash(this, at)
    if (blockHash instanceof AvailError) return blockHash

    const op = () => rpc.chain.getHeader(this.client.endpoint, blockHash)
    const result = await withRetryOnErrorAndNone(op, retryOnError, retryOnNone)
    if (result instanceof AvailError || result == null) return result

    try {
      return this.client.api.registry.createType("Header", result) as AvailHeader
    } catch (e: any) {
      return new AvailError(e instanceof Error ? e.message : String(e))
    }
  }

  async legacyBlock(at?: H256 | string): Promise<SignedBlock | null | AvailError> {
    const retryOnError = this.retryOnError ?? this.client.isGlobalRetiresEnabled()
    const retryOnNone = this.retryOnNone ?? false

    const op = () => rpc.chain.getBlock(this.client.endpoint, at === undefined ? at : at.toString())
    return await withRetryOnErrorAndNone(op, retryOnError, retryOnNone)
  }

  async blockNonce(accountId: AccountId | string, at: H256 | string | number): Promise<number | AvailError> {
    const result = await this.accountInfo(accountId, at)
    if (result instanceof AvailError) return result
    return result.nonce
  }

  async accountNonce(accountId: AccountId | string): Promise<number | AvailError> {
    const retryOnError = this.retryOnError ?? this.client.isGlobalRetiresEnabled()
    const address = accountId instanceof AccountId ? accountId.toSS58() : accountId

    const op = async () => {
      try {
        const r = await this.client.api.rpc.system.accountNextIndex<Index>(address)
        return r.toNumber()
      } catch (e: any) {
        return new AvailError(e instanceof Error ? e.message : String(e))
      }
    }

    return await withRetryOnError(op, retryOnError)
  }

  async accountBalance(accountId: AccountId | string, at: H256 | string | number): Promise<AccountData | AvailError> {
    const result = await this.accountInfo(accountId, at)
    if (result instanceof AvailError) return result
    return result.data
  }

  async accountInfo(accountId: AccountId | string, at: H256 | string | number): Promise<AccountInfo | AvailError> {
    const retryOnError = this.retryOnError ?? this.client.isGlobalRetiresEnabled()
    const address = accountId instanceof AccountId ? accountId.toSS58() : accountId
    let blockHash = await to_block_hash(this, at)
    if (blockHash instanceof AvailError) return blockHash
    if (blockHash === undefined) return new AvailError("This cannot happen")

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
        return new AvailError(e instanceof Error ? e.message : String(e))
      }
    }
    return await withRetryOnError(op, retryOnError)
  }

  // Block State
  async blockState(blockId: H256 | string | number): Promise<BlockState | AvailError> {
    const blockId2 = to_hash_number(blockId)
    if (blockId2 instanceof AvailError) return blockId2

    const chainInfo = await this.chainInfo()
    if (chainInfo instanceof AvailError) return chainInfo

    let num = 0
    if (typeof blockId2 === "number") {
      num = blockId2
    }
    if (blockId2 instanceof H256) {
      const h = blockId2
      if (h.toHex() == chainInfo.finalizedHash.toHex()) return "Finalized"
      if (h.toHex() == chainInfo.bestHash.toHex()) return "Included"

      const n = await this.blockHeight(h)
      if (n instanceof AvailError) return n
      if (n == null) return "DoesNotExist"

      const blockHash = await this.blockHash(n)
      if (blockHash instanceof AvailError) return blockHash
      if (blockHash == null) return "DoesNotExist"
      if (blockHash.toString() != h.toString()) return "Discarded"

      num = n
    }

    if (num > chainInfo.bestHeight) return "DoesNotExist"
    if (num > chainInfo.finalizedHeight) return "Included"

    return "Finalized"
  }

  async blockHeight(at: H256 | string): Promise<number | null | AvailError> {
    const retryOnError = this.retryOnError ?? this.client.isGlobalRetiresEnabled()
    const op = () => rpc.system.getBlockNumber(this.client.endpoint, at.toString())
    return await withRetryOnError(op, retryOnError)
  }

  async blockInfo(useBestBlock?: boolean): Promise<BlockInfo | AvailError> {
    const retryOnError = this.retryOnError ?? this.client.isGlobalRetiresEnabled()
    const bestBlock = useBestBlock ?? false

    const op = () => rpc.system.latestBlockInfo(this.client.endpoint, bestBlock)
    return await withRetryOnError(op, retryOnError)
  }

  async chainInfo(): Promise<ChainInfo | AvailError> {
    const retryOnError = this.retryOnError ?? this.client.isGlobalRetiresEnabled()

    const op = () => rpc.system.latestChainInfo(this.client.endpoint)
    return await withRetryOnError(op, retryOnError)
  }

  async submitExtrinsic(tx: string | PolkadotExtrinsic | Uint8Array): Promise<H256 | AvailError> {
    const retryOnError = this.retryOnError ?? this.client.isGlobalRetiresEnabled()
    const op = () => this.client.api.rpc.author.submitExtrinsic(tx)
    const result = await withRetryOnError(op, retryOnError)
    if (result instanceof AvailError) return result

    return H256.from(result)
  }

  /*   TODO
  async grandpaBlockJustification(blockHeight: number): Promise<GrandpaJustification | null | AvailError> {
      const retryOnError = this.retryOnError ?? this.client.isGlobalRetiresEnabled()
      const op = () => rpc.grandpa.blockJustification(this.client.endpoint, blockHeight)
      return await withRetryOnError(op, retryOnError)
    } 
  */

  async grandpaBlockJustificationJson(blockHeight: number): Promise<GrandpaJustification | null | AvailError> {
    const retryOnError = this.retryOnError ?? this.client.isGlobalRetiresEnabled()
    const op = () => rpc.grandpa.blockJustificationJson(this.client.endpoint, blockHeight)
    return await withRetryOnError(op, retryOnError)
  }

  async fetchExtrinsic(
    blockId: H256 | string | number,
    options?: rpc.system.fetchExtrinsics.Options,
  ): Promise<rpc.system.fetchExtrinsics.ExtrinsicInfo[] | AvailError> {
    const retryOnError = this.retryOnError ?? this.client.isGlobalRetiresEnabled()
    const op = () => rpc.system.fetchExtrinsics.fetchExtrinsics(this.client.endpoint, blockId, options)
    return await withRetryOnError(op, retryOnError)
  }

  async fetchEvents(
    blockId: H256 | string | number,
    options?: rpc.system.fetchEvents.Options,
  ): Promise<rpc.system.fetchEvents.BlockPhaseEvent[] | AvailError> {
    const retryOnError = this.retryOnError ?? this.client.isGlobalRetiresEnabled()
    let blockHash = await to_string_2(this, blockId)
    if (blockHash instanceof AvailError) return blockHash

    const op = () => rpc.system.fetchEvents.fetchEvents(this.client.endpoint, blockHash, options)
    return await withRetryOnError(op, retryOnError)
  }

  async rotateKeys(): Promise<SessionKeys | AvailError> {
    const retryOnError = this.retryOnError ?? this.client.isGlobalRetiresEnabled()
    const op = () => rpc.author.rotateKeys(this.client.endpoint)
    return await withRetryOnError(op, retryOnError)
  }
}

async function to_block_hash(rpc: ChainApi, value?: H256 | string | number): Promise<string | undefined | AvailError> {
  if (value === undefined) return value
  if (value instanceof H256) return value.toHex()
  if (typeof value === "string") return value

  const hash = await rpc.blockHash(value)
  if (hash instanceof AvailError) return hash
  if (hash == null) return new AvailError("Block Hash not found for that block height")
  return hash.toHex()
}

async function to_string(rpc: ChainApi, value?: H256 | string | number): Promise<string | undefined | AvailError> {
  if (value === undefined) return value
  if (value instanceof H256) return value.toHex()
  if (typeof value === "string") return value

  const hash = await rpc.blockHash(value)
  if (hash instanceof AvailError) return hash
  if (hash == null) return new AvailError("Block Hash not found for that block height")
  return hash.toHex()
}

async function to_string_2(rpc: ChainApi, value: H256 | string | number): Promise<string | AvailError> {
  if (value instanceof H256) return value.toHex()
  if (typeof value === "string") return value

  const hash = await rpc.blockHash(value)
  if (hash instanceof AvailError) return hash
  if (hash == null) return new AvailError("Block Hash not found for that block height")
  return hash.toHex()
}

function to_hash_number(value: H256 | string | number): H256 | number | AvailError {
  if (typeof value === "number") return value
  return H256.from(value)
}
