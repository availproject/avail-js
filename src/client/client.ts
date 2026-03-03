import type { ApiPromise } from "@polkadot/api"
import { initialize } from "../core/api"
import { H256 } from "../core/metadata"
import { Best } from "../chain/best"
import { Block } from "../block/block"
import { Chain } from "../chain/chain"
import { Finalized } from "../chain/finalized"
import { Head } from "../chain/head"
import { SubmittableTransaction } from "../submission/submittable"
import { SubscribeApi } from "../subscription/builder"
import { TransactionApi } from "../transaction"
import { BlockAt, BlockQueryMode, RetryPolicy, TracingFormat } from "../types"
import { ConnectionOptions } from "./connection-options"
import { ExtrinsicLike } from "../submission/submittable"
import { Account } from "../account"

/**
 * Primary SDK entry point.
 */
export class Client {
  private globalRetryPolicy: RetryPolicy

  private constructor(
    private readonly apiHandle: ApiPromise,
    private readonly endpointUrl: string,
    options?: ConnectionOptions,
  ) {
    this.globalRetryPolicy = options?.retryPolicy ?? "enabled"
  }

  /**
   * Connects to an Avail RPC endpoint.
   */
  static async connect(endpoint: string, options?: ConnectionOptions): Promise<Client> {
    const useWs = (options?.transport ?? "http") === "ws"
    const api = await initialize(endpoint, undefined, !useWs)
    return new Client(api, endpoint, options)
  }

  /**
   * Initializes SDK tracing hooks.
   */
  static initTracing(format: TracingFormat): void {
    void format
  }

  /**
   * Builds a client from an existing API handle.
   */
  static fromComponents(api: ApiPromise, endpoint: string, options?: ConnectionOptions): Client {
    return new Client(api, endpoint, options)
  }

  /**
   * Returns the low-level Polkadot API handle.
   */
  api(): ApiPromise {
    return this.apiHandle
  }

  onlineClient(): ApiPromise {
    return this.apiHandle
  }

  endpoint(): string {
    return this.endpointUrl
  }

  /**
   * Sets client-wide retry policy.
   */
  setRetryPolicy(policy: RetryPolicy): void {
    this.globalRetryPolicy = policy
  }

  /**
   * Returns client-wide retry policy.
   */
  retryPolicy(): RetryPolicy {
    return this.globalRetryPolicy
  }

  isGlobalRetriesEnabled(): boolean {
    return this.globalRetryPolicy !== "disabled"
  }

  /**
   * Returns chain-level query helpers.
   */
  chain(): Chain {
    return new Chain(this)
  }

  /**
   * Returns head helpers for a selected head kind.
   */
  head(mode: BlockQueryMode): Head {
    return new Head(this, mode)
  }

  best(): Best {
    return new Best(this)
  }

  finalized(): Finalized {
    return new Finalized(this)
  }

  txFrom(value: ExtrinsicLike): SubmittableTransaction {
    return SubmittableTransaction.from(this, value)
  }

  block(at: BlockAt): Block {
    return new Block(this, at)
  }

  /**
   * Returns transaction builders grouped by pallet.
   */
  tx(): TransactionApi {
    return new TransactionApi(this)
  }

  subscribe(): SubscribeApi {
    return new SubscribeApi(this)
  }

  genesisHash() {
    return new H256(this.apiHandle.genesisHash)
  }

  runtimeVersion() {
    return this.apiHandle.runtimeVersion
  }

  account(): Account {
    return new Account(this)
  }
}
