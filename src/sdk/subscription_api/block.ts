import { AvailHeader, SignedBlock } from "./../types"
import { Client } from "./../clients"
import { AvailError } from "../error"
import { Sub } from "./sub"
import { Duration } from "../utils"
import { BlockPhaseEvent, BlockEvents, BlockEventsOptions, Block } from "../block"
import { BlockInfo } from "../rpc/system"

export class LegacyBlockSub {
  private sub: Sub

  constructor(client: Client) {
    this.sub = new Sub(client)
  }

  async next(): Promise<SignedBlock | null | AvailError> {
    const info = await this.sub.next()
    if (info instanceof AvailError) return info

    const retry = this.sub.shouldRetryOnError()
    const block = await this.sub.clientRef().rpc().retryOn(retry, null).legacyBlock(info.hash)
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
    const block = await this.sub.clientRef().rpc().retryOn(retry, null).legacyBlock(info.hash)
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

export class BlockSub {
  private sub: Sub

  constructor(client: Client) {
    this.sub = new Sub(client)
  }

  async next(): Promise<[Block, BlockInfo] | AvailError> {
    const info = await this.sub.next()
    if (info instanceof AvailError) return info

    return [new Block(this.sub.clientRef(), info.hash), info]
  }

  async prev(): Promise<[Block, BlockInfo] | AvailError> {
    const info = await this.sub.prev()
    if (info instanceof AvailError) return info

    return [new Block(this.sub.clientRef(), info.hash), info]
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

export class BlockEventsSub {
  private sub: Sub
  private opts: BlockEventsOptions

  constructor(client: Client, opts: BlockEventsOptions) {
    this.sub = new Sub(client)
    this.opts = opts
  }

  async next(): Promise<[BlockPhaseEvent[], BlockInfo] | AvailError> {
    while (true) {
      const info = await this.sub.next()
      if (info instanceof AvailError) return info

      const block = new BlockEvents(this.sub.clientRef(), info.hash)
      block.setRetryOnError(this.sub.shouldRetryOnError())
      const events = await block.block(this.opts)
      if (events instanceof AvailError) {
        this.sub.setBlockHeight(info.height)
        return events
      }

      if (events.length == 0) {
        continue
      }

      return [events, info]
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
    const block = await this.sub.clientRef().rpc().retryOn(retry, null).blockHeader(info.hash)
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
    const block = await this.sub.clientRef().rpc().retryOn(retry, null).blockHeader(info.hash)
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
