import type { BlockInfo } from "../core/metadata"
import { Duration, sleep } from "../core/utils"
import type { Client } from "../client/client"
import { NotFoundError } from "../errors/sdk-error"
import { ErrorOperation } from "../errors/operations"
import { BlockQueryMode, RetryPolicy, resolveRetryPolicy, HeadKind } from "../types"

/**
 * Poll-based block subscription.
 */
export class Sub {
  private mode: BlockQueryMode = BlockQueryMode.Finalized
  private blockHeight: number | null = null
  private pollInterval: Duration = Duration.fromSecs(3)
  private retryPolicy: RetryPolicy = RetryPolicy.Inherit
  private processedPreviousBlock = true
  private blockProcessed: string[] = []

  constructor(private readonly client: Client) {}

  static fromClient(client: Client): Sub {
    return new Sub(client)
  }

  async initialize(): Promise<void> {
    await this.ensureInitialized()
  }

  /**
   * Returns the next block reference.
   */
  async next(): Promise<BlockInfo> {
    await this.ensureInitialized()
    if (this.mode === BlockQueryMode.Finalized) {
      return this.nextFinalized()
    }
    return this.nextBest()
  }

  /**
   * Returns the previous block reference.
   */
  async prev(): Promise<BlockInfo> {
    await this.ensureInitialized()
    if (this.mode === BlockQueryMode.Finalized) {
      this.blockHeight = this.previousCursorFrom(this.blockHeight!)
      this.processedPreviousBlock = false
      return this.nextFinalized()
    }

    this.blockHeight = this.blockHeight! > 0 ? this.blockHeight! - 1 : 0
    this.blockProcessed = []
    return this.nextBest()
  }

  shouldRetryOnError(): boolean {
    return resolveRetryPolicy(this.retryPolicy, this.client.retryPolicy() !== RetryPolicy.Disabled)
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
    this.blockProcessed = []
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

  resolvedRetryPolicy(): RetryPolicy {
    return this.shouldRetryOnError() ? RetryPolicy.Enabled : RetryPolicy.Disabled
  }

  private async currentHeadHeight(): Promise<number> {
    const kind = this.mode === BlockQueryMode.Best ? HeadKind.Best : HeadKind.Finalized
    return this.client.head(kind).retryPolicy(this.retryPolicy).blockHeight()
  }

  private chain() {
    return this.client.chain().retryPolicy(this.retryPolicy, RetryPolicy.Inherit)
  }

  private async ensureInitialized(): Promise<void> {
    if (this.blockHeight == null) {
      this.blockHeight = await this.currentHeadHeight()
      if (this.mode === BlockQueryMode.Best) {
        this.blockProcessed = []
      }
    }
  }

  private previousCursorFrom(height: number): number {
    let cursor = height
    if (cursor > 0) {
      cursor -= 1
    }
    if (this.processedPreviousBlock && cursor > 0) {
      cursor -= 1
    }
    return cursor
  }

  private async waitForHead(targetHeight: number): Promise<void> {
    while ((await this.currentHeadHeight()) < targetHeight) {
      await sleep(this.pollInterval)
    }
  }

  private async nextFinalized(): Promise<BlockInfo> {
    const height = this.blockHeight!
    const latestFinalizedHeight = await this.client.finalized().retryPolicy(this.retryPolicy).blockHeight()

    let targetHeight = height
    let hash = null

    if (latestFinalizedHeight > height) {
      hash = await this.chain().blockHash(targetHeight)
    } else {
      while (true) {
        const head = await this.chain().chainInfo()

        if (targetHeight > head.finalizedHeight) {
          await sleep(this.pollInterval)
          continue
        }

        if (targetHeight === head.finalizedHeight) {
          hash = head.finalizedHash
          targetHeight = head.finalizedHeight
          break
        }

        hash = await this.client.chain().retryPolicy(this.retryPolicy, RetryPolicy.Enabled).blockHash(targetHeight)
        break
      }
    }

    if (hash == null) {
      throw new NotFoundError("Failed to fetch block hash", {
        operation: ErrorOperation.SubscriptionNext,
        details: { height: targetHeight },
      })
    }

    this.blockHeight = targetHeight + 1
    this.processedPreviousBlock = true
    return { hash, height: targetHeight }
  }

  private async nextBest(): Promise<BlockInfo> {
    const currentHeight = this.blockHeight!
    const latestFinalizedHeight = await this.client.finalized().retryPolicy(this.retryPolicy).blockHeight()

    if (latestFinalizedHeight > currentHeight) {
      let historicalHeight = currentHeight
      if (this.blockProcessed.length > 0) {
        historicalHeight += 1
      }

      const hash = await this.chain().blockHash(historicalHeight)
      if (hash == null) {
        throw new NotFoundError("Failed to fetch block hash", {
          operation: ErrorOperation.SubscriptionNext,
          details: { height: historicalHeight },
        })
      }

      this.blockProcessed = [hash.toString()]
      this.blockHeight = historicalHeight
      return { hash, height: historicalHeight }
    }

    while (true) {
      const head = await this.chain().chainInfo()
      const isPastBlock = currentHeight > head.bestHeight
      const blockAlreadyProcessed = this.blockProcessed.includes(head.bestHash.toString())
      if (isPastBlock || blockAlreadyProcessed) {
        await sleep(this.pollInterval)
        continue
      }

      let hash = head.bestHash
      let height = head.bestHeight

      if (this.blockProcessed.length === 0) {
        const firstHash = await this.client
          .chain()
          .retryPolicy(this.retryPolicy, RetryPolicy.Enabled)
          .blockHash(currentHeight)
        if (firstHash == null) {
          throw new NotFoundError("Failed to fetch block hash", {
            operation: ErrorOperation.SubscriptionNext,
            details: { height: currentHeight },
          })
        }
        hash = firstHash
        height = currentHeight
      } else {
        const isCurrentBlock = currentHeight === head.bestHeight
        const isNextBlock = currentHeight + 1 === head.bestHeight
        if (!isCurrentBlock && !isNextBlock) {
          const nextHeight = currentHeight + 1
          const nextHash = await this.client
            .chain()
            .retryPolicy(this.retryPolicy, RetryPolicy.Enabled)
            .blockHash(nextHeight)
          if (nextHash == null) {
            throw new NotFoundError("Failed to fetch block hash", {
              operation: ErrorOperation.SubscriptionNext,
              details: { height: nextHeight },
            })
          }
          hash = nextHash
          height = nextHeight
        }
      }

      if (height === currentHeight) {
        this.blockProcessed.push(hash.toString())
      } else {
        this.blockProcessed = [hash.toString()]
        this.blockHeight = height
      }

      return { hash, height }
    }
  }
}
