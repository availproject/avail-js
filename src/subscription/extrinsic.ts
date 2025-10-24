import type { BlockExtrinsic, BlockRawExtrinsic, BlockTransaction } from "../block"
import { BlockWithExt, BlockWithRawExt, BlockWithTx } from "../block"
import type { Client } from "../client"
import type { IHeaderAndDecodable } from "../core/interface"
import type { BlockInfo } from "../core/metadata"
import { AvailError } from "../core/misc/error"
import type { Duration } from "../core/misc/utils"
import { Sub } from "./sub"

export class TransactionSub<T> {
  private sub: Sub
  private opts: BlockWithTx.Options
  private as: IHeaderAndDecodable<T>

  constructor(as: IHeaderAndDecodable<T>, client: Client, opts: BlockWithTx.Options) {
    this.sub = new Sub(client)
    this.opts = opts
    this.as = as
  }

  async next(): Promise<[BlockTransaction<T>[], BlockInfo] | AvailError> {
    while (true) {
      const info = await this.sub.next()
      if (info instanceof AvailError) return info
      const block = new BlockWithTx(this.sub.clientRef(), info.hash)
      block.setRetryOnError(this.sub.shouldRetryOnError())

      const txs = await block.all(this.as, this.opts)
      if (txs instanceof AvailError) {
        this.sub.setBlockHeight(info.height)
        return txs
      }

      if (txs.length == 0) {
        continue
      }

      return [txs, info]
    }
  }

  setOpts(value: BlockWithTx.Options) {
    this.opts = value
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

  shouldRetryOnError(): boolean {
    return this.sub.shouldRetryOnError()
  }
}

export class ExtrinsicSub<T> {
  private sub: Sub
  private opts: BlockWithExt.Options
  private as: IHeaderAndDecodable<T>

  constructor(as: IHeaderAndDecodable<T>, client: Client, opts: BlockWithExt.Options) {
    this.sub = new Sub(client)
    this.opts = opts
    this.as = as
  }

  async next(): Promise<[BlockExtrinsic<T>[], BlockInfo] | AvailError> {
    while (true) {
      const info = await this.sub.next()
      if (info instanceof AvailError) return info
      const block = new BlockWithExt(this.sub.clientRef(), info.hash)
      block.setRetryOnError(this.sub.shouldRetryOnError())

      const txs = await block.all(this.as, this.opts)
      if (txs instanceof AvailError) {
        this.sub.setBlockHeight(info.height)
        return txs
      }

      if (txs.length == 0) {
        continue
      }

      return [txs, info]
    }
  }

  setOpts(value: BlockWithTx.Options) {
    this.opts = value
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

  shouldRetryOnError(): boolean {
    return this.sub.shouldRetryOnError()
  }
}

export class RawExtrinsicSub {
  private sub: Sub
  private opts: BlockWithRawExt.Options

  constructor(client: Client, opts: BlockWithRawExt.Options) {
    this.sub = new Sub(client)
    this.opts = opts
  }

  async next(): Promise<[BlockRawExtrinsic[], BlockInfo] | AvailError> {
    while (true) {
      const info = await this.sub.next()
      if (info instanceof AvailError) return info
      const block = new BlockWithRawExt(this.sub.clientRef(), info.hash)
      block.setRetryOnError(this.sub.shouldRetryOnError())

      const txs = await block.all(this.opts)
      if (txs instanceof AvailError) {
        this.sub.setBlockHeight(info.height)
        return txs
      }

      if (txs.length == 0) {
        continue
      }

      return [txs, info]
    }
  }

  setOpts(value: BlockWithTx.Options) {
    this.opts = value
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

  shouldRetryOnError(): boolean {
    return this.sub.shouldRetryOnError()
  }
}
