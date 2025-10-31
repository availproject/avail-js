import type { Client } from "../client"
import { avail } from "../core"
import type { AccountId, BlockInfo, GrandpaJustification, PerDispatchClassWeight, Weight } from "../core/metadata"
import { H256 } from "../core/metadata"
import { AvailError } from "../core/error"
import type { AvailHeader } from "../core/header"
import type { BN } from "../core/polkadot"
import type { Options as FetchExtrinsicOptions, ExtrinsicInfo } from "../core/rpc/system/fetch_extrinsics"
import { BlockEncodedExtrinsicsQuery } from "./encoded"
import { BlockEventsQuery } from "./events"
import { BlockExtrinsicsQuery } from "./extrinsic"
import { BlockContext } from "./shared"

/**
 * Provides access to block data and operations on the Avail blockchain.
 *
 * @remarks
 * The Block class is the primary interface for querying block-level information including
 * extrinsics, events, headers, timestamps, and metadata. It supports querying blocks by
 * hash or number.
 *
 * @example
 * ```ts
 * const client = await Client.create("ws://127.0.0.1:9944");
 * if (!(client instanceof AvailError)) {
 *   // Query block by number
 *   const block = client.block(100);
 *   const header = await block.header();
 *
 *   // Query block by hash
 *   const blockByHash = client.block("0x1234...");
 *   const info = await blockByHash.info();
 * }
 * ```
 *
 * @public
 */
export class Block {
  private ctx: BlockContext

  constructor(client: Client, blockId: H256 | string | number) {
    this.ctx = new BlockContext(client, blockId)
  }

  /**
   * Returns a query interface for accessing encoded (raw) extrinsics in the block.
   *
   * @returns A BlockEncodedExtrinsicsQuery for querying encoded extrinsic data.
   *
   * @remarks
   * Encoded extrinsics are in their raw SCALE-encoded form. Use this when you need
   * the raw bytes or when working with custom encoding/decoding logic.
   *
   * @example
   * ```ts
   * const block = client.block(100);
   * const encoded = block.encoded();
   * const allEncoded = await encoded.all();
   * ```
   *
   * @public
   */
  encoded(): BlockEncodedExtrinsicsQuery {
    return new BlockEncodedExtrinsicsQuery(this.ctx.client, this.ctx.blockId)
  }

  /**
   * Returns a query interface for accessing decoded extrinsics in the block.
   *
   * @returns A BlockExtrinsicsQuery for querying decoded extrinsic data.
   *
   * @remarks
   * This provides access to extrinsics in their decoded form, making it easier to
   * inspect transaction data and filter by specific transaction types.
   *
   * @example
   * ```ts
   * const block = client.block(100);
   * const extrinsics = block.extrinsics();
   * const transfers = await extrinsics.filter(avail.balances.tx.TransferKeepAlive);
   * ```
   *
   * @public
   */
  extrinsics(): BlockExtrinsicsQuery {
    return new BlockExtrinsicsQuery(this.ctx.client, this.ctx.blockId)
  }

  /**
   * Retrieves detailed information about all extrinsics in the block.
   *
   * @param options - Optional filtering and pagination options.
   * @returns A Promise resolving to an array of ExtrinsicInfo objects or an AvailError.
   *
   * @remarks
   * This method provides comprehensive information about each extrinsic including its
   * data, events, success status, and fee information.
   *
   * @example
   * ```ts
   * const block = client.block(100);
   * const infos = await block.extrinsicInfos();
   * if (!(infos instanceof AvailError)) {
   *   infos.forEach(info => {
   *     console.log("Hash:", info.hash.toString());
   *     console.log("Success:", info.success);
   *   });
   * }
   * ```
   *
   * @public
   */
  async extrinsicInfos(options?: FetchExtrinsicOptions): Promise<AvailError | ExtrinsicInfo[]> {
    const chain = this.ctx.chain()
    return await chain.systemFetchExtrinsics(this.ctx.blockId, options)
  }

  /**
   * Returns a query interface for accessing events emitted in the block.
   *
   * @returns A BlockEventsQuery for querying block events.
   *
   * @remarks
   * Events represent actions that occurred during block execution, such as transfers,
   * staking rewards, errors, and other state changes.
   *
   * @example
   * ```ts
   * const block = client.block(100);
   * const events = block.events();
   * const allEvents = await events.all();
   * ```
   *
   * @public
   */
  events(): BlockEventsQuery {
    return new BlockEventsQuery(this.ctx.client, this.ctx.blockId)
  }

