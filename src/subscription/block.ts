import type { Client } from "../client"
import type { BlockPhaseEvent, Options as BlockEventsOptions } from "../core/rpc/system/fetch_events"
import { AvailError } from "../core/error"
import type { AvailHeader } from "../core/header"
import type { SignedBlock } from "../core/polkadot"
import type { Duration } from "../core/utils"
import { Sub } from "./sub"
import { Block } from "../block/block"
import type { BlockInfo, H256 } from "../core/metadata"

export class LegacyBlockSub {
  private sub: Sub

  constructor(client: Client) {
    this.sub = new Sub(client)
  }

  async next(): Promise<SignedBlock | null | AvailError> {
    const info = await this.sub.next()
    if (info instanceof AvailError) return info

    const retry = this.sub.shouldRetryOnError()
    const block = await this.sub.clientRef().chain().retryOn(retry, null).legacyBlock(info.hash)
    if (block instanceof AvailError) {
      this.sub.setBlockHeight(info.height)
      return block
    }

    return block
  }

  async prev(): Promise<SignedBlock | null | AvailError> {
    const info = await this.sub.prev()
    if (info instanceof AvailError) return info

    const retry = this.sub.shouldRetryOnError()
    const block = await this.sub.clientRef().chain().retryOn(retry, null).legacyBlock(info.hash)
    if (block instanceof AvailError) {
      this.sub.setBlockHeight(info.height)
      return block
    }

    return block
  }

  shouldRetryOnError(): boolean {
    return this.sub.shouldRetryOnError()
  }

  useBestBlock(value: boolean) {
    this.sub.useBestBlock(value)
  }

  setBlockHeight(value: number) {
    this.sub.setBlockHeight(value)
  }

  setPoolRate(value: Duration) {
    this.sub.setPoolRate(value)
  }

  setRetryOnError(value: boolean | null) {
    this.sub.setRetryOnError(value)
  }
}

export interface BlockSubValue {
  value: Block
  blockHeight: number
  blockHash: H256
}

export class BlockSub {
  private sub: Sub

  constructor(client: Client) {
    this.sub = new Sub(client)
  }

  async next(): Promise<BlockSubValue | AvailError> {
    const info = await this.sub.next()
    if (info instanceof AvailError) return info

    const value = new Block(this.sub.clientRef(), info.hash)
    return { value, blockHash: info.hash, blockHeight: info.height }
  }

  async prev(): Promise<BlockSubValue | AvailError> {
    const info = await this.sub.prev()
    if (info instanceof AvailError) return info

    const value = new Block(this.sub.clientRef(), info.hash)
    return { value, blockHash: info.hash, blockHeight: info.height }
  }

  shouldRetryOnError(): boolean {
    return this.sub.shouldRetryOnError()
  }

  useBestBlock(value: boolean) {
    this.sub.useBestBlock(value)
  }

  setBlockHeight(value: number) {
    this.sub.setBlockHeight(value)
  }

  setPoolRate(value: Duration) {
    this.sub.setPoolRate(value)
  }

  setRetryOnError(value: boolean | null) {
    this.sub.setRetryOnError(value)
  }
}

export interface BlockEventsSubValue {
  list: BlockPhaseEvent[]
  blockHeight: number
  blockHash: H256
}

export class BlockEventsSub {
  private sub: Sub
  private opts: BlockEventsOptions

  constructor(client: Client, opts: BlockEventsOptions) {
    this.sub = new Sub(client)
    this.opts = opts
  }

  async next(): Promise<BlockEventsSubValue | AvailError> {
    while (true) {
      const info = await this.sub.next()
      if (info instanceof AvailError) return info

      const block = new Block(this.sub.clientRef(), info.hash).events()
      block.setRetryOnError(this.sub.shouldRetryOnError())
      const events = await block.raw(this.opts)
      if (events instanceof AvailError) {
        this.sub.setBlockHeight(info.height)
        return events
      }

      if (events.length == 0) {
        continue
      }

      return { list: events, blockHash: info.hash, blockHeight: info.height }
    }
  }

  shouldRetryOnError(): boolean {
    return this.sub.shouldRetryOnError()
  }

  useBestBlock(value: boolean) {
    this.sub.useBestBlock(value)
  }

  setBlockHeight(value: number) {
    this.sub.setBlockHeight(value)
  }

  setPoolRate(value: Duration) {
    this.sub.setPoolRate(value)
  }

  setRetryOnError(value: boolean | null) {
    this.sub.setRetryOnError(value)
  }
}

export class BlockHeaderSub {
  private sub: Sub

  constructor(client: Client) {
    this.sub = new Sub(client)
  }

  async next(): Promise<AvailHeader | null | AvailError> {
    const info = await this.sub.next()
    if (info instanceof AvailError) return info

    const retry = this.sub.shouldRetryOnError()
    const block = await this.sub.clientRef().chain().retryOn(retry, null).blockHeader(info.hash)
    if (block instanceof AvailError) {
      this.sub.setBlockHeight(info.height)
      return block
    }

    return block
  }

  async prev(): Promise<AvailHeader | null | AvailError> {
    const info = await this.sub.prev()
    if (info instanceof AvailError) return info

    const retry = this.sub.shouldRetryOnError()
    const block = await this.sub.clientRef().chain().retryOn(retry, null).blockHeader(info.hash)
    if (block instanceof AvailError) {
      this.sub.setBlockHeight(info.height)
      return block
    }

    return block
  }

  shouldRetryOnError(): boolean {
    return this.sub.shouldRetryOnError()
  }

  useBestBlock(value: boolean) {
    this.sub.useBestBlock(value)
  }

  setBlockHeight(value: number) {
    this.sub.setBlockHeight(value)
  }

  setPoolRate(value: Duration) {
    this.sub.setPoolRate(value)
  }

  setRetryOnError(value: boolean | null) {
    this.sub.setRetryOnError(value)
  }
}
