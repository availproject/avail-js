import { AvailHeader, BlockRef, H256, SignedBlock } from "./../types"
import { GrandpaJustification } from "./../rpc/grandpa"
import { Client } from "./../clients"
import { ClientError } from "./../error"
import { Duration, sleep } from "./../utils"

export class SubscriptionBuilder {
  _useBestBlock: boolean = false
  _blockHeight: number | null = null
  _poolRate: Duration = Duration.fromSecs(3)
  _retryOnError: boolean = true

  follow(useBestBlock: boolean): SubscriptionBuilder {
    this._useBestBlock = useBestBlock
    return this
  }

  followBestBlocks(): SubscriptionBuilder {
    this._useBestBlock = true
    return this
  }

  followFinalizedBlocks(): SubscriptionBuilder {
    this._useBestBlock = false
    return this
  }

  blockHeight(value: number): SubscriptionBuilder {
    this._blockHeight = value
    return this
  }

  pollRate(value: Duration): SubscriptionBuilder {
    this._poolRate = value
    return this
  }

  retryOnError(value: boolean): SubscriptionBuilder {
    this._retryOnError = value
    return this
  }

  async build(client: Client): Promise<Subscription | ClientError> {
    const blockHeight = this._blockHeight ? this._blockHeight : await client.finalized.blockHeight()
    if (blockHeight instanceof ClientError) return blockHeight

    if (this._useBestBlock) {
      const sub = new SubscriptionBestBlock(this._poolRate, blockHeight, this._retryOnError)
      return new Subscription(sub)
    }

    const sub = new SubscriptionFinalizedBlock(this._poolRate, blockHeight, this._retryOnError)
    return new Subscription(sub)
  }
}

export class Subscription {
  private sub: SubscriptionBestBlock | SubscriptionFinalizedBlock
  constructor(sub: SubscriptionBestBlock | SubscriptionFinalizedBlock) {
    this.sub = sub
  }

  async next(client: Client): Promise<BlockRef | ClientError> {
    return this.sub.next(client)
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

  async next(client: Client): Promise<BlockRef | ClientError> {
    const latestFinalizedHeight = await this.fetchLatestFinalizedHeight(client)
    if (latestFinalizedHeight instanceof ClientError) return latestFinalizedHeight

    const indexHistoricalBlock = latestFinalizedHeight > this.nextBlockHeight
    const result = indexHistoricalBlock ? await this.runHistorical(client) : await this.runHead(client)
    if (result instanceof ClientError) return result

    // It was a success
    this.nextBlockHeight = result.height + 1
    return result
  }

  currentBlockHeight(): number {
    if (this.nextBlockHeight == 0) return 0

    return this.nextBlockHeight - 1
  }

  private async fetchLatestFinalizedHeight(client: Client): Promise<number | ClientError> {
    if (this.latestFinalizedHeight != null) return this.latestFinalizedHeight

    const block_height = await client.finalized.blockHeight()
    if (block_height instanceof ClientError) return block_height

    this.latestFinalizedHeight = block_height
    return block_height
  }

  private async runHistorical(client: Client): Promise<BlockRef | ClientError> {
    const height = this.nextBlockHeight
    const hash = await client.blockHash(height)
    if (hash instanceof ClientError) return hash
    if (hash == null) return new ClientError("Failed to fetch block hash")

    return { height, hash }
  }

  private async runHead(client: Client): Promise<BlockRef | ClientError> {
    while (true) {
      const ref = await client.finalized.blockInfo()
      if (ref instanceof ClientError) return ref

      const isPastBlock = this.nextBlockHeight > ref.height
      if (isPastBlock) {
        await sleep(this.pollRate)
        continue
      }

      if (this.nextBlockHeight == ref.height) {
        return ref
      }

      const height = this.nextBlockHeight
      const hash = await client.blockHash(height, true, true)
      if (hash instanceof ClientError) return hash
      if (hash == null) return new ClientError("Failed to fetch block hash")

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

  async next(client: Client): Promise<BlockRef | ClientError> {
    const latestFinalizedHeight = await this.fetchLatestFinalizedHeight(client)
    if (latestFinalizedHeight instanceof ClientError) return latestFinalizedHeight

    const indexHistoricalBlock = latestFinalizedHeight >= this.currentBlockHeight
    if (indexHistoricalBlock) {
      const result = await this.runHistorical(client)
      if (result instanceof ClientError) return result

      this.currentBlockHeight = result.height + 1
      this.blockProcessed = []
      return result
    }

    const result = await this.runHead(client)
    if (result instanceof ClientError) return result

    if (result.height == this.currentBlockHeight) {
      this.blockProcessed.push(result.hash)
    } else {
      this.blockProcessed = [result.hash]
      this.currentBlockHeight = result.height
    }

    return result
  }

  currentBlockHeightValue(): number {
    return this.currentBlockHeight
  }

  private async fetchLatestFinalizedHeight(client: Client): Promise<number | ClientError> {
    if (this.latestFinalizedHeight != null) {
      return this.latestFinalizedHeight
    }

    const block_height = await client.finalized.blockHeight()
    if (block_height instanceof ClientError) return block_height

    this.latestFinalizedHeight = block_height
    return block_height
  }

  private async runHistorical(client: Client): Promise<BlockRef | ClientError> {
    const height = this.currentBlockHeight
    const hash = await client.blockHash(height, this.retryOnError)
    if (hash instanceof ClientError) return hash
    if (hash == null) return new ClientError("Failed to fetch block hash")

    return { height, hash }
  }

  private async runHead(client: Client): Promise<BlockRef | ClientError> {
    while (true) {
      const ref = await client.best.blockInfo()
      if (ref instanceof ClientError) return ref

      const isPastBlock = this.currentBlockHeight > ref.height
      const blockAlreadyProcessed = this.blockProcessed.findIndex((v) => v.toString() == ref.hash.toString()) != -1
      if (isPastBlock || blockAlreadyProcessed) {
        await sleep(this.pollRate)
        continue
      }

      const isCurrentBlock = ref.height == this.currentBlockHeight
      const isNextBlock = ref.height == this.currentBlockHeight + 1
      if (isCurrentBlock || isNextBlock) {
        return ref
      }

      const noBlockProcessed = this.blockProcessed.length == 0
      if (noBlockProcessed) {
        const hash = await client.blockHash(this.currentBlockHeight, this.retryOnError, true)
        if (hash instanceof ClientError) return hash
        if (hash == null) return new ClientError("Failed to fetch block hash")

        return { height: this.currentBlockHeight, hash }
      }

      const nextHeight = this.currentBlockHeight + 1
      const nextHash = await client.blockHash(nextHeight, this.retryOnError, true)
      if (nextHash instanceof ClientError) return nextHash
      if (nextHash == null) return new ClientError("Failed to fetch block hash")

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

  async next(): Promise<AvailHeader | null | ClientError> {
    const ref = await this.sub.next(this.client)
    if (ref instanceof ClientError) return ref

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

  async next(): Promise<SignedBlock | null | ClientError> {
    const ref = await this.sub.next(this.client)
    if (ref instanceof ClientError) return ref

    return await this.client.rpcBlock(ref.hash, this.retryOnError)
  }
}
