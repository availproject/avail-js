import type { GrandpaJustification, H256 } from "../core/metadata"
import type { Duration } from "../core/utils"
import type { Client } from "../client/client"
import { BlockQueryMode } from "../types/block-query-mode"
import { RetryPolicy } from "../types/retry-policy"
import { Sub } from "./sub"

export interface GrandpaJustificationJsonSubValue {
  value: GrandpaJustification | null
  blockHeight: number
  blockHash: H256
}

export class GrandpaJustificationSub {
  private readonly sub: Sub

  constructor(client: Client) {
    this.sub = Sub.fromClient(client)
  }

  static fromClient(client: Client): GrandpaJustificationSub {
    return new GrandpaJustificationSub(client)
  }

  async next(): Promise<GrandpaJustificationJsonSubValue> {
    const info = await this.sub.next()
    try {
      const value = await this.fetchJustification(info.height)
      return { value, blockHash: info.hash, blockHeight: info.height }
    } catch (error) {
      this.sub.withStartHeight(info.height)
      throw error
    }
  }

  async prev(): Promise<GrandpaJustificationJsonSubValue> {
    const info = await this.sub.prev()
    try {
      const value = await this.fetchJustification(info.height)
      return { value, blockHash: info.hash, blockHeight: info.height }
    } catch (error) {
      this.sub.withStartHeight(info.height)
      throw error
    }
  }

  withBlockQueryMode(mode: BlockQueryMode): GrandpaJustificationSub {
    this.sub.withBlockQueryMode(mode)
    return this
  }

  withStartHeight(value: number): GrandpaJustificationSub {
    this.sub.withStartHeight(value)
    return this
  }

  withPollInterval(value: Duration): GrandpaJustificationSub {
    this.sub.withPollInterval(value)
    return this
  }

  withRetryPolicy(policy: RetryPolicy): GrandpaJustificationSub {
    this.sub.withRetryPolicy(policy)
    return this
  }

  shouldRetryOnError(): boolean {
    return this.sub.shouldRetryOnError()
  }

  private async fetchJustification(height: number): Promise<GrandpaJustification | null> {
    const policy = this.sub.shouldRetryOnError() ? RetryPolicy.Enabled : RetryPolicy.Disabled
    return this.sub.clientRef().chain().retryPolicy(policy, RetryPolicy.Inherit).grandpaBlockJustificationJson(height)
  }
}
