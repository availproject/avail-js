import { Block } from "../block/block"
import type { Client } from "../client"
import type { AccountData, AccountId, AccountInfo, H256, BlockInfo } from "../core/metadata"
import { AvailError } from "../core/error"
import type { AvailHeader } from "../core/header"
import type { SignedBlock } from "../core/polkadot"
import { Chain } from "./chain"

/**
 * Provides access to the best (latest) block on the chain.
 *
 * @remarks
 * The Best class tracks the current head of the chain, representing the most recent block
 * that has been produced. This block may not be finalized yet and could potentially be
 * reorganized. Use this class to query real-time chain state and the latest block data.
 *
 * @example
 * ```ts
 * const client = await Client.create("ws://127.0.0.1:9944");
 * if (!(client instanceof AvailError)) {
 *   const best = client.best();
 *   const hash = await best.blockHash();
 *   if (!(hash instanceof AvailError)) {
 *     console.log("Latest block hash:", hash.toString());
 *   }
 * }
 * ```
 *
 * @public
 */
export class Best {
  private client: Client
  private chain: Chain

  constructor(client: Client) {
    this.client = client
    this.chain = new Chain(client).retryOn(null, true)
  }

  /**
   * Configures retry behavior for subsequent operations on best block queries.
   *
   * @param error - True to enable retries, false to disable, or null to use the client's global retry setting.
   * @returns This Best instance for method chaining.
   *
   * @remarks
   * Overrides the default retry behavior for all operations performed through this Best instance.
   * When set to null, the behavior falls back to the client's global retry configuration.
   *
   * @example
   * ```ts
   * const client = await Client.create("ws://127.0.0.1:9944");
   * if (!(client instanceof AvailError)) {
   *   const best = client.best().retryOn(true);
   *   const hash = await best.blockHash(); // Will retry on errors
   * }
   * ```
   *
   * @public
   */
  retryOn(error: boolean | null): Best {
    this.chain.retryOn(error, true)
    return this
  }

  /**
   * Retrieves the hash of the current best block.
   *
   * @returns A Promise resolving to the block hash as an H256 or an AvailError on failure.
   *
   * @example
   * ```ts
   * const client = await Client.create("ws://127.0.0.1:9944");
   * if (!(client instanceof AvailError)) {
   *   const best = client.best();
   *   const hash = await best.blockHash();
   *   if (!(hash instanceof AvailError)) {
   *     console.log("Best block hash:", hash.toString());
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
   * Retrieves the height (block number) of the current best block.
   *
   * @returns A Promise resolving to the block height as a number or an AvailError on failure.
   *
   * @example
   * ```ts
   * const client = await Client.create("ws://127.0.0.1:9944");
   * if (!(client instanceof AvailError)) {
   *   const best = client.best();
   *   const height = await best.blockHeight();
   *   if (!(height instanceof AvailError)) {
   *     console.log("Best block height:", height);
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
   * Retrieves the header of the current best block.
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
   *   const best = client.best();
   *   const header = await best.blockHeader();
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
    if (header == null) return new AvailError("Failed to fetch best block header")

    return header
  }

  /**
   * Creates a Block instance for the current best block.
   *
   * @returns A Promise resolving to a Block instance for querying best block data or an AvailError on failure.
   *
   * @remarks
   * The returned Block instance provides access to extrinsics, events, and other block-level data.
   *
   * @example
   * ```ts
   * const client = await Client.create("ws://127.0.0.1:9944");
   * if (!(client instanceof AvailError)) {
   *   const best = client.best();
   *   const block = await best.block();
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
   * Retrieves comprehensive information about the current best block.
   *
   * @returns A Promise resolving to BlockInfo containing hash, height, and other metadata or an AvailError on failure.
   *
   * @remarks
   * Equivalent to calling `chain().blockInfo(true)` but respects this instance's retry settings.
   * BlockInfo provides a complete snapshot of the block's metadata.
   *
   * @example
   * ```ts
   * const client = await Client.create("ws://127.0.0.1:9944");
   * if (!(client instanceof AvailError)) {
   *   const best = client.best();
   *   const info = await best.blockInfo();
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
    return await this.chain.blockInfo(true)
  }

  /**
   * Retrieves the legacy block representation for the current best block.
   *
   * @returns A Promise resolving to the SignedBlock or an AvailError on failure.
   *
   * @remarks
   * The legacy block format provides compatibility with older Substrate APIs and includes
   * the block along with its signature and justifications.
   *
   * @example
   * ```ts
   * const client = await Client.create("ws://127.0.0.1:9944");
   * if (!(client instanceof AvailError)) {
   *   const best = client.best();
   *   const legacy = await best.legacyBlock();
   *   if (!(legacy instanceof AvailError)) {
   *     console.log("Block:", legacy.block.header.number.toNumber());
   *   }
   * }
   * ```
   *
   * @public
   */
  async legacyBlock(): Promise<SignedBlock | AvailError> {
    const blockHash = await this.blockHash()
    if (blockHash instanceof AvailError) return blockHash

    const block = await this.chain.legacyBlock(blockHash)
    if (block instanceof AvailError) return block
    if (block == null) return new AvailError("Failed to fetch latest best legacy block")

    return block
  }

