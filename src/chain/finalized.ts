import { Block } from "../block/block"
import type { Client } from "../client"
import type { AccountData, AccountId, AccountInfo, H256, BlockInfo } from "../core/metadata"
import { AvailError } from "../core/error"
import type { AvailHeader } from "../core/header"
import type { SignedBlock } from "../core/polkadot"
import { Chain } from "./chain"

/**
 * Provides access to finalized blocks on the chain.
 *
 * @remarks
 * The Finalized class tracks blocks that have been confirmed by the consensus mechanism
 * and are considered immutable on the chain. Finalized blocks provide stronger guarantees
 * than best blocks and are safe to rely on for critical operations.
 *
 * @example
 * ```ts
 * const client = await Client.create("ws://127.0.0.1:9944");
 * if (!(client instanceof AvailError)) {
 *   const finalized = client.finalized();
 *   const hash = await finalized.blockHash();
 *   if (!(hash instanceof AvailError)) {
 *     console.log("Finalized block hash:", hash.toString());
 *   }
 * }
 * ```
 *
 * @public
 */
export class Finalized {
  private client: Client
  private chain: Chain

  constructor(client: Client) {
    this.client = client
    this.chain = new Chain(client).retryOn(null, true)
  }

  /**
   * Configures retry behavior for subsequent operations on finalized block queries.
   *
   * @param error - True to enable retries, false to disable, or null to use the client's global retry setting.
   * @returns This Finalized instance for method chaining.
   *
   * @remarks
   * Overrides the default retry behavior for all operations performed through this Finalized instance.
   * When set to null, the behavior falls back to the client's global retry configuration.
   *
   * @example
   * ```ts
   * const client = await Client.create("ws://127.0.0.1:9944");
   * if (!(client instanceof AvailError)) {
   *   const finalized = client.finalized().retryOn(true);
   *   const hash = await finalized.blockHash(); // Will retry on errors
   * }
   * ```
   *
   * @public
   */
  retryOn(error: boolean | null): Finalized {
    this.chain.retryOn(error, true)
    return this
  }

  /**
   * Retrieves the hash of the current finalized block.
   *
   * @returns A Promise resolving to the block hash as an H256 or an AvailError on failure.
   *
   * @example
   * ```ts
   * const client = await Client.create("ws://127.0.0.1:9944");
   * if (!(client instanceof AvailError)) {
   *   const finalized = client.finalized();
   *   const hash = await finalized.blockHash();
   *   if (!(hash instanceof AvailError)) {
   *     console.log("Finalized block hash:", hash.toString());
   *   }
   * }
   * ```
   *
   * @public
   */
  async blockHash(): Promise<H256 | AvailError> {
    const info = await this.blockInfo()
    if (info instanceof AvailError) return info
    return info.hash
  }

  /**
   * Retrieves the height (block number) of the current finalized block.
   *
   * @returns A Promise resolving to the block height as a number or an AvailError on failure.
   *
   * @example
   * ```ts
   * const client = await Client.create("ws://127.0.0.1:9944");
   * if (!(client instanceof AvailError)) {
   *   const finalized = client.finalized();
   *   const height = await finalized.blockHeight();
   *   if (!(height instanceof AvailError)) {
   *     console.log("Finalized block height:", height);
   *   }
   * }
   * ```
   *
   * @public
   */
  async blockHeight(): Promise<number | AvailError> {
    const info = await this.blockInfo()
    if (info instanceof AvailError) return info
    return info.height
  }

