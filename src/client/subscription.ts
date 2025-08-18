import { AvailHeader, BlockRef, Duration, GeneralError, H256, OS, SignedBlock } from "../core"
import { GrandpaJustification } from "../core/rpc/grandpa"
import { Client } from "./clients"

export class SubscriptionBuilder {
  _useBestBlock: boolean = false
  _blockHeight: number | null = null
  _poolRate: Duration = Duration.fromSecs(3)
  _retryOnError: boolean = true

  followBestBlocks(): SubscriptionBuilder {
    this._useBestBlock = true
    return this
  }

  followFinalizedBlocks(): SubscriptionBuilder {
    this._useBestBlock = true
    return this
  }

  blockHeight(value: number): SubscriptionBuilder {
    this._blockHeight = value
    return this
  }

  // in ms
  pollRate(value: Duration): SubscriptionBuilder {
    this._poolRate = value
    return this
  }

  retryOnError(value: boolean): SubscriptionBuilder {
    this._retryOnError = value
    return this
  }

  async build(client: Client): Promise<Subscription | GeneralError> {
    let blockHeight: number | GeneralError
    if (this._blockHeight != null) {
      blockHeight = this._blockHeight
    } else {
      blockHeight = this._useBestBlock ? await client.best.blockHeight() : await client.finalized.blockHeight()
    }
    if (blockHeight instanceof GeneralError) return blockHeight

    if (this._useBestBlock) {
      const sub = new SubscriptionBestBlock(this._poolRate, blockHeight, this._retryOnError)
      return new Subscription(sub, null)
    }

    const sub = new SubscriptionFinalizedBlock(this._poolRate, blockHeight, this._retryOnError)
    return new Subscription(null, sub)
  }
}

export class Subscription {
  bestBlock: SubscriptionBestBlock | null = null
  finalizedBlock: SubscriptionFinalizedBlock | null = null

  constructor(bestBlock: SubscriptionBestBlock | null, finalizedBlock: SubscriptionFinalizedBlock | null) {
    this.bestBlock = bestBlock
    this.finalizedBlock = finalizedBlock
  }

  async run(client: Client): Promise<BlockRef | null | GeneralError> {
    if (this.bestBlock != null) {
      return this.bestBlock.run(client)
    }

    if (this.finalizedBlock != null) {
      return this.finalizedBlock.run(client)
    }

    return new GeneralError("No subscription was selected")
  }
}

export class SubscriptionFinalizedBlock {
  pollRate: Duration
  nextBlockHeight: number
  retryOnError: boolean
  latestFinalizedHeight: number | null = null

  constructor(pollRate: Duration, nextBlockHeight: number, retryOnError: boolean) {
    this.pollRate = pollRate
    this.nextBlockHeight = nextBlockHeight
    this.retryOnError = retryOnError
  }

  async run(client: Client): Promise<BlockRef | GeneralError> {
    const latestFinalizedHeight = await this.fetchLatestFinalizedHeight(client)
    if (latestFinalizedHeight instanceof GeneralError) return latestFinalizedHeight

    const indexHistoricalBlock = latestFinalizedHeight > this.nextBlockHeight
    let result = indexHistoricalBlock ? await this.runHistorical(client) : await this.runHead(client)
    if (result instanceof GeneralError) return result

    // It was a success
    this.nextBlockHeight += 1
    return result
  }

  currentBlockHeight(): number {
    if (this.nextBlockHeight == 0) {
      return 0
    }

    return this.nextBlockHeight - 1
  }

  private async fetchLatestFinalizedHeight(client: Client): Promise<number | GeneralError> {
    if (this.latestFinalizedHeight != null) {
      return this.latestFinalizedHeight
    }

    const block_height = await client.finalized.blockHeight()
    if (block_height instanceof GeneralError) return block_height

    this.latestFinalizedHeight = block_height
    return block_height
  }

  private async runHistorical(client: Client): Promise<BlockRef | GeneralError> {
    const height = this.nextBlockHeight
    const hash = await client.blockHash(height)
    if (hash instanceof GeneralError) return hash
    if (hash == null) return new GeneralError("Failed to fetch block hash")

    return { height, hash }
  }

  private async runHead(client: Client): Promise<BlockRef | GeneralError> {
    while (true) {
      const ref = await client.finalized.blockRef()
      if (ref instanceof GeneralError) return ref

      const isPastBlock = this.nextBlockHeight > ref.height
      if (isPastBlock) {
        await OS.sleep(this.pollRate)
        continue
      }

      if (this.nextBlockHeight == ref.height) {
        return ref
      }

      const height = this.nextBlockHeight
      const hash = await client.blockHash(height, true, true)
      if (hash instanceof GeneralError) return hash
      if (hash == null) return new GeneralError("Failed to fetch block hash")

      return { height, hash }
    }
  }
}

export class SubscriptionBestBlock {
  pollRate: Duration
  currentBlockHeight: number
  retryOnError: boolean
  blockProcessed: H256[] = []
  latestFinalizedHeight: number | null = null

  constructor(pollRate: Duration, currentBlockHeight: number, retryOnError: boolean) {
    this.pollRate = pollRate
    this.currentBlockHeight = currentBlockHeight
    this.retryOnError = retryOnError
  }

