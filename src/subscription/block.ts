import type { BlockPhaseEvent, Options as BlockEventsOptions } from "../core/rpc/system/fetch_events"
import type { AvailHeader } from "../core/header"
import type { SignedBlock } from "../core/polkadot"
import type { Duration } from "../core/utils"
import type { H256 } from "../core/metadata"
import { BlockQueryMode } from "../types/block-query-mode"
import { RetryPolicy } from "../types/retry-policy"
import type { Client } from "../client/client"
import { Sub } from "./sub"

function effectivePolicy(sub: Sub): RetryPolicy {
  return sub.shouldRetryOnError() ? RetryPolicy.Enabled : RetryPolicy.Disabled
}

export class SignedBlockSub {
  private readonly sub: Sub

  constructor(client: Client) {
    this.sub = Sub.fromClient(client)
  }

  static fromClient(client: Client): SignedBlockSub {
    return new SignedBlockSub(client)
  }

  async next(): Promise<SignedBlock | null> {
    const info = await this.sub.next()
    try {
      return await this.sub
        .clientRef()
        .chain()
        .retryPolicy(effectivePolicy(this.sub), RetryPolicy.Inherit)
        .signedBlock(info.hash)
    } catch (error) {
      this.sub.withStartHeight(info.height)
      throw error
    }
  }

  async prev(): Promise<SignedBlock | null> {
    const info = await this.sub.prev()
    try {
      return await this.sub
        .clientRef()
        .chain()
        .retryPolicy(effectivePolicy(this.sub), RetryPolicy.Inherit)
        .signedBlock(info.hash)
    } catch (error) {
      this.sub.withStartHeight(info.height)
      throw error
    }
  }

  shouldRetryOnError(): boolean {
    return this.sub.shouldRetryOnError()
  }

  withBlockQueryMode(mode: BlockQueryMode): SignedBlockSub {
    this.sub.withBlockQueryMode(mode)
    return this
  }

  withStartHeight(value: number): SignedBlockSub {
    this.sub.withStartHeight(value)
    return this
  }

  withPollInterval(value: Duration): SignedBlockSub {
    this.sub.withPollInterval(value)
    return this
  }

  withRetryPolicy(policy: RetryPolicy): SignedBlockSub {
    this.sub.withRetryPolicy(policy)
    return this
  }
}

export interface BlockSubValue {
  blockHeight: number
  blockHash: H256
}

export class BlockSub {
  private readonly sub: Sub

  constructor(client: Client) {
    this.sub = Sub.fromClient(client)
  }

  static fromClient(client: Client): BlockSub {
    return new BlockSub(client)
  }

  async next(): Promise<BlockSubValue> {
    const info = await this.sub.next()
    return { blockHash: info.hash, blockHeight: info.height }
  }

  async prev(): Promise<BlockSubValue> {
    const info = await this.sub.prev()
    return { blockHash: info.hash, blockHeight: info.height }
  }

  shouldRetryOnError(): boolean {
    return this.sub.shouldRetryOnError()
  }

  withBlockQueryMode(mode: BlockQueryMode): BlockSub {
    this.sub.withBlockQueryMode(mode)
    return this
  }

  withStartHeight(value: number): BlockSub {
    this.sub.withStartHeight(value)
    return this
  }

  withPollInterval(value: Duration): BlockSub {
    this.sub.withPollInterval(value)
    return this
  }

  withRetryPolicy(policy: RetryPolicy): BlockSub {
    this.sub.withRetryPolicy(policy)
    return this
  }
}

export interface BlockEventsSubValue {
  list: BlockPhaseEvent[]
  blockHeight: number
  blockHash: H256
}

export class BlockEventsSub {
  private readonly sub: Sub
  private readonly options: BlockEventsOptions

  constructor(client: Client, options: BlockEventsOptions) {
    this.sub = Sub.fromClient(client)
    this.options = options
  }

  static fromClient(client: Client, options: BlockEventsOptions): BlockEventsSub {
    return new BlockEventsSub(client, options)
  }

  async next(): Promise<BlockEventsSubValue> {
    while (true) {
      const events = await this.nextStep()
      if (events.list.length === 0) {
        continue
      }

      return events
    }
  }

  async nextStep(): Promise<BlockEventsSubValue> {
    const info = await this.sub.next()
    try {
      const events = await this.sub
        .clientRef()
        .chain()
        .retryPolicy(effectivePolicy(this.sub), RetryPolicy.Inherit)
        .systemFetchEvents(info.hash, this.options)
      return { list: events, blockHash: info.hash, blockHeight: info.height }
    } catch (error) {
      this.sub.withStartHeight(info.height)
      throw error
    }
  }

  shouldRetryOnError(): boolean {
    return this.sub.shouldRetryOnError()
  }

  withBlockQueryMode(mode: BlockQueryMode): BlockEventsSub {
    this.sub.withBlockQueryMode(mode)
    return this
  }

  withStartHeight(value: number): BlockEventsSub {
    this.sub.withStartHeight(value)
    return this
  }

  withPollInterval(value: Duration): BlockEventsSub {
    this.sub.withPollInterval(value)
    return this
  }

  withRetryPolicy(policy: RetryPolicy): BlockEventsSub {
    this.sub.withRetryPolicy(policy)
    return this
  }
}

export class BlockHeaderSub {
  private readonly sub: Sub

  constructor(client: Client) {
    this.sub = Sub.fromClient(client)
  }

  static fromClient(client: Client): BlockHeaderSub {
    return new BlockHeaderSub(client)
  }

  async next(): Promise<AvailHeader | null> {
    const info = await this.sub.next()
    return this.sub
      .clientRef()
      .chain()
      .retryPolicy(effectivePolicy(this.sub), RetryPolicy.Inherit)
      .blockHeader(info.hash)
  }

  async prev(): Promise<AvailHeader | null> {
    const info = await this.sub.prev()
    return this.sub
      .clientRef()
      .chain()
      .retryPolicy(effectivePolicy(this.sub), RetryPolicy.Inherit)
      .blockHeader(info.hash)
  }

  shouldRetryOnError(): boolean {
    return this.sub.shouldRetryOnError()
  }

  withBlockQueryMode(mode: BlockQueryMode): BlockHeaderSub {
    this.sub.withBlockQueryMode(mode)
    return this
  }

  withStartHeight(value: number): BlockHeaderSub {
    this.sub.withStartHeight(value)
    return this
  }

  withPollInterval(value: Duration): BlockHeaderSub {
    this.sub.withPollInterval(value)
    return this
  }

  withRetryPolicy(policy: RetryPolicy): BlockHeaderSub {
    this.sub.withRetryPolicy(policy)
    return this
  }
}

export type { BlockEventsOptions }
