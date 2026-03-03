import type { IHeaderAndDecodable } from "../core/interface"
import type { AllowedEvents } from "../core/rpc/custom"
import type { Client } from "../client/client"
import { Duration } from "../core/utils"
import { RetryPolicy, BlockQueryMode } from "../types"
import type { ExtrinsicOptions } from "./extrinsic-options"
import { Sub } from "./sub"
import {
  Fetcher,
  BlockInfoFetcher,
  BlockFetcher,
  BlockHeaderFetcher,
  SignedBlockFetcher,
  BlockEventsFetcher,
  ExtrinsicFetcher,
  EncodedExtrinsicFetcher,
  GrandpaJustificationFetcher,
} from "./fetcher"
import { Subscription } from "./subscription"
import { Cursor } from "./cursor"

export class SubscriptionBuilder<F extends Fetcher<any>> {
  private _mode: BlockQueryMode = "finalized"
  private _startHeight: number | null = null
  private _pollInterval: Duration = Duration.fromSecs(3)
  private _retryPolicy: RetryPolicy = "inherit"
  private _skipEmpty: boolean = false

  constructor(
    private readonly client: Client,
    private readonly fetcher: F,
  ) {}

  mode(value: BlockQueryMode): this {
    this._mode = value
    return this
  }

  fromHeight(height: number): this {
    this._startHeight = height
    return this
  }

  pollInterval(value: Duration): this {
    this._pollInterval = value
    return this
  }

  retry(policy: RetryPolicy): this {
    this._retryPolicy = policy
    return this
  }

  skipEmpty(): this {
    this._skipEmpty = true
    return this
  }

  async build(): Promise<Subscription<F>> {
    const sub = await this.initSub()
    return new Subscription(sub, this.fetcher, this._skipEmpty)
  }

  async buildCursor(): Promise<Cursor<F>> {
    const sub = await this.initSub()
    return new Cursor(sub, this.fetcher, this._skipEmpty)
  }

  private async initSub(): Promise<Sub> {
    const sub = new Sub(this.client)
    sub.withBlockQueryMode(this._mode)
    sub.withPollInterval(this._pollInterval)
    sub.withRetryPolicy(this._retryPolicy)
    if (this._startHeight !== null) {
      sub.withStartHeight(this._startHeight)
    }
    await sub.initialize()
    return sub
  }
}

export class SubscribeApi {
  constructor(private readonly client: Client) {}

  raw(): SubscriptionBuilder<BlockInfoFetcher> {
    return new SubscriptionBuilder(this.client, new BlockInfoFetcher())
  }

  blocks(): SubscriptionBuilder<BlockFetcher> {
    return new SubscriptionBuilder(this.client, new BlockFetcher())
  }

  blockHeaders(): SubscriptionBuilder<BlockHeaderFetcher> {
    return new SubscriptionBuilder(this.client, new BlockHeaderFetcher())
  }

  signedBlocks(): SubscriptionBuilder<SignedBlockFetcher> {
    return new SubscriptionBuilder(this.client, new SignedBlockFetcher())
  }

  blockEvents(allowList: AllowedEvents, fetchData: boolean): SubscriptionBuilder<BlockEventsFetcher> {
    return new SubscriptionBuilder(this.client, new BlockEventsFetcher(allowList, fetchData))
  }

  extrinsics<T>(as: IHeaderAndDecodable<T>, options: ExtrinsicOptions): SubscriptionBuilder<ExtrinsicFetcher<T>> {
    return new SubscriptionBuilder(this.client, new ExtrinsicFetcher(as, options))
  }

  encodedExtrinsics(options: ExtrinsicOptions): SubscriptionBuilder<EncodedExtrinsicFetcher> {
    return new SubscriptionBuilder(this.client, new EncodedExtrinsicFetcher(options))
  }

  grandpaJustifications(): SubscriptionBuilder<GrandpaJustificationFetcher> {
    return new SubscriptionBuilder(this.client, new GrandpaJustificationFetcher())
  }
}
