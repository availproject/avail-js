import type { Client } from "../client"
import type {
  AccountData,
  AccountInfoStruct,
  BlockState,
  FeeDetails,
  GrandpaJustification,
  PerDispatchClassWeight,
  RuntimeDispatchInfo,
  SessionKeys,
} from "../core/metadata"
import { AccountId, H256, AccountInfo, type BlockInfo } from "../core/metadata"
import { AvailError } from "../core/error"
import { avail, rpc } from "../core"
import type { AvailHeader } from "../core/header"
import { Duration, sleep } from "../core/utils"
import { log } from "../log"
import type { Index, PolkadotExtrinsic, SignedBlock } from "../core/polkadot"
import type { ChainInfo } from "../core/rpc/system/other"
import type { RpcResponse } from "../core/rpc/raw"
import * as hashStringNumber from "./../conversions/has_string_number"
import { StorageValue } from "../core/storage"

/**
 * Provides chain-level operations and queries for the Avail blockchain.
 *
 * @remarks
 * The Chain class offers methods for querying block data, account information, chain state,
 * and performing various blockchain operations. It supports configurable retry logic for
 * handling transient failures and missing data.
 *
 * @example
 * ```ts
 * const client = await Client.create("ws://127.0.0.1:9944");
 * if (!(client instanceof AvailError)) {
 *   const chain = client.chain();
 *
 *   // Query block hash
 *   const hash = await chain.blockHash(100);
 *   if (!(hash instanceof AvailError) && hash !== null) {
 *     console.log("Block hash:", hash.toString());
 *   }
 *
 *   // Get chain info
 *   const info = await chain.chainInfo();
 *   if (!(info instanceof AvailError)) {
 *     console.log("Best block:", info.bestHeight);
 *   }
 * }
 * ```
 *
 * @public
 */
export class Chain {
  private client: Client
  private retryOnError: boolean | null = null
  private retryOnNone: boolean | null = null
  constructor(client: Client) {
    this.client = client
  }

  /**
   * Configures retry behavior for subsequent chain operations.
   *
   * @param onError - Whether to retry on transport errors. When null, uses the client's global retry setting.
   * @param onNone - Whether to retry when RPC calls return null (e.g., missing storage or blocks).
   * @returns The Chain instance for method chaining.
   *
   * @remarks
   * This method allows fine-grained control over retry behavior. Setting onError overrides the
   * client's global retry flag for this chain instance. Setting onNone to true causes operations
   * that return null to be retried, which is useful when waiting for data to become available.
   *
   * @example
   * ```ts
   * const client = await Client.create("ws://127.0.0.1:9944");
   * if (!(client instanceof AvailError)) {
   *   const chain = client.chain();
   *
   *   // Enable retries for both errors and null responses
   *   chain.retryOn(true, true);
   *
   *   // This will retry if the block doesn't exist yet
   *   const hash = await chain.blockHash(1000000);
   * }
   * ```
   *
   * @public
   */
  retryOn(onError: boolean | null, onNone: boolean | null): Chain {
    this.retryOnError = onError
    this.retryOnNone = onNone
    return this
  }

  /**
   * Fetches the block hash for a given block height.
   *
   * @param blockHeight - The block number to query. If omitted, returns the latest block hash.
   * @returns A Promise resolving to the block hash (H256), null if the block doesn't exist, or an AvailError.
   *
   * @remarks
   * This method retrieves the block hash corresponding to a specific block height. When blockHeight
   * is not provided, it returns the hash of the most recent block. Returns null when querying a
   * block height that doesn't exist yet.
   *
   * @example
   * ```ts
   * const client = await Client.create("ws://127.0.0.1:9944");
   * if (!(client instanceof AvailError)) {
   *   const chain = client.chain();
   *
   *   // Get hash for block 100
   *   const hash = await chain.blockHash(100);
   *   if (!(hash instanceof AvailError) && hash !== null) {
   *     console.log("Block 100 hash:", hash.toString());
   *   }
   *
   *   // Get latest block hash
   *   const latest = await chain.blockHash();
   *   if (!(latest instanceof AvailError) && latest !== null) {
   *     console.log("Latest hash:", latest.toString());
   *   }
   * }
   * ```
   *
   * @public
   */
  async blockHash(blockHeight?: number): Promise<H256 | null | AvailError> {
    const retryOnError = this.shouldRetryOnError()
    const retryOnNone = this.retryOnNone ?? false

    const op = () => rpc.chain.getBlockHash(this.client.endpoint, blockHeight)
    return await withRetryOnErrorAndNone(op, retryOnError, retryOnNone)
  }

