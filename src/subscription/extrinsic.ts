import { Block } from "../block/block"
import { BlockEncodedExtrinsic } from "../block/encoded"
import type { BlockExtrinsic } from "../block/extrinsic"
import type { Options as ExtrinsicOptions } from "../block/extrinsic_options"
import type { Client } from "../client"
import type { IHeaderAndDecodable } from "../core/interface"
import type { BlockInfo, H256 } from "../core/metadata"
import { AvailError } from "../core/error"
import type { Duration } from "../core/utils"
import { Sub } from "./sub"

export interface ExtrinsicSubValue<T> {
  list: BlockExtrinsic<T>[]
  blockHeight: number
  blockHash: H256
}

export class ExtrinsicSub<T> {
  private sub: Sub
  private opts: ExtrinsicOptions
  private as: IHeaderAndDecodable<T>

  constructor(as: IHeaderAndDecodable<T>, client: Client, opts: ExtrinsicOptions) {
    this.sub = new Sub(client)
    this.opts = opts
    this.as = as
  }

  async next(): Promise<ExtrinsicSubValue<T> | AvailError> {
    while (true) {
      const info = await this.sub.next()
      if (info instanceof AvailError) return info

      const block = new Block(this.sub.clientRef(), info.hash)
      block.setRetryOnError(this.sub.shouldRetryOnError())

      const txs = await block.extrinsics().all(this.as, this.opts)
      if (txs instanceof AvailError) {
        this.sub.setBlockHeight(info.height)
        return txs
      }

      if (txs.length == 0) continue

      return { list: txs, blockHash: info.hash, blockHeight: info.height }
    }
  }

  setOpts(value: ExtrinsicOptions) {
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

export interface EncodedExtrinsicSubValue {
  list: BlockEncodedExtrinsic[]
  blockHeight: number
  blockHash: H256
}

export class EncodedExtrinsicSub {
  private sub: Sub
  private opts: ExtrinsicOptions

  constructor(client: Client, opts: ExtrinsicOptions) {
    this.sub = new Sub(client)
    this.opts = opts
  }

  async next(): Promise<EncodedExtrinsicSubValue | AvailError> {
    while (true) {
      const info = await this.sub.next()
      if (info instanceof AvailError) return info
      const block = new Block(this.sub.clientRef(), info.hash).encoded()
      block.setRetryOnError(this.sub.shouldRetryOnError())

      const txs = await block.all(this.opts)
      if (txs instanceof AvailError) {
        this.sub.setBlockHeight(info.height)
        return txs
      }

      if (txs.length == 0) continue

      return { list: txs, blockHash: info.hash, blockHeight: info.height }
    }
  }

  setOpts(value: ExtrinsicOptions) {
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
