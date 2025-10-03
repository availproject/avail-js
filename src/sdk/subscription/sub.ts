import { H256, BlockInfo } from "../core/types"
import { Client } from ".."
import { AvailError } from ".."
import { Duration, sleep } from "../core"

export class Sub {
  private sub: BestBlockSub | FinalizedBlockSub | UnInitSub
  constructor(client: Client) {
    this.sub = new UnInitSub(client)
  }

  async next(): Promise<BlockInfo | AvailError> {
    if (this.sub instanceof UnInitSub) {
      const s = await this.sub.build()
      if (s instanceof AvailError) return s
      this.sub = s
    }

    return await this.sub.next()
  }

  async prev(): Promise<BlockInfo | AvailError> {
    if (this.sub instanceof UnInitSub) {
      let s = await this.sub.build()
      if (s instanceof AvailError) return s
      this.sub = s
    }

    return await this.sub.prev()
  }

  shouldRetryOnError(): boolean {
    return this.sub.shouldRetryOnError() ?? this.sub.clientRef().isGlobalRetiresEnabled()
  }

  clientRef(): Client {
    return this.sub.clientRef()
  }

  useBestBlock(value: boolean) {
    if (this.sub instanceof UnInitSub) {
      this.sub.setUseBestBlock(value)
    }
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
}

export class UnInitSub {
  private client: Client
  private useBestBlock: boolean = false
  private blockHeight: number | null = null
  private poolRate: Duration = Duration.fromSecs(3)
  private retryOnError: boolean | null = null
  constructor(client: Client) {
    this.client = client
  }

  async build(): Promise<BestBlockSub | FinalizedBlockSub | AvailError> {
    let blockHeight = this.blockHeight
    if (blockHeight == null) {
      let bh =
        this.useBestBlock == true ? await this.client.best().blockHeight() : await this.client.finalized().blockHeight()
      if (bh instanceof AvailError) return bh
      blockHeight = bh
    }

    if (this.useBestBlock) {
      return new BestBlockSub(this.client, this.poolRate, blockHeight, [], this.retryOnError, null)
    }

    return new FinalizedBlockSub(this.client, this.poolRate, blockHeight, this.retryOnError, null, false)
  }

  shouldRetryOnError(): boolean | null {
    return this.retryOnError
  }

  clientRef(): Client {
    return this.client
  }

  setUseBestBlock(value: boolean) {
    this.useBestBlock = value
  }

  setBlockHeight(value: number) {
    this.blockHeight = value
  }

  setPoolRate(value: Duration) {
    this.poolRate = value
  }

  setRetryOnError(value: boolean | null) {
    this.retryOnError = value
  }
}

export class FinalizedBlockSub {
  constructor(
    private client: Client,
    private pollRate: Duration,
    private nextBlockHeight: number,
    private retryOnError: boolean | null,
    private latestFinalizedHeight: number | null,
    private processedPreviousBlock: boolean,
  ) {}

  async next(): Promise<BlockInfo | AvailError> {
    const latestFinalizedHeight = await this.fetchLatestFinalizedHeight()
    if (latestFinalizedHeight instanceof AvailError) return latestFinalizedHeight

    const indexHistoricalBlock = latestFinalizedHeight >= this.nextBlockHeight
    const result = indexHistoricalBlock ? await this.runHistorical() : await this.runHead()
    if (result instanceof AvailError) return result

    this.nextBlockHeight = result.height + 1
    this.processedPreviousBlock = true
    return result
  }

  async prev(): Promise<BlockInfo | AvailError> {
    if (this.nextBlockHeight > 0) {
      this.nextBlockHeight -= 1
    }

    if (this.processedPreviousBlock == true && this.nextBlockHeight > 0) {
      this.nextBlockHeight -= 1
    }
    this.processedPreviousBlock = false

    return await this.next()
  }

  private async fetchLatestFinalizedHeight(): Promise<number | AvailError> {
    if (this.latestFinalizedHeight != null) return this.latestFinalizedHeight

    const retry = this.retryOnError
    const bh = await this.client.finalized().retryOn(retry).blockHeight()
    if (bh instanceof AvailError) return bh

    this.latestFinalizedHeight = bh
    return bh
  }

  private async runHistorical(): Promise<BlockInfo | AvailError> {
    const retry = this.retryOnError

    const height = this.nextBlockHeight
    const hash = await this.client.chain().retryOn(retry, null).blockHash(height)
    if (hash instanceof AvailError) return hash
    if (hash == null) return new AvailError("Failed to fetch block hash")

    return { height, hash }
  }

