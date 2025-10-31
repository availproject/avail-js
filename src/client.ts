import { Transaction } from "./transaction"
import { AvailError } from "./core/error"
import type { ApiPromise } from "@polkadot/api"
import { H256 } from "./core/metadata"
import { Block } from "./block/block"
import type { RuntimeVersion } from "./core/polkadot"
import { Chain } from "./chain/chain"
import { Best } from "./chain/best"
import { Finalized } from "./chain/finalized"
import type { ApiOptions } from "@polkadot/api/types"
import { initialize } from "./core/api"

/**
 * Main client for interacting with the Avail blockchain.
 *
 * @remarks
 * The Client class provides the primary interface for connecting to and interacting with
 * an Avail node. It manages the underlying API connection and provides convenient methods
 * for accessing blocks, transactions, and chain state.
 *
 * @example
 * ```ts
 * // Connect to a local node
 * const client = await Client.create("ws://127.0.0.1:9944");
 * if (client instanceof AvailError) {
 *   console.error("Failed to connect:", client.message);
 *   return;
 * }
 *
 * // Get the genesis hash
 * const hash = client.genesisHash();
 * console.log("Genesis hash:", hash.toString());
 * ```
 *
 * @public
 */
export class Client {
  public api: ApiPromise
  public endpoint: string
  private global_retires: boolean

  /**
   * Constructs a new Client instance.
   *
   * @param api - The initialized Polkadot API instance.
   * @param endpoint - The endpoint URL used for the connection.
   *
   * @remarks
   * This constructor is typically not called directly. Use the static {@link Client.create}
   * method instead, which handles API initialization automatically.
   *
   * @public
   */
  public constructor(api: ApiPromise, endpoint: string) {
    this.api = api
    this.endpoint = endpoint
    this.global_retires = true
  }

  /**
   * Creates and initializes a new Client instance connected to an Avail node.
   *
   * @param endpoint - The WebSocket or HTTP endpoint URL of the Avail node (e.g., "ws://127.0.0.1:9944").
   * @param opts - Optional configuration options.
   * @param opts.useWsProvider - Whether to use WebSocket provider (true) or HTTP provider (false). Defaults to false.
   * @param opts.api - Additional Polkadot API options for customizing the connection.
   * @returns A Promise that resolves to either a connected Client instance or an AvailError on failure.
   *
   * @example
   * ```ts
   * // Connect using HTTP provider (default)
   * const client = await Client.create("http://127.0.0.1:9944");
   * if (client instanceof AvailError) {
   *   console.error("Connection failed:", client.message);
   *   return;
   * }
   *
   * // Connect using WebSocket provider
   * const wsClient = await Client.create("ws://127.0.0.1:9944", {
   *   useWsProvider: true
   * });
   * ```
   *
   * @public
   */
  static async create(
    endpoint: string,
    opts?: { useWsProvider?: boolean; api?: ApiOptions },
  ): Promise<Client | AvailError> {
    try {
      const useWs = opts?.useWsProvider ?? false
      const api = await initialize(endpoint, opts?.api, !useWs)
      return new Client(api, endpoint)
    } catch (e: any) {
      return new AvailError(e instanceof Error ? e.message : String(e))
    }
  }

  /**
   * Retrieves the genesis hash of the connected chain.
   *
   * @returns The genesis block hash as an H256 instance.
   *
   * @example
   * ```ts
   * const client = await Client.create("ws://127.0.0.1:9944");
   * if (!(client instanceof AvailError)) {
   *   const genesis = client.genesisHash();
   *   console.log("Genesis hash:", genesis.toString());
   * }
   * ```
   *
   * @public
   */
  genesisHash(): H256 {
    return new H256(this.api.genesisHash)
  }

  /**
   * Retrieves the runtime version information of the connected chain.
   *
   * @returns The runtime version object containing spec version, transaction version, and other metadata.
   *
   * @example
   * ```ts
   * const client = await Client.create("ws://127.0.0.1:9944");
   * if (!(client instanceof AvailError)) {
   *   const version = client.runtimeVersion();
   *   console.log("Spec version:", version.specVersion.toNumber());
   * }
   * ```
   *
   * @public
   */
  runtimeVersion(): RuntimeVersion {
    return this.api.runtimeVersion
  }

