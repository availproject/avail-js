import { GeneralError, H256 } from "./../../core"
import { Client } from "./main_client"
import { fetchEventsTypes as Types } from "./../../core/rpc/system"

export class EventClient {
  private client: Client
  constructor(client: Client) {
    this.client = client
  }

  public async transactionEvents(
    blockHash: H256 | string,
    txIndex: number,
    enableEncoding?: boolean,
    enableDecoding?: boolean,
  ): Promise<Types.RuntimeEvent[] | null | GeneralError> {
    const filter: Types.Filter = { Only: [txIndex] }
    const result = await this.blockEvents(blockHash, filter, enableEncoding, enableDecoding)
    if (result instanceof GeneralError) {
      return result
    }

    if (result == null) {
      return null
    }

    return result[0].events
  }

  public async blockEvents(
    blockHash: H256 | string,
    filter: Types.Filter | null,
    enableEncoding?: boolean | null,
    enableDecoding?: boolean | null,
  ): Promise<Types.GroupedRuntimeEvents[] | GeneralError> {
    const rpc = this.client.rpc
    return await rpc.systemFetchEvents(blockHash, filter, enableEncoding, enableDecoding)
  }
}
