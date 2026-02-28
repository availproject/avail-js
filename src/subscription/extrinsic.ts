import type { ExtrinsicInfo } from "../core/rpc/system/fetch_extrinsics"
import type { IHeaderAndDecodable } from "../core/interface"
import type { H256 } from "../core/metadata"
import type { Duration } from "../core/utils"
import type { Client } from "../client/client"
import { BlockQueryMode } from "../types/block-query-mode"
import { RetryPolicy } from "../types/retry-policy"
import { Sub } from "./sub"
import { toRpcOptions, type ExtrinsicOptions } from "./extrinsic-options"

export interface ExtrinsicSubValue {
  list: ExtrinsicInfo[]
  blockHeight: number
  blockHash: H256
}

export class ExtrinsicSub {
  private readonly sub: Sub
  private options: ExtrinsicOptions

  constructor(_as: IHeaderAndDecodable<unknown>, client: Client, options: ExtrinsicOptions) {
    this.sub = Sub.fromClient(client)
    this.options = options
  }

  static fromClient<T>(as: IHeaderAndDecodable<T>, client: Client, options: ExtrinsicOptions): ExtrinsicSub {
    return new ExtrinsicSub(as, client, options)
  }

  async next(): Promise<ExtrinsicSubValue> {
    while (true) {
      const info = await this.sub.next()

      let encoded
      try {
        const rpcOptions = toRpcOptions(this.options, "Extrinsic")
        encoded = await this.sub
          .clientRef()
          .chain()
          .retryPolicy(this.sub.shouldRetryOnError() ? RetryPolicy.Enabled : RetryPolicy.Disabled, RetryPolicy.Inherit)
          .systemFetchExtrinsics(info.hash, rpcOptions)
      } catch (error) {
        this.sub.withStartHeight(info.height)
        throw error
      }

      const txs = encoded
      if (txs.length === 0) continue

      return { list: txs, blockHash: info.hash, blockHeight: info.height }
    }
  }

  withOptions(value: ExtrinsicOptions): ExtrinsicSub {
    this.options = value
    return this
  }

  withBlockQueryMode(mode: BlockQueryMode): ExtrinsicSub {
    this.sub.withBlockQueryMode(mode)
    return this
  }

  withStartHeight(value: number): ExtrinsicSub {
    this.sub.withStartHeight(value)
    return this
  }

  withPollInterval(value: Duration): ExtrinsicSub {
    this.sub.withPollInterval(value)
    return this
  }

  withRetryPolicy(policy: RetryPolicy): ExtrinsicSub {
    this.sub.withRetryPolicy(policy)
    return this
  }

  shouldRetryOnError(): boolean {
    return this.sub.shouldRetryOnError()
  }
}

export interface EncodedExtrinsicSubValue {
  list: ExtrinsicInfo[]
  blockHeight: number
  blockHash: H256
}

export class EncodedExtrinsicSub {
  private readonly sub: Sub
  private options: ExtrinsicOptions

  constructor(client: Client, options: ExtrinsicOptions) {
    this.sub = Sub.fromClient(client)
    this.options = options
  }

  static fromClient(client: Client, options: ExtrinsicOptions): EncodedExtrinsicSub {
    return new EncodedExtrinsicSub(client, options)
  }

  async next(): Promise<EncodedExtrinsicSubValue> {
    while (true) {
      const extrinsics = await this.step()
      const txs = extrinsics.list
      if (txs.length === 0) continue

      return extrinsics
    }
  }

  async step(): Promise<EncodedExtrinsicSubValue> {
    const info = await this.sub.next()

    let encoded
    try {
      const rpcOptions = toRpcOptions(this.options, "Extrinsic")
      encoded = await this.sub
        .clientRef()
        .chain()
        .retryPolicy(this.sub.shouldRetryOnError() ? RetryPolicy.Enabled : RetryPolicy.Disabled, RetryPolicy.Inherit)
        .systemFetchExtrinsics(info.hash, rpcOptions)
    } catch (error) {
      this.sub.withStartHeight(info.height)
      throw error
    }

    const txs = encoded
    return { list: txs, blockHash: info.hash, blockHeight: info.height }
  }

  withOptions(value: ExtrinsicOptions): EncodedExtrinsicSub {
    this.options = value
    return this
  }

  withBlockQueryMode(mode: BlockQueryMode): EncodedExtrinsicSub {
    this.sub.withBlockQueryMode(mode)
    return this
  }

  withStartHeight(value: number): EncodedExtrinsicSub {
    this.sub.withStartHeight(value)
    return this
  }

  withPollInterval(value: Duration): EncodedExtrinsicSub {
    this.sub.withPollInterval(value)
    return this
  }

  withRetryPolicy(policy: RetryPolicy): EncodedExtrinsicSub {
    this.sub.withRetryPolicy(policy)
    return this
  }

  shouldRetryOnError(): boolean {
    return this.sub.shouldRetryOnError()
  }
}

export type { ExtrinsicOptions }