  /**
   * Creates a Block instance for accessing data from a specific block.
   *
   * @param blockId - The block identifier, which can be a block hash (H256 or hex string) or block number.
   * @returns A Block instance for querying the specified block's data.
   *
   * @example
   * ```ts
   * const client = await Client.create("ws://127.0.0.1:9944");
   * if (!(client instanceof AvailError)) {
   *   // Get block by number
   *   const block1 = client.block(100);
   *
   *   // Get block by hash
   *   const hash = "0x1234...";
   *   const block2 = client.block(hash);
   * }
   * ```
   *
   * @public
   */
  block(blockId: H256 | string | number): Block {
    return new Block(this, blockId)
  }

  /**
   * Creates a Transaction builder for constructing and submitting transactions.
   *
   * @returns A Transaction instance for building and submitting extrinsics.
   *
   * @example
   * ```ts
   * import { Keyring } from "@polkadot/keyring";
   *
   * const client = await Client.create("ws://127.0.0.1:9944");
   * if (!(client instanceof AvailError)) {
   *   const keyring = new Keyring({ type: "sr25519" });
   *   const alice = keyring.addFromUri("//Alice");
   *
   *   const tx = client.tx();
   *   // Use tx to build and submit transactions
   * }
   * ```
   *
   * @public
   */
  tx(): Transaction {
    return new Transaction(this)
  }

  /**
   * Creates a Chain instance for accessing chain-level operations and queries.
   *
   * @returns A Chain instance for interacting with chain data.
   *
   * @example
   * ```ts
   * const client = await Client.create("ws://127.0.0.1:9944");
   * if (!(client instanceof AvailError)) {
   *   const chain = client.chain();
   *   // Use chain instance for chain-level queries
   * }
   * ```
   *
   * @public
   */
  chain(): Chain {
    return new Chain(this)
  }

  /**
   * Creates a Best instance for tracking and accessing the best (latest) blocks.
   *
   * @returns A Best instance for monitoring the chain's best blocks.
   *
   * @remarks
   * The "best" block represents the current head of the chain, which may not be finalized yet.
   *
   * @example
   * ```ts
   * const client = await Client.create("ws://127.0.0.1:9944");
   * if (!(client instanceof AvailError)) {
   *   const best = client.best();
   *   // Use best instance to track the latest blocks
   * }
   * ```
   *
   * @public
   */
  best(): Best {
    return new Best(this)
  }

  /**
   * Creates a Finalized instance for tracking and accessing finalized blocks.
   *
   * @returns A Finalized instance for monitoring finalized blocks.
   *
   * @remarks
   * Finalized blocks have been confirmed by the consensus mechanism and are considered
   * immutable on the chain.
   *
   * @example
   * ```ts
   * const client = await Client.create("ws://127.0.0.1:9944");
   * if (!(client instanceof AvailError)) {
   *   const finalized = client.finalized();
   *   // Use finalized instance to track confirmed blocks
   * }
   * ```
   *
   * @public
   */
  finalized(): Finalized {
    return new Finalized(this)
  }

  /**
   * Checks whether global retry functionality is enabled.
   *
   * @returns True if global retries are enabled, false otherwise.
   *
   * @remarks
   * When enabled, certain operations will automatically retry on transient failures.
   *
   * @example
   * ```ts
   * const client = await Client.create("ws://127.0.0.1:9944");
   * if (!(client instanceof AvailError)) {
   *   const enabled = client.isGlobalRetiresEnabled();
   *   console.log("Retries enabled:", enabled);
   * }
   * ```
   *
   * @public
   */
  isGlobalRetiresEnabled(): boolean {
    return this.global_retires
  }

  /**
   * Enables or disables global retry functionality.
   *
   * @param value - True to enable global retries, false to disable them.
   *
   * @remarks
   * This setting affects whether certain operations will automatically retry on transient failures.
   * By default, retries are enabled.
   *
   * @example
   * ```ts
   * const client = await Client.create("ws://127.0.0.1:9944");
   * if (!(client instanceof AvailError)) {
   *   // Disable automatic retries
   *   client.setGlobalRetiresEnabled(false);
   * }
   * ```
   *
   * @public
   */
  setGlobalRetiresEnabled(value: boolean) {
    this.global_retires = value
  }
}
