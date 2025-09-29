import { GrandpaJustification } from "./../rpc/grandpa"
import { Client } from "./../clients"
import { ClientError } from "./../error"
import { Duration } from "./../utils"
import { Sub } from "./sub"

export class GrandpaJustificationJsonSub {
  private sub: Sub

  constructor(client: Client) {
    this.sub = new Sub(client)
  }

  async next(): Promise<GrandpaJustification | ClientError> {
    while (true) {
      const info = await this.sub.next()
      if (info instanceof ClientError) return info

      const retry = this.sub.shouldRetryOnError()
      const just = await this.sub.clientRef().rpc().retryOn(retry, null).grandpaBlockJustificationJson(info.height)
      if (just instanceof ClientError) {
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
