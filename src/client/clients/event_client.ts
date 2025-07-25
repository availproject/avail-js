import { Core } from "./../index"
import { Client } from "./main_client"
import { fetchEventsV1Types as Types } from "./../../core/rpc/system"

export class EventClient {
  private client: Client
  constructor(client: Client) {
    this.client = client
  }

  public async transactionEvents(
    blockHash: Core.H256 | string,
    txIndex: number,
    enableEncoding?: boolean,
    enableDecoding?: boolean,
  ): Promise<Types.RuntimeEvent[] | null> {
    const filter: Types.Filter = { Only: [txIndex] }
    const groupe = await this.blockEvents(blockHash, filter, enableEncoding, enableDecoding)
    if (groupe.length == 0) {
      return null
    }

    return groupe[0].events
  }

  public async blockEvents(
    blockHash: Core.H256 | string,
    filter: Types.Filter | null,
    enableEncoding?: boolean | null,
    enableDecoding?: boolean | null,
  ): Promise<Types.GroupedRuntimeEvents[]> {
    const rpc = this.client.rpcApi()
    return await rpc.systemFetchEventsV1(blockHash, filter, enableEncoding, enableDecoding)
  }
}
