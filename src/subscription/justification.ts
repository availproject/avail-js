import type { Client } from "../client"
import type { GrandpaJustification, H256 } from "../core/metadata"
import { AvailError } from "../core/error"
import type { Duration } from "../core/utils"
import { Sub } from "./sub"

export interface GrandpaJustificationJsonSubValue {
  value: GrandpaJustification | null
  blockHeight: number
  blockHash: H256
}

export class GrandpaJustificationJsonSub {
  private sub: Sub

  constructor(client: Client) {
    this.sub = new Sub(client)
  }

  async next(): Promise<GrandpaJustificationJsonSubValue | AvailError> {
    const info = await this.sub.next()
    if (info instanceof AvailError) return info

    const just = await this.fetchJustification(info.height)
    if (just instanceof AvailError) {
      this.sub.setBlockHeight(info.height)
      return just
    }

    return { value: just, blockHash: info.hash, blockHeight: info.height }
  }

  async prev(): Promise<GrandpaJustificationJsonSubValue | AvailError> {
    const info = await this.sub.prev()
    if (info instanceof AvailError) return info

    const just = await this.fetchJustification(info.height)
    if (just instanceof AvailError) {
      this.sub.setBlockHeight(info.height)
      return just
    }

    return { value: just, blockHash: info.hash, blockHeight: info.height }
  }

  shouldRetryOnError(): boolean {
    return this.sub.shouldRetryOnError()
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

  private async fetchJustification(height: number): Promise<GrandpaJustification | null | AvailError> {
    const retry = this.sub.shouldRetryOnError()
    const chain = this.sub.clientRef().chain().retryOn(retry, null)
    return await chain.grandpaBlockJustificationJson(height)
  }
}