  /**
   * Retrieves a block header by hash, block number, or for the latest block.
   *
   * @param at - The block identifier (hash, hex string, or number). If omitted, retrieves the latest block header.
   * @returns A Promise resolving to the AvailHeader, null if not found, or an AvailError.
   *
   * @remarks
   * The block header contains essential block metadata including parent hash, state root,
   * extrinsics root, block number, and consensus digests.
   *
   * @example
   * ```ts
   * const client = await Client.create("ws://127.0.0.1:9944");
   * if (!(client instanceof AvailError)) {
   *   const chain = client.chain();
   *
   *   // Get header by block number
   *   const header = await chain.blockHeader(100);
   *   if (!(header instanceof AvailError) && header !== null) {
   *     console.log("Block number:", header.number.toNumber());
   *     console.log("Parent hash:", header.parentHash.toString());
   *   }
   *
   *   // Get latest block header
   *   const latest = await chain.blockHeader();
   * }
   * ```
   *
   * @public
   */
  async blockHeader(at?: H256 | string | number): Promise<AvailHeader | null | AvailError> {
    const retryOnError = this.shouldRetryOnError()
    const retryOnNone = this.retryOnNone ?? false

    let blockHash: string | undefined = undefined
    if (at != undefined) {
      const hash = await hashStringNumber.toHash(this, at)
      if (hash instanceof AvailError) return hash
      blockHash = hash.toString()
    }

    const op = () => rpc.chain.getHeader(this.client.endpoint, blockHash)
    const result = await withRetryOnErrorAndNone(op, retryOnError, retryOnNone)
    if (result instanceof AvailError || result == null) return result

    try {
      return this.client.api.registry.createType("Header", result) as AvailHeader
    } catch (e: any) {
      return new AvailError(e instanceof Error ? e.message : String(e))
    }
  }

  /**
   * Retrieves the full legacy block structure.
   *
   * @param at - The block identifier (hash or hex string). If omitted, retrieves the latest block.
   * @returns A Promise resolving to the SignedBlock, null if not found, or an AvailError.
   *
   * @remarks
   * This method returns the complete block structure including the block header and all extrinsics
   * in their raw encoded form. Use this when you need access to the full Polkadot-compatible block format.
   *
   * @example
   * ```ts
   * const client = await Client.create("ws://127.0.0.1:9944");
   * if (!(client instanceof AvailError)) {
   *   const chain = client.chain();
   *
   *   // Get block by hash
   *   const hash = await chain.blockHash(100);
   *   if (!(hash instanceof AvailError) && hash !== null) {
   *     const block = await chain.legacyBlock(hash);
   *     if (!(block instanceof AvailError) && block !== null) {
   *       console.log("Block extrinsics:", block.block.extrinsics.length);
   *     }
   *   }
   * }
   * ```
   *
   * @public
   */
  async legacyBlock(at?: H256 | string): Promise<SignedBlock | null | AvailError> {
    const retryOnError = this.shouldRetryOnError()
    const retryOnNone = this.retryOnNone ?? false

    const op = () => rpc.chain.getBlock(this.client.endpoint, at === undefined ? at : at.toString())
    return await withRetryOnErrorAndNone(op, retryOnError, retryOnNone)
  }

