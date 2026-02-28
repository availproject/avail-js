import type { H256 } from "../core/metadata"
import type { Client } from "../client/client"
import { RetryPolicy } from "../types/retry-policy"
import { Sub } from "./sub"
import { Fetcher, SubscriptionItem } from "./fetcher"

export class Subscription<F extends Fetcher<any>> {
  constructor(
    private readonly sub: Sub,
    private readonly fetcher: F,
    private readonly skipEmpty: boolean,
  ) {}

  async next(): Promise<SubscriptionItem<F extends Fetcher<infer T> ? T : never>> {
    while (true) {
      const info = await this.sub.next()
      const client = this.sub.clientRef()
      const retry = this.sub.shouldRetryOnError() ? RetryPolicy.Enabled : RetryPolicy.Disabled

      try {
        const value = await this.fetcher.fetch(client, info, retry)
        if (this.skipEmpty && this.fetcher.isEmpty?.(value)) {
          continue
        }
        return { value, blockHeight: info.height, blockHash: info.hash } as any
      } catch (error) {
        this.sub.withStartHeight(info.height)
        throw error
      }
    }
  }

  async *[Symbol.asyncIterator](): AsyncIterator<SubscriptionItem<F extends Fetcher<infer T> ? T : never>> {
    while (true) {
      try {
        const item = await this.next()
        yield item as any
      } catch (error) {
        break
      }
    }
  }
}