  /**
   * Retrieves the header of the current finalized block.
   *
   * @returns A Promise resolving to the AvailHeader or an AvailError on failure.
   *
   * @remarks
   * The header contains essential block metadata including parent hash, number, state root,
   * extrinsics root, and digest (logs).
   *
   * @example
   * ```ts
   * const client = await Client.create("ws://127.0.0.1:9944");
   * if (!(client instanceof AvailError)) {
   *   const finalized = client.finalized();
   *   const header = await finalized.blockHeader();
   *   if (!(header instanceof AvailError)) {
   *     console.log("Block number:", header.number.toNumber());
   *     console.log("State root:", header.stateRoot.toString());
   *   }
   * }
   * ```
   *
   * @public
   */
  async blockHeader(): Promise<AvailHeader | AvailError> {
    const blockHash = await this.blockHash()
    if (blockHash instanceof AvailError) return blockHash

    const header = await this.chain.blockHeader(blockHash)
    if (header == null) return new AvailError("Failed to fetch finalized block header")

    return header
  }

  /**
   * Creates a Block instance for the current finalized block.
   *
   * @returns A Promise resolving to a Block instance for querying finalized block data or an AvailError on failure.
   *
   * @remarks
   * The returned Block instance provides access to extrinsics, events, and other block-level data.
   *
   * @example
   * ```ts
   * const client = await Client.create("ws://127.0.0.1:9944");
   * if (!(client instanceof AvailError)) {
   *   const finalized = client.finalized();
   *   const block = await finalized.block();
   *   if (!(block instanceof AvailError)) {
   *     const extrinsics = await block.extrinsics().all();
   *   }
   * }
   * ```
   *
   * @public
   */
  async block(): Promise<Block | AvailError> {
    const hash = await this.blockHash()
    if (hash instanceof AvailError) return hash
    return new Block(this.client, hash)
  }

  /**
   * Retrieves comprehensive information about the current finalized block.
   *
   * @returns A Promise resolving to BlockInfo containing hash, height, and other metadata or an AvailError on failure.
   *
   * @remarks
   * Equivalent to calling `chain().blockInfo(false)` but respects this instance's retry settings.
   * BlockInfo provides a complete snapshot of the block's metadata.
   *
   * @example
   * ```ts
   * const client = await Client.create("ws://127.0.0.1:9944");
   * if (!(client instanceof AvailError)) {
   *   const finalized = client.finalized();
   *   const info = await finalized.blockInfo();
   *   if (!(info instanceof AvailError)) {
   *     console.log("Block hash:", info.hash.toString());
   *     console.log("Block height:", info.height);
   *   }
   * }
   * ```
   *
   * @public
   */
  async blockInfo(): Promise<BlockInfo | AvailError> {
    return await this.chain.blockInfo(false)
  }

  /// Loads the legacy block for the finalized block.
  ///
  /// # Errors
  /// Returns error when the node reports no legacy block for the head.
  async legacyBlock(): Promise<SignedBlock | AvailError> {
    const blockHash = await this.blockHash()
    if (blockHash instanceof AvailError) return blockHash

    const block = await this.chain.legacyBlock(blockHash)
    if (block instanceof AvailError) return block
    if (block == null) return new AvailError("Failed to fetch latest finalized legacy block")

    return block
  }

  /// Returns the latest nonce for the account at the finalized block.
  async accountNonce(accountId: AccountId | string): Promise<number | AvailError> {
    const accountInfo = await this.accountInfo(accountId)
    if (accountInfo instanceof AvailError) return accountInfo

    return accountInfo.nonce
  }

  /// Returns the account balances at the finalized block.
  async accountBalance(accountId: AccountId | string): Promise<AccountData | AvailError> {
    const info = await this.accountInfo(accountId)
    if (info instanceof AvailError) return info

    return info.data
  }

  /// Returns the full account record at the finalized block.
  async accountInfo(accountId: AccountId | string): Promise<AccountInfo | AvailError> {
    const blockHash = await this.blockHash()
    if (blockHash instanceof AvailError) return blockHash

    return await this.chain.accountInfo(accountId, blockHash)
  }

  /// Returns true when finalized-block queries retry after RPC errors.
  shouldRetryOnError(): boolean {
    return this.chain.shouldRetryOnError()
  }
}