  /**
   * Configures whether operations should retry automatically on errors.
   *
   * @param value - True to enable retries, false to disable, or null to use global setting.
   *
   * @remarks
   * This allows fine-grained control over retry behavior for this specific block instance,
   * overriding the client's global retry setting when non-null.
   *
   * @example
   * ```ts
   * const block = client.block(100);
   * block.setRetryOnError(true); // Enable retries for this block
   * ```
   *
   * @public
   */
  setRetryOnError(value: boolean | null) {
    this.ctx.setRetryOnError(value)
  }

  /**
   * Checks whether retry-on-error is enabled for this block instance.
   *
   * @returns True if retries are enabled, false otherwise.
   *
   * @example
   * ```ts
   * const block = client.block(100);
   * const shouldRetry = block.shouldRetryOnError();
   * console.log("Retries enabled:", shouldRetry);
   * ```
   *
   * @public
   */
  shouldRetryOnError(): boolean {
    return this.ctx.shouldRetryOnError()
  }

  /**
   * Retrieves the GRANDPA finality justification for the block.
   *
   * @returns A Promise resolving to the GrandpaJustification, null if not available, or an AvailError.
   *
   * @remarks
   * GRANDPA justifications prove that a block has been finalized by the GRANDPA finality gadget.
   * Not all blocks have justifications - they are typically only present on blocks that mark
   * the end of a finality round.
   *
   * @example
   * ```ts
   * const block = client.block(100);
   * const justification = await block.justification();
   * if (justification && !(justification instanceof AvailError)) {
   *   console.log("Block is finalized with justification");
   * }
   * ```
   *
   * @public
   */
  async justification(): Promise<GrandpaJustification | null | AvailError> {
    const blockId = this.ctx.hashNumber()
    if (blockId instanceof AvailError) return blockId

    const chain = this.ctx.chain()
    let blockHeight: number = 0
    if (blockId instanceof H256) {
      const height = await chain.blockHeight(blockId)
      if (height instanceof AvailError) return height
      if (height == null) return new AvailError("Failed to find block from the provided hash")
      blockHeight = height
    } else {
      blockHeight = blockId
    }

    return await chain.grandpaBlockJustificationJson(blockHeight)
  }

  /**
   * Retrieves the timestamp of when the block was produced.
   *
   * @returns A Promise resolving to the timestamp as a BN (BigNumber) in milliseconds, or an AvailError.
   *
   * @remarks
   * The timestamp represents the time at which the block was created, as set by the block producer.
   * This is extracted from the timestamp extrinsic present in every block.
   *
   * @example
   * ```ts
   * const block = client.block(100);
   * const timestamp = await block.timestamp();
   * if (!(timestamp instanceof AvailError)) {
   *   const date = new Date(timestamp.toNumber());
   *   console.log("Block produced at:", date.toISOString());
   * }
   * ```
   *
   * @public
   */
  async timestamp(): Promise<AvailError | BN> {
    const query = this.extrinsics()
    const timestamp = await query.first(avail.timestamp.tx.Set)
    if (timestamp instanceof AvailError) return timestamp
    if (timestamp == null) return new AvailError("No timestamp transaction found in block")

    return timestamp.call.now
  }

  /**
   * Retrieves comprehensive information about the block.
   *
   * @returns A Promise resolving to BlockInfo containing hash, number, parent hash, and other metadata, or an AvailError.
   *
   * @remarks
   * BlockInfo provides a complete snapshot of the block's metadata including its hash,
   * number, parent hash, and state root.
   *
   * @example
   * ```ts
   * const block = client.block(100);
   * const info = await block.info();
   * if (!(info instanceof AvailError)) {
   *   console.log("Block hash:", info.hash.toString());
   *   console.log("Block number:", info.number);
   *   console.log("Parent hash:", info.parentHash.toString());
   * }
   * ```
   *
   * @public
   */
  async info(): Promise<AvailError | BlockInfo> {
    const chain = this.ctx.chain()
    return await chain.blockInfoFrom(this.ctx.blockId)
  }