  /**
   * Retrieves an account's transaction nonce at a specific block.
   *
   * @param accountId - The account identifier (AccountId instance or SS58 address string).
   * @param at - The block identifier (hash, hex string, or number) at which to query the nonce.
   * @returns A Promise resolving to the account nonce or an AvailError.
   *
   * @remarks
   * The nonce represents the number of transactions an account has submitted. This method
   * queries the nonce at a historical block, which is useful for analyzing past account state.
   *
   * @example
   * ```ts
   * const client = await Client.create("ws://127.0.0.1:9944");
   * if (!(client instanceof AvailError)) {
   *   const chain = client.chain();
   *
   *   // Get nonce at block 100
   *   const nonce = await chain.blockNonce(
   *     "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY",
   *     100
   *   );
   *   if (!(nonce instanceof AvailError)) {
   *     console.log("Nonce at block 100:", nonce);
   *   }
   * }
   * ```
   *
   * @public
   */
  async blockNonce(accountId: AccountId | string, at: H256 | string | number): Promise<number | AvailError> {
    const result = await this.accountInfo(accountId, at)
    if (result instanceof AvailError) return result
    return result.nonce
  }

  /**
   * Retrieves the current transaction nonce for an account.
   *
   * @param accountId - The account identifier (AccountId instance or SS58 address string).
   * @returns A Promise resolving to the next available nonce for the account or an AvailError.
   *
   * @remarks
   * This method returns the nonce value that should be used for the next transaction from this
   * account. The nonce is the count of transactions that have been submitted from the account.
   *
   * @example
   * ```ts
   * const client = await Client.create("ws://127.0.0.1:9944");
   * if (!(client instanceof AvailError)) {
   *   const chain = client.chain();
   *
   *   // Get current nonce for an account
   *   const nonce = await chain.accountNonce(
   *     "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY"
   *   );
   *   if (!(nonce instanceof AvailError)) {
   *     console.log("Next nonce:", nonce);
   *   }
   * }
   * ```
   *
   * @public
   */
  async accountNonce(accountId: AccountId | string): Promise<number | AvailError> {
    const address = accountId instanceof AccountId ? accountId.toSS58() : accountId

    const op = async () => {
      try {
        const r = await this.client.api.rpc.system.accountNextIndex<Index>(address)
        return r.toNumber()
      } catch (e: any) {
        return new AvailError(e instanceof Error ? e.message : String(e))
      }
    }

    return await withRetryOnError(op, this.shouldRetryOnError())
  }

  /**
   * Retrieves the balance information for an account at a specific block.
   *
   * @param accountId - The account identifier (AccountId instance or SS58 address string).
   * @param at - The block identifier (hash, hex string, or number) at which to query the balance.
   * @returns A Promise resolving to AccountData containing balance information or an AvailError.
   *
   * @remarks
   * AccountData includes free balance, reserved balance, and frozen balance information.
   * This method queries the balance at a historical block for analyzing past account state.
   *
   * @example
   * ```ts
   * const client = await Client.create("ws://127.0.0.1:9944");
   * if (!(client instanceof AvailError)) {
   *   const chain = client.chain();
   *
   *   // Get balance at block 100
   *   const balance = await chain.accountBalance(
   *     "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY",
   *     100
   *   );
   *   if (!(balance instanceof AvailError)) {
   *     console.log("Free balance:", balance.free.toString());
   *     console.log("Reserved:", balance.reserved.toString());
   *   }
   * }
   * ```
   *
   * @public
   */
  async accountBalance(accountId: AccountId | string, at: H256 | string | number): Promise<AccountData | AvailError> {
    const result = await this.accountInfo(accountId, at)
    if (result instanceof AvailError) return result
    return result.data
  }

