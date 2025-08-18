import { GeneralError, H256 } from "./../../core"
import { Client } from "./main_client"
import { fetchEventsTypes as Types } from "./../../core/rpc/system"

export class EventClient {
  private client: Client
  constructor(client: Client) {
    this.client = client
  }

  async transactionEvents(
    blockHash: H256 | string,
    txIndex: number,
    enableEncoding?: boolean,
    enableDecoding?: boolean,
    retryOnError: boolean = true,
  ): Promise<Types.RuntimeEvent[] | null | GeneralError> {
    const filter: Types.Filter = { Only: [txIndex] }
    const result = await this.blockEvents(
      blockHash,
      { filter, enable_encoding: enableEncoding, enable_decoding: enableDecoding },
      retryOnError,
    )
    if (result instanceof GeneralError) {
      return result
    }

    if (result == null) {
      return null
    }

    return result[0].events
  }

  async blockEvents(
    blockHash: H256 | string,
    options?: Types.Options,
    retryOnError: boolean = true,
  ): Promise<Types.GroupedRuntimeEvents[] | GeneralError> {
    return await this.client.rpc.system.fetchEvents(blockHash, options, retryOnError)
  }
}