  private async runHead(): Promise<BlockInfo | AvailError> {
    const retry = this.retryOnError

    while (true) {
      const ref = await this.client.finalized().blockInfo()
      if (ref instanceof AvailError) return ref

      const isPastBlock = this.nextBlockHeight > ref.height
      if (isPastBlock) {
        await sleep(this.pollRate)
        continue
      }

      if (this.nextBlockHeight == ref.height) {
        return ref
      }

      const height = this.nextBlockHeight
      const hash = await this.client.chain().retryOn(retry, true).blockHash(height)
      if (hash instanceof AvailError) return hash
      if (hash == null) return new AvailError("Failed to fetch block hash")

      return { height, hash }
    }
  }

  shouldRetryOnError(): boolean | null {
    return this.retryOnError
  }

  clientRef(): Client {
    return this.client
  }

  setBlockHeight(value: number) {
    this.nextBlockHeight = value
    this.processedPreviousBlock = false
  }

  setPoolRate(value: Duration) {
    this.pollRate = value
  }

  setRetryOnError(value: boolean | null) {
    this.retryOnError = value
  }
}

export class BestBlockSub {
  constructor(
    private client: Client,
    private pollRate: Duration,
    private currentBlockHeight: number,
    private blockProcessed: H256[],
    private retryOnError: boolean | null,
    private latestFinalizedHeight: number | null,
  ) {}

  async next(): Promise<BlockInfo | AvailError> {
    const latestFinalizedHeight = await this.fetchLatestFinalizedHeight()
    if (latestFinalizedHeight instanceof AvailError) return latestFinalizedHeight

    const indexHistoricalBlock = latestFinalizedHeight > this.currentBlockHeight
    if (indexHistoricalBlock) {
      const result = await this.runHistorical()
      if (result instanceof AvailError) return result

      this.blockProcessed = []
      this.blockProcessed.push(result.hash)
      this.currentBlockHeight = result.height
      return result
    }

    const result = await this.runHead()
    if (result instanceof AvailError) return result

    if (result.height == this.currentBlockHeight) {
      this.blockProcessed.push(result.hash)
    } else {
      this.blockProcessed = []
      this.blockProcessed.push(result.hash)
      this.currentBlockHeight = result.height
    }

    return result
  }

  async prev(): Promise<BlockInfo | AvailError> {
    if (this.currentBlockHeight > 0) {
      this.currentBlockHeight -= 1
    }

    this.blockProcessed = []
    return await this.next()
  }

  private async fetchLatestFinalizedHeight(): Promise<number | AvailError> {
    if (this.latestFinalizedHeight != null) {
      return this.latestFinalizedHeight
    }

    const retry = this.retryOnError
    const bh = await this.client.finalized().retryOn(retry).blockHeight()
    if (bh instanceof AvailError) return bh

    this.latestFinalizedHeight = bh
    return bh
  }

  private async runHistorical(): Promise<BlockInfo | AvailError> {
    const retry = this.retryOnError

    let height = this.currentBlockHeight
    if (this.blockProcessed.length > 0) {
      height += 1
    }

    const hash = await this.client.chain().retryOn(retry, null).blockHash(height)
    if (hash instanceof AvailError) return hash
    if (hash == null) return new AvailError("Failed to fetch block hash")

    return { height, hash }
  }

  private async runHead(): Promise<BlockInfo | AvailError> {
    const retry = this.retryOnError

    while (true) {
      const ref = await this.client.best().retryOn(retry).blockInfo()
      if (ref instanceof AvailError) return ref

      const isPastBlock = this.currentBlockHeight > ref.height
      const blockAlreadyProcessed = this.blockProcessed.findIndex((v) => v.toString() == ref.hash.toString()) != -1
      if (isPastBlock || blockAlreadyProcessed) {
        await sleep(this.pollRate)
        continue
      }

      const noBlockProcessed = this.blockProcessed.length == 0
      if (noBlockProcessed) {
        const hash = await this.client.chain().retryOn(retry, true).blockHash(this.currentBlockHeight)
        if (hash instanceof AvailError) return hash
        if (hash == null) return new AvailError("Failed to fetch block hash")

        return { height: this.currentBlockHeight, hash }
      }

      const isCurrentBlock = this.currentBlockHeight == ref.height
      const isNextBlock = this.currentBlockHeight + 1 == ref.height
      if (isCurrentBlock || isNextBlock) {
        return ref
      }

      const height = this.currentBlockHeight + 1
      const hash = await this.client.chain().retryOn(retry, true).blockHash(height)
      if (hash instanceof AvailError) return hash
      if (hash == null) return new AvailError("Failed to fetch block hash")

      return { height, hash }
    }
  }

  shouldRetryOnError(): boolean | null {
    return this.retryOnError
  }

  clientRef(): Client {
    return this.client
  }

  setBlockHeight(value: number) {
    this.currentBlockHeight = value
    this.blockProcessed = []
  }

  setPoolRate(value: Duration) {
    this.pollRate = value
  }

  setRetryOnError(value: boolean | null) {
    this.retryOnError = value
  }
}