  /**
   * Retrieves complete account information at a specific block.
   *
   * @param accountId - The account identifier (AccountId instance or SS58 address string).
   * @param at - The block identifier (hash, hex string, or number) at which to query the account.
   * @returns A Promise resolving to AccountInfo with nonce, balance, and reference count data, or an AvailError.
   *
   * @remarks
   * AccountInfo provides comprehensive account state including transaction nonce, balance data
   * (free, reserved, frozen), and reference counters (consumers, providers, sufficients) used
   * for account lifecycle management.
   *
   * @example
   * ```ts
   * const client = await Client.create("ws://127.0.0.1:9944");
   * if (!(client instanceof AvailError)) {
   *   const chain = client.chain();
   *
   *   // Get full account info at block 100
   *   const info = await chain.accountInfo(
   *     "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY",
   *     100
   *   );
   *   if (!(info instanceof AvailError)) {
   *     console.log("Nonce:", info.nonce);
   *     console.log("Free balance:", info.data.free.toString());
   *     console.log("Consumers:", info.consumers);
   *   }
   * }
   * ```
   *
   * @public
   */
  async accountInfo(accountId: AccountId | string, at: H256 | string | number): Promise<AccountInfo | AvailError> {
    const retryOnError = this.shouldRetryOnError()
    const address = accountId instanceof AccountId ? accountId.toSS58() : accountId
    const blockHash = await hashStringNumber.toHash(this, at)
    if (blockHash instanceof AvailError) return blockHash

    const op = async () => {
      try {
        const api = await this.client.api.at(blockHash.toString())
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

  /**
   * Determines the finality state of a block.
   *
   * @param blockId - The block identifier (hash, hex string, or number).
   * @returns A Promise resolving to BlockState ("Included", "Finalized", "Discarded", or "DoesNotExist") or an AvailError.
   *
   * @remarks
   * This method determines whether a block is:
   * - "Included": Present in the best chain but not yet finalized
   * - "Finalized": Confirmed by the finality gadget and immutable
   * - "Discarded": Was part of a fork that is no longer in the canonical chain
   * - "DoesNotExist": Block height or hash not known to the node
   *
   * @example
   * ```ts
   * const client = await Client.create("ws://127.0.0.1:9944");
   * if (!(client instanceof AvailError)) {
   *   const chain = client.chain();
   *
   *   // Check state of block 100
   *   const state = await chain.blockState(100);
   *   if (!(state instanceof AvailError)) {
   *     console.log("Block state:", state);
   *     if (state === "Finalized") {
   *       console.log("Block is finalized and immutable");
   *     }
   *   }
   * }
   * ```
   *
   * @public
   */
  async blockState(blockId: H256 | string | number): Promise<BlockState | AvailError> {
    const blockId2 = hashStringNumber.toHashNumber(blockId)
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

  /**
   * Converts a block hash to its corresponding block number.
   *
   * @param at - The block hash (H256 or hex string).
   * @returns A Promise resolving to the block number, null if not found, or an AvailError.
   *
   * @remarks
   * This method performs a reverse lookup from block hash to block number. Returns null
   * if the hash doesn't correspond to any known block.
   *
   * @example
   * ```ts
   * const client = await Client.create("ws://127.0.0.1:9944");
   * if (!(client instanceof AvailError)) {
   *   const chain = client.chain();
   *
   *   // Get block height from hash
   *   const hash = await chain.blockHash(100);
   *   if (!(hash instanceof AvailError) && hash !== null) {
   *     const height = await chain.blockHeight(hash);
   *     if (!(height instanceof AvailError) && height !== null) {
   *       console.log("Block height:", height);
   *     }
   *   }
   * }
   * ```
   *
   * @public
   */
  async blockHeight(at: H256 | string): Promise<number | null | AvailError> {
    const retryOnNone = this.retryOnNone ?? false
    const op = () => rpc.system.getBlockNumber(this.client.endpoint, at.toString())
    return await withRetryOnErrorAndNone(op, this.shouldRetryOnError(), retryOnNone)
  }

  /**
   * Retrieves information about the latest block.
   *
   * @param useBestBlock - If true, returns the best (latest) block; if false, returns the finalized block. Defaults to false.
   * @returns A Promise resolving to BlockInfo with hash and height, or an AvailError.
   *
   * @remarks
   * The "best" block is the current head of the chain, while the "finalized" block has been
   * confirmed by the consensus mechanism. Best blocks may be reorganized, finalized blocks are immutable.
   *
   * @example
   * ```ts
   * const client = await Client.create("ws://127.0.0.1:9944");
   * if (!(client instanceof AvailError)) {
   *   const chain = client.chain();
   *
   *   // Get latest finalized block
   *   const finalized = await chain.blockInfo();
   *   if (!(finalized instanceof AvailError)) {
   *     console.log("Finalized:", finalized.height, finalized.hash.toString());
   *   }
   *
   *   // Get best (latest) block
   *   const best = await chain.blockInfo(true);
   *   if (!(best instanceof AvailError)) {
   *     console.log("Best:", best.height, best.hash.toString());
   *   }
   * }
   * ```
   *
   * @public
   */
  async blockInfo(useBestBlock?: boolean): Promise<BlockInfo | AvailError> {
    const bestBlock = useBestBlock ?? false

    const op = () => rpc.system.latestBlockInfo(this.client.endpoint, bestBlock)
    return await withRetryOnError(op, this.shouldRetryOnError())
  }

  /**
   * Constructs BlockInfo from a block identifier.
   *
   * @param blockId - The block identifier (hash, hex string, or number).
   * @returns A Promise resolving to BlockInfo with both hash and height, or an AvailError.
   *
   * @remarks
   * This method ensures you have both the block hash and height regardless of which identifier
   * you provide. It performs the necessary lookups to complete the BlockInfo structure.
   *
   * @example
   * ```ts
   * const client = await Client.create("ws://127.0.0.1:9944");
   * if (!(client instanceof AvailError)) {
   *   const chain = client.chain();
   *
   *   // Get info from block number
   *   const info = await chain.blockInfoFrom(100);
   *   if (!(info instanceof AvailError)) {
   *     console.log("Hash:", info.hash.toString());
   *     console.log("Height:", info.height);
   *   }
   * }
   * ```
   *
   * @public
   */
  async blockInfoFrom(blockId: H256 | string | number): Promise<BlockInfo | AvailError> {
    if (blockId instanceof H256) {
      const height = await this.blockHeight(blockId)
      if (height instanceof AvailError) return height
      if (height == null) return new AvailError("No block height was found for hash")

      return { hash: blockId, height }
    }

    if (typeof blockId == "string") {
      const hash = H256.from(blockId)
      if (hash instanceof AvailError) return hash

      const height = await this.blockHeight(blockId)
      if (height instanceof AvailError) return height
      if (height == null) return new AvailError("No block height was found for hash")

      return { hash, height }
    }

    const hash = await this.blockHash(blockId)
    if (hash instanceof AvailError) return hash
    if (hash == null) return new AvailError("No block hash was found for height")

    return { hash, height: blockId }
  }

  /**
   * Retrieves the account ID of the validator who authored a block.
   *
   * @param blockId - The block identifier (hash, hex string, or number).
   * @returns A Promise resolving to the AccountId of the block author or an AvailError.
   *
   * @remarks
   * The block author is the validator who produced the block and is eligible for block rewards.
   * This information is derived from the block's consensus digest.
   *
   * @example
   * ```ts
   * const client = await Client.create("ws://127.0.0.1:9944");
   * if (!(client instanceof AvailError)) {
   *   const chain = client.chain();
   *
   *   // Get author of block 100
   *   const author = await chain.blockAuthor(100);
   *   if (!(author instanceof AvailError)) {
   *     console.log("Block author:", author.toSS58());
   *   }
   * }
   * ```
   *
   * @public
   */
  async blockAuthor(blockId: H256 | string | number): Promise<AccountId | AvailError> {
    if (blockId instanceof H256) {
      blockId = blockId.toString()
    }

    if (typeof blockId == "number") {
      const hash = await this.blockHash(blockId)
      if (hash instanceof AvailError) return hash
      if (hash == null) return new AvailError("Failed to find block hash for that block id")
      blockId = hash.toString()
    }

    try {
      const header = await this.client.api.derive.chain.getHeader(blockId)
      if (header.author == undefined) return new AvailError("Failed to find block author")
      return new AccountId(header.author.toU8a())
    } catch (e: any) {
      return new AvailError(e instanceof Error ? e.message : String(e))
    }
  }

  async blockEventCount(blockId: H256 | string | number): Promise<number | AvailError> {
    const retryOnError = this.shouldRetryOnError()
    const retryOnNone = this.retryOnNone ?? false

    const hash = await hashStringNumber.toHash(this, blockId)
    if (hash instanceof AvailError) return hash

    const op = () => StorageValue.fetch(avail.system.storage.EventCount, this.client.endpoint, hash)
    const result = await withRetryOnErrorAndNone(op, retryOnError, retryOnNone)
    if (result instanceof AvailError) return result
    if (result == null) return new AvailError("Failed to find Event Count storage.")

    return result
  }

  async blockWeight(blockId: H256 | string | number): Promise<PerDispatchClassWeight | AvailError> {
    const retryOnError = this.shouldRetryOnError()
    const retryOnNone = this.retryOnNone ?? false

    const hash = await hashStringNumber.toHash(this, blockId)
    if (hash instanceof AvailError) return hash

    const op = () => StorageValue.fetch(avail.system.storage.BlockWeight, this.client.endpoint, hash)
    const result = await withRetryOnErrorAndNone(op, retryOnError, retryOnNone)
    if (result instanceof AvailError) return result
    if (result == null) return new AvailError("Failed to find Event Count storage.")

    return result
  }

  /// Quick snapshot of both the best and finalized heads.
  async chainInfo(): Promise<ChainInfo | AvailError> {
    const op = () => rpc.system.latestChainInfo(this.client.endpoint)
    return await withRetryOnError(op, this.shouldRetryOnError())
  }

  /// Submits a signed extrinsic and gives you the transaction hash.
  async submit(tx: string | PolkadotExtrinsic | Uint8Array): Promise<H256 | AvailError> {
    const op = () => this.client.api.rpc.author.submitExtrinsic(tx)
    const result = await withRetryOnError(op, this.shouldRetryOnError())
    if (result instanceof AvailError) return result

    return H256.from(result)
  }

  async stateCall(method: string, data: string | Uint8Array, at?: H256 | string): Promise<string | AvailError> {
    const op = () => rpc.state.call(this.client.endpoint, method, data, at)
    return await withRetryOnError(op, this.shouldRetryOnError())
  }

  async stateGetStorage(key: string, at?: H256): Promise<Uint8Array | null | AvailError> {
    const op = () => rpc.state.getStorage(this.client.endpoint, key, at)
    return await withRetryOnError(op, this.shouldRetryOnError())
  }

  async stateGetKeysPaged(
    prefix: string | null,
    count: number,
    startKey: string | null,
    at?: H256,
  ): Promise<string[] | AvailError> {
    const op = () => rpc.state.getKeysPaged(this.client.endpoint, prefix, count, startKey, at)
    return await withRetryOnError(op, this.shouldRetryOnError())
  }

  /// Performs a raw RPC invocation against the connected node
  async rpcRawCall(method: string, params?: any): Promise<RpcResponse | AvailError> {
    const op = () => rpc.rpcRawCall(this.client.endpoint, method, params)
    return await withRetryOnError(op, this.shouldRetryOnError())
  }

  /// Calls into the runtime API and decodes the answer for you.
  async runtimeApiRawCall(method: string, data: string | Uint8Array, at?: H256 | string): Promise<string | AvailError> {
    const op = () => rpc.runtimeApiRawCall(this.client.endpoint, method, data, at)
    return await withRetryOnError(op, this.shouldRetryOnError())
  }

  /// Fetches GRANDPA justification for the given block number.
  ///
  /// # Returns
  /// - `GrandpaJustification` when a justification is present.
  /// - `null` when the runtime returns no justification.
  /// - `AvailError` if decoding the response or the RPC call fails.
  async grandpaBlockJustificationJson(blockHeight: number): Promise<GrandpaJustification | null | AvailError> {
    const op = () => rpc.grandpa.blockJustificationJson(this.client.endpoint, blockHeight)
    return await withRetryOnError(op, this.shouldRetryOnError())
  }

  async transactionPaymentQueryInfo(tx: string, at?: string): Promise<RuntimeDispatchInfo | AvailError> {
    const op = () => rpc.runtimeApi.TransactionPaymentApi_queryInfo(this.client.endpoint, tx, at)
    return await withRetryOnError(op, this.shouldRetryOnError())
  }

  async transactionPaymentQueryFeeDetails(tx: string, at?: string): Promise<FeeDetails | AvailError> {
    const op = () => rpc.runtimeApi.TransactionPaymentApi_queryFeeDetails(this.client.endpoint, tx, at)
    return await withRetryOnError(op, this.shouldRetryOnError())
  }

  async transactionPaymentQueryCallInfo(call: string, at?: string): Promise<RuntimeDispatchInfo | AvailError> {
    const op = () => rpc.runtimeApi.TransactionPaymentCallApi_queryCallInfo(this.client.endpoint, call, at)
    return await withRetryOnError(op, this.shouldRetryOnError())
  }

  async transactionPaymentQueryCallFeeDetails(call: string, at?: string): Promise<FeeDetails | AvailError> {
    const op = () => rpc.runtimeApi.TransactionPaymentCallApi_queryCallFeeDetails(this.client.endpoint, call, at)
    return await withRetryOnError(op, this.shouldRetryOnError())
  }

  async kateBlockLength(at?: H256 | string): Promise<rpc.kate.BlockLength | AvailError> {
    const op = () => rpc.kate.blockLength(this.client.endpoint, at)
    return await withRetryOnError(op, this.shouldRetryOnError())
  }

  /// Fetches extrinsics from a block using the provided filters.
  ///
  /// # Errors
  /// Returns `AvailError` when the block id cannot be decoded or the RPC request fails.
  async systemFetchExtrinsics(
    blockId: H256 | string | number,
    options?: rpc.system.fetchExtrinsics.Options,
  ): Promise<rpc.system.fetchExtrinsics.ExtrinsicInfo[] | AvailError> {
    const op = () => rpc.system.fetchExtrinsics.fetchExtrinsics(this.client.endpoint, blockId, options)
    return await withRetryOnError(op, this.shouldRetryOnError())
  }

  /// Pulls events for a block with optional filtering.
  ///
  /// # Errors
  /// Returns `AvailError` when the block id cannot be resolved or the RPC call fails.
  async systemFetchEvents(
    blockId: H256 | string | number,
    options?: rpc.system.fetchEvents.Options,
  ): Promise<rpc.system.fetchEvents.BlockPhaseEvent[] | AvailError> {
    const blockHash = await hashStringNumber.toHash(this, blockId)
    if (blockHash instanceof AvailError) return blockHash

    const op = () => rpc.system.fetchEvents.fetchEvents(this.client.endpoint, blockHash, options)
    return await withRetryOnError(op, this.shouldRetryOnError())
  }

  async rotateKeys(): Promise<SessionKeys | AvailError> {
    const op = () => rpc.author.rotateKeys(this.client.endpoint)
    return await withRetryOnError(op, this.shouldRetryOnError())
  }

  shouldRetryOnError(): boolean {
    return this.retryOnError ?? this.client.isGlobalRetiresEnabled()
  }
}

function warnAboutRetry(reason: string, duration: Duration, retriesRemaining: number) {
  const sleepSeconds = duration.value / 1000
  const retryText =
    retriesRemaining === 0
      ? "no retries remaining"
      : `${retriesRemaining} ${retriesRemaining === 1 ? "retry" : "retries"} remaining`
  log.warn(`Retry scheduled in ${sleepSeconds}s (${retryText}) due to ${reason}`)
}

export async function withRetryOnError<T>(op: () => Promise<T | AvailError>, retry: boolean): Promise<T | AvailError> {
  const durations = [8, 5, 3, 2, 1].map((x) => Duration.fromSecs(x))

  while (true) {
    let result
    try {
      result = await op()
    } catch (e: any) {
      result = new AvailError(e instanceof Error ? e.message : String(e))
    }
    if (!(result instanceof AvailError)) return result
    if (retry == false || durations.length == 0) return result

    const duration = durations.pop()!
    warnAboutRetry(`AvailError: ${result.toString()}`, duration, durations.length)
    await sleep(duration)
  }
}

export async function withRetryOnErrorAndNone<T>(
  op: () => Promise<T | null | AvailError>,
  onError: boolean,
  onNone: boolean,
): Promise<T | null | AvailError> {
  const durations = [8, 5, 3, 2, 1].map((x) => Duration.fromSecs(x))

  while (true) {
    let result
    try {
      result = await op()
    } catch (e: any) {
      result = new AvailError(e instanceof Error ? e.message : String(e))
    }
    if (result instanceof AvailError) {
      if (onError == false || durations.length == 0) return result
      const duration = durations.pop()!
      warnAboutRetry(`AvailError: ${result.toString()}`, duration, durations.length)
      await sleep(duration)
      continue
    }

    if (result == null) {
      if (onNone == false || durations.length == 0) return result
      const duration = durations.pop()!
      warnAboutRetry("operation returned null", duration, durations.length)
      await sleep(duration)
      continue
    }

    return result
  }
}
