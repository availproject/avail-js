import { Client, Duration, AvailError, GrandpaJustification } from ".."
import { Sub } from "./sub"

export class GrandpaJustificationJsonSub {
  private sub: Sub

  constructor(client: Client) {
    this.sub = new Sub(client)
  }

  async next(): Promise<GrandpaJustification | AvailError> {
    while (true) {
      const info = await this.sub.next()
      if (info instanceof AvailError) return info

      const retry = this.sub.shouldRetryOnError()
      const just = await this.sub.clientRef().chain().retryOn(retry, null).grandpaBlockJustificationJson(info.height)
      if (just instanceof AvailError) {
        this.sub.setBlockHeight(info.height)
        return just
      }

      if (just == null) {
        continue
      }

      return just
    }
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
}