  async run(client: Client): Promise<BlockRef | GeneralError> {
    const latestFinalizedHeight = await this.fetchLatestFinalizedHeight(client)
    if (latestFinalizedHeight instanceof GeneralError) return latestFinalizedHeight

    const indexHistoricalBlock = latestFinalizedHeight >= this.currentBlockHeight
    if (indexHistoricalBlock) {
      const result = await this.runHistorical(client)
      if (result instanceof GeneralError) return result

      this.currentBlockHeight += 1
      this.blockProcessed = []
      return result
    }

    const result = await this.runHead(client)
    if (result instanceof GeneralError) return result

    if (result.height == this.currentBlockHeight) {
      this.blockProcessed.push(result.hash)
    } else {
      this.blockProcessed = [result.hash]
    }

    return result
  }

  currentBlockHeightValue(): number {
    return this.currentBlockHeight
  }

  private async fetchLatestFinalizedHeight(client: Client): Promise<number | GeneralError> {
    if (this.latestFinalizedHeight != null) {
      return this.latestFinalizedHeight
    }

    const block_height = await client.finalized.blockHeight()
    if (block_height instanceof GeneralError) return block_height

    this.latestFinalizedHeight = block_height
    return block_height
  }

  private async runHistorical(client: Client): Promise<BlockRef | GeneralError> {
    const height = this.currentBlockHeight
    const hash = await client.blockHash(height)
    if (hash instanceof GeneralError) return hash
    if (hash == null) return new GeneralError("Failed to fetch block hash")

    return { height, hash }
  }

  private async runHead(client: Client): Promise<BlockRef | GeneralError> {
    while (true) {
      const ref = await client.best.blockRef()
      if (ref instanceof GeneralError) return ref

      const isPastBlock = this.currentBlockHeight > ref.height
      const blockAlreadyProcessed = this.blockProcessed.findIndex((v) => v.toString() == ref.hash.toString()) != -1
      if (isPastBlock || blockAlreadyProcessed) {
        await OS.sleep(this.pollRate)
        continue
      }

      const isCurrentBlock = this.currentBlockHeight == ref.height
      if (isCurrentBlock) {
        return ref
      }

      const noBlockProcessed = this.blockProcessed.length == 0
      if (noBlockProcessed) {
        const hash = await client.blockHash(this.currentBlockHeight, true, true)
        if (hash instanceof GeneralError) return hash
        if (hash == null) return new GeneralError("Failed to fetch block hash")

        return { height: this.currentBlockHeight, hash }
      }

      const isNextBlock = ref.height == this.currentBlockHeight + 1
      if (isNextBlock) {
        return ref
      }

      const nextHeight = this.currentBlockHeight + 1
      const nextHash = await client.blockHash(nextHeight, true, true)
      if (nextHash instanceof GeneralError) return nextHash
      if (nextHash == null) return new GeneralError("Failed to fetch block hash")

      return { height: nextHeight, hash: nextHash }
    }
  }
}

export class HeaderSubscription {
  client: Client
  sub: Subscription
  retryOnError: boolean

  constructor(client: Client, sub: Subscription, retryOnError: boolean = true) {
    this.client = client
    this.sub = sub
    this.retryOnError = retryOnError
  }

  async next(): Promise<AvailHeader | null | GeneralError> {
    const ref = await this.sub.run(this.client)
    if (ref instanceof GeneralError) return ref
    if (ref == null) return null

    return await this.client.blockHeader(ref.hash, this.retryOnError)
  }
}

export class BlockSubscription {
  client: Client
  sub: Subscription
  retryOnError: boolean

  constructor(client: Client, sub: Subscription, retryOnError: boolean = true) {
    this.client = client
    this.sub = sub
    this.retryOnError = retryOnError
  }

  async next(): Promise<SignedBlock | null | GeneralError> {
    const ref = await this.sub.run(this.client)
    if (ref instanceof GeneralError) return ref
    if (ref == null) return null

    return await this.client.block(ref.hash, this.retryOnError)
  }
}

export class GrandpaJustificationJsonSubscription {
  client: Client
  nextBlockHeight: number
  retryOnError: boolean
  pollRate: Duration
  latestFinalizedHeight: number | null = null

  constructor(client: Client, pollRate: Duration, nextBlockHeight: number, retryOnError: boolean = true) {
    this.client = client
    this.pollRate = pollRate
    this.nextBlockHeight = nextBlockHeight
    this.retryOnError = retryOnError
  }

  async next(): Promise<GrandpaJustification | GeneralError> {
    while (true) {
      const latestFinalizedHeight = await this.fetchLatestFinalizedHeight()
      if (latestFinalizedHeight instanceof GeneralError) return latestFinalizedHeight

      const indexHistoricalBlock = latestFinalizedHeight >= this.nextBlockHeight
      let blockHeight = indexHistoricalBlock ? this.runHistorical() : await this.runHead()
      if (blockHeight instanceof GeneralError) return blockHeight

      const result = await this.client.rpc.grandpa.blockJustificationJson(blockHeight, this.retryOnError)
      if (result instanceof GeneralError) return result

      this.nextBlockHeight += 1
      if (result == null) continue

      return result
    }
  }

  async fetchLatestFinalizedHeight(): Promise<number | GeneralError> {
    if (this.latestFinalizedHeight != null) {
      return this.latestFinalizedHeight
    }

    const height = await this.client.finalized.blockHeight()
    if (height instanceof GeneralError) return height

    this.latestFinalizedHeight = height
    return height
  }

  private runHistorical(): number {
    return this.nextBlockHeight
  }

  private async runHead(): Promise<number | GeneralError> {
    while (true) {
      const height = await this.client.finalized.blockHeight()
      if (height instanceof GeneralError) return height

      const isPastBlock = this.nextBlockHeight > height
      if (isPastBlock) {
        await OS.sleep(this.pollRate)
        continue
      }

      return this.nextBlockHeight
    }
  }
}