  /**
   * Retrieves the block header.
   *
   * @returns A Promise resolving to the AvailHeader or an AvailError.
   *
   * @remarks
   * The header contains essential block metadata including parent hash, number, state root,
   * extrinsics root, and digest (logs).
   *
   * @example
   * ```ts
   * const block = client.block(100);
   * const header = await block.header();
   * if (!(header instanceof AvailError)) {
   *   console.log("Block number:", header.number.toNumber());
   *   console.log("State root:", header.stateRoot.toString());
   * }
   * ```
   *
   * @public
   */
  async header(): Promise<AvailError | AvailHeader> {
    return await this.ctx.header()
  }

  /**
   * Retrieves the account ID of the block author (validator who produced the block).
   *
   * @returns A Promise resolving to the AccountId of the block author or an AvailError.
   *
   * @remarks
   * The block author is the validator who successfully produced this block and is eligible
   * for block rewards.
   *
   * @example
   * ```ts
   * const block = client.block(100);
   * const author = await block.author();
   * if (!(author instanceof AvailError)) {
   *   console.log("Block author:", author.toString());
   * }
   * ```
   *
   * @public
   */
  async author(): Promise<AvailError | AccountId> {
    const chain = this.ctx.chain()
    return await chain.blockAuthor(this.ctx.blockId)
  }

  /**
   * Counts the total number of extrinsics in the block.
   *
   * @returns A Promise resolving to the number of extrinsics or an AvailError.
   *
   * @remarks
   * This count includes all extrinsics (transactions and inherents) present in the block.
   *
   * @example
   * ```ts
   * const block = client.block(100);
   * const count = await block.extrinsicCount();
   * if (!(count instanceof AvailError)) {
   *   console.log("Extrinsics in block:", count);
   * }
   * ```
   *
   * @public
   */
  async extrinsicCount(): Promise<AvailError | number> {
    const encoded = this.encoded()
    encoded.setRetryOnError(this.shouldRetryOnError())
    return await encoded.count()
  }

  /**
   * Counts the total number of events emitted in the block.
   *
   * @returns A Promise resolving to the number of events or an AvailError.
   *
   * @remarks
   * Events represent all actions that occurred during block execution across all extrinsics.
   *
   * @example
   * ```ts
   * const block = client.block(100);
   * const count = await block.eventCount();
   * if (!(count instanceof AvailError)) {
   *   console.log("Events in block:", count);
   * }
   * ```
   *
   * @public
   */
  async eventCount(): Promise<AvailError | number> {
    return await this.ctx.eventCount()
  }

  /**
   * Retrieves the weight consumption of the block by dispatch class.
   *
   * @returns A Promise resolving to PerDispatchClassWeight showing weight used by Normal, Operational, and Mandatory dispatch classes, or an AvailError.
   *
   * @remarks
   * Weight represents the computational resources consumed by the block. It is categorized by
   * dispatch class: Normal (user transactions), Operational (governance), and Mandatory (system).
   *
   * @example
   * ```ts
   * const block = client.block(100);
   * const weight = await block.weight();
   * if (!(weight instanceof AvailError)) {
   *   console.log("Normal weight:", weight.normal.refTime.toString());
   *   console.log("Operational weight:", weight.operational.refTime.toString());
   * }
   * ```
   *
   * @public
   */
  async weight(): Promise<PerDispatchClassWeight | AvailError> {
    const chain = this.ctx.chain()
    return await chain.blockWeight(this.ctx.blockId)
  }

  /**
   * Retrieves the total weight consumed by extrinsics in the block.
   *
   * @returns A Promise resolving to the Weight or an AvailError.
   *
   * @remarks
   * This provides the aggregate weight consumed by all extrinsics, useful for understanding
   * the computational cost of block execution.
   *
   * @example
   * ```ts
   * const block = client.block(100);
   * const weight = await block.extrinsicWeight();
   * if (!(weight instanceof AvailError)) {
   *   console.log("Extrinsic weight:", weight.refTime.toString());
   * }
   * ```
   *
   * @public
   */
  async extrinsicWeight(): Promise<Weight | AvailError> {
    return await this.events().extrinsicWeight()
  }
}
