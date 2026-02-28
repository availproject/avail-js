import type { BlockInfo } from "../core/metadata"
import { Duration, sleep } from "../core/utils"
import type { Client } from "../client/client"
import { NotFoundError } from "../errors/sdk-error"
import { ErrorOperation } from "../errors/operations"
import { BlockQueryMode } from "../types/block-query-mode"
import { HeadKind } from "../types/head-kind"
import { RetryPolicy } from "../types/retry-policy"

/**
 * Poll-based block subscription.
 */
export class Sub {
  private mode: BlockQueryMode = BlockQueryMode.Finalized
  private blockHeight: number | null = null
  private pollInterval: Duration = Duration.fromSecs(3)
  private retryPolicy: RetryPolicy = RetryPolicy.Inherit
  private processedPreviousBlock = true

  constructor(private readonly client: Client) {}

  static fromClient(client: Client): Sub {
    return new Sub(client)
  }

  /**
   * Returns the next block reference.
   */
  async next(): Promise<BlockInfo> {
    if (this.blockHeight == null) {
      this.blockHeight = await this.currentHeadHeight()
    }

    const height = this.blockHeight
    const headHeight = await this.currentHeadHeight()

    if (headHeight < height) {
      await this.waitForHead(height)
    }

    const hash = await this.client.chain().retryPolicy(this.retryPolicy, RetryPolicy.Enabled).blockHash(height)

    if (hash == null) {
      throw new NotFoundError("Failed to fetch block hash", {
        operation: ErrorOperation.SubscriptionNext,
        details: { height },
      })
    }

    this.blockHeight = height + 1
    this.processedPreviousBlock = true
    return { hash, height }
  }

  /**
   * Returns the previous block reference.
   */
  async prev(): Promise<BlockInfo> {
    if (this.blockHeight == null) {
      this.blockHeight = await this.currentHeadHeight()
    }

    if (this.blockHeight > 0) {
      this.blockHeight -= 1
    }

    if (this.processedPreviousBlock && this.blockHeight > 0) {
      this.blockHeight -= 1
    }

    this.processedPreviousBlock = false
    return this.next()
  }

  shouldRetryOnError(): boolean {
    if (this.retryPolicy === RetryPolicy.Inherit) {
      return this.client.retryPolicy() !== RetryPolicy.Disabled
    }
    return this.retryPolicy === RetryPolicy.Enabled
  }

  /**
   * Sets whether to follow best or finalized head.
   */
  withBlockQueryMode(mode: BlockQueryMode): Sub {
    this.mode = mode
    return this
  }

  /**
   * Sets starting height for iteration.
   */
  withStartHeight(value: number): Sub {
    this.blockHeight = value
    this.processedPreviousBlock = false
    return this
  }

  /**
   * Sets poll interval while waiting for new blocks.
   */
  withPollInterval(value: Duration): Sub {
    this.pollInterval = value
    return this
  }

  /**
   * Sets retry policy for underlying chain calls.
   */
  withRetryPolicy(policy: RetryPolicy): Sub {
    this.retryPolicy = policy
    return this
  }

  clientRef(): Client {
    return this.client
  }

  private async currentHeadHeight(): Promise<number> {
    const kind = this.mode === BlockQueryMode.Best ? HeadKind.Best : HeadKind.Finalized
    return this.client.head(kind).retryPolicy(this.retryPolicy).blockHeight()
  }

  private async waitForHead(targetHeight: number): Promise<void> {
    while ((await this.currentHeadHeight()) < targetHeight) {
      await sleep(this.pollInterval)
    }
  }
}
