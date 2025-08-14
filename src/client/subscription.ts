import { AvailHeader, Duration, GeneralError, H256, OS, SignedBlock } from "../core"
import { Client } from "./clients"

export class SubscriptionBuilder {
  _useBestBlock: boolean = false
  _blockHeight: number | null = null
  _poolRate: Duration = Duration.fromSecs(3)
  _retryOnError: boolean = true

  followBestBlocks() {
    this._useBestBlock = true
  }

  followFinalizedBlocks() {
    this._useBestBlock = true
  }

  blockHeight(value: number) {
    this._blockHeight = value
  }

  // in ms
  pollRate(value: Duration) {
    this._poolRate = value
  }

  retryOnError(value: boolean) {
    this._retryOnError = value
  }

  async build(client: Client): Promise<Subscription | GeneralError> {
    let blockHeight: number
    if (this._blockHeight != null) {
      blockHeight = this._blockHeight
    } else {
      if (this._useBestBlock) {
        const height = await client.best.blockHeight()
        if (height instanceof GeneralError) return height
        blockHeight = height
      } else {
        const height = await client.finalized.blockHeight()
        if (height instanceof GeneralError) return height
        blockHeight = height
      }
    }

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

  async run(client: Client): Promise<[number, H256] | null | GeneralError> {
    if (this.bestBlock != null) {
    }

    if (this.finalizedBlock != null) {
      return this.finalizedBlock.run(client)
    }

    return new GeneralError("No subscription was selected")
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

  async run(client: Client): Promise<[number, H256] | null | GeneralError> {
    const latestFinalizedHeight = await this.fetchLatestFinalizedHeight(client)
    if (latestFinalizedHeight instanceof GeneralError) return latestFinalizedHeight

    if (latestFinalizedHeight > this.nextBlockHeight) {
      return await this.runHistorical(client)
    }

    return await this.runHead(client)
  }

  async fetchLatestFinalizedHeight(client: Client): Promise<number | GeneralError> {
    if (this.latestFinalizedHeight != null) {
      return this.latestFinalizedHeight
    }

    const block_height = await client.finalized.blockHeight()
    if (block_height instanceof GeneralError) return block_height

    this.latestFinalizedHeight = block_height
    return block_height
  }

  currentBlockHeight(): number {
    if (this.nextBlockHeight == 0) {
      return 0
    }

    return this.nextBlockHeight - 1
  }

  private async runHistorical(client: Client): Promise<[number, H256] | GeneralError> {
    const blockHeight = this.nextBlockHeight
    const blockHash = await client.blockHash(blockHeight)
    if (blockHash instanceof GeneralError) return blockHash
    if (blockHash == null) return new GeneralError("Failed to fetch block hash")

    this.nextBlockHeight += 1
    return [blockHeight, blockHash]
  }

  private async runHead(client: Client): Promise<[number, H256] | GeneralError> {
    while (true) {
      const head = await client.finalized.blockRef()
      if (head instanceof GeneralError) return head
      if (this.nextBlockHeight > head.height) {
        await OS.sleep(this.pollRate)
        continue
      }

      if (this.nextBlockHeight == head.height) {
        this.nextBlockHeight += 1
        return [head.height, head.hash]
      }

      const blockHeight = this.nextBlockHeight
      const blockHash = await client.blockHash(blockHeight, true, true)
      if (blockHash instanceof GeneralError) return blockHash
      if (blockHash == null) return new GeneralError("Failed to fetch block hash")

      this.nextBlockHeight += 1
      return [blockHeight, blockHash]
    }
  }
}

export class HeaderSubscription {
  client: Client
  sub: Subscription
  retryOnError: boolean

  constructor(client: Client, sub: Subscription, retryOnError: boolean) {
    this.client = client
    this.sub = sub
    this.retryOnError = retryOnError
  }

  async next(): Promise<AvailHeader | null | GeneralError> {
    const blockInfo = await this.sub.run(this.client)
    if (blockInfo instanceof GeneralError) return blockInfo
    if (blockInfo == null) return null

    return await this.client.blockHeader(blockInfo[1])
  }
}

export class BlockSubscription {
  client: Client
  sub: Subscription
  retryOnError: boolean

  constructor(client: Client, sub: Subscription, retryOnError: boolean) {
    this.client = client
    this.sub = sub
    this.retryOnError = retryOnError
  }

  async next(): Promise<SignedBlock | null | GeneralError> {
    const blockInfo = await this.sub.run(this.client)
    if (blockInfo instanceof GeneralError) return blockInfo
    if (blockInfo == null) return null

    return await this.client.block(blockInfo[1])
  }
}