  /**
   * Retrieves the current nonce for an account at the best block.
   *
   * @param accountId - The account identifier, either as an AccountId object or an address string.
   * @returns A Promise resolving to the account nonce as a number or an AvailError on failure.
   *
   * @remarks
   * The nonce represents the number of transactions sent from this account and is used
   * to prevent transaction replay attacks.
   *
   * @example
   * ```ts
   * const client = await Client.create("ws://127.0.0.1:9944");
   * if (!(client instanceof AvailError)) {
   *   const best = client.best();
   *   const nonce = await best.accountNonce("5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY");
   *   if (!(nonce instanceof AvailError)) {
   *     console.log("Account nonce:", nonce);
   *   }
   * }
   * ```
   *
   * @public
   */
  async accountNonce(accountId: AccountId | string): Promise<number | AvailError> {
    const accountInfo = await this.accountInfo(accountId)
    if (accountInfo instanceof AvailError) return accountInfo

    return accountInfo.nonce
  }

  /**
   * Retrieves the balance information for an account at the best block.
   *
   * @param accountId - The account identifier, either as an AccountId object or an address string.
   * @returns A Promise resolving to AccountData containing balance details or an AvailError on failure.
   *
   * @remarks
   * AccountData includes free balance, reserved balance, frozen balance, and flags.
   *
   * @example
   * ```ts
   * const client = await Client.create("ws://127.0.0.1:9944");
   * if (!(client instanceof AvailError)) {
   *   const best = client.best();
   *   const balance = await best.accountBalance("5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY");
   *   if (!(balance instanceof AvailError)) {
   *     console.log("Free balance:", balance.free.toString());
   *     console.log("Reserved:", balance.reserved.toString());
   *   }
   * }
   * ```
   *
   * @public
   */
  async accountBalance(accountId: AccountId | string): Promise<AccountData | AvailError> {
    const info = await this.accountInfo(accountId)
    if (info instanceof AvailError) return info

    return info.data
  }

  /**
   * Retrieves complete account information at the best block.
   *
   * @param accountId - The account identifier, either as an AccountId object or an address string.
   * @returns A Promise resolving to AccountInfo containing nonce, balance data, and other account details or an AvailError on failure.
   *
   * @remarks
   * AccountInfo includes the account's nonce, balance data (free, reserved, frozen), and various flags.
   *
   * @example
   * ```ts
   * const client = await Client.create("ws://127.0.0.1:9944");
   * if (!(client instanceof AvailError)) {
   *   const best = client.best();
   *   const info = await best.accountInfo("5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY");
   *   if (!(info instanceof AvailError)) {
   *     console.log("Nonce:", info.nonce);
   *     console.log("Free balance:", info.data.free.toString());
   *   }
   * }
   * ```
   *
   * @public
   */
  async accountInfo(accountId: AccountId | string): Promise<AccountInfo | AvailError> {
    const blockHash = await this.blockHash()
    if (blockHash instanceof AvailError) return blockHash

    return await this.chain.accountInfo(accountId, blockHash)
  }

  /**
   * Checks whether retry-on-error is enabled for best block queries.
   *
   * @returns True if retries are enabled, false otherwise.
   *
   * @remarks
   * When enabled, operations will automatically retry on transient RPC failures.
   *
   * @example
   * ```ts
   * const client = await Client.create("ws://127.0.0.1:9944");
   * if (!(client instanceof AvailError)) {
   *   const best = client.best();
   *   const shouldRetry = best.shouldRetryOnError();
   *   console.log("Retries enabled:", shouldRetry);
   * }
   * ```
   *
   * @public
   */
  shouldRetryOnError(): boolean {
    return this.chain.shouldRetryOnError()
  }
}
