import ClientError from "../error"
import { HashLike } from "../types/metadata"
import { fetchEvents } from "./../rpc/system"
import { Client } from "./main_client"

export interface TransactionEvent {
  index: number
  palletId: number
  variantId: number
  data: string
}

export interface BlockEventsOptions {
  filter?: fetchEvents.Filter
  enableEncoding?: boolean
  enableDecoding?: boolean
}

export class EventClient {
  private client: Client
  constructor(client: Client) {
    this.client = client
  }

  async transactionEvents(
    blockHash: HashLike,
    txIndex: number,
    retryOnError: boolean = true,
  ): Promise<TransactionEvent[] | null | ClientError> {
    const filter: fetchEvents.Filter = { Only: [txIndex] }
    const result = await this.blockEvents(
      blockHash,
      { filter, enableEncoding: true, enableDecoding: false },
      retryOnError,
    )
    if (result instanceof ClientError) return result
    if (result == null) return null

    const events: TransactionEvent[] = []
    for (const event of result[0].events) {
      if (event.encodedData == null) {
        return new ClientError("Fetch events endpoint return an event with no data.")
      }
      events.push({ index: event.index, palletId: event.palletId, variantId: event.variantId, data: event.encodedData })
    }

    return events
  }

  async blockEvents(
    blockHash: HashLike,
    options?: BlockEventsOptions,
    retryOnError: boolean = true,
  ): Promise<fetchEvents.PhaseEvents[] | ClientError> {
    const opt: fetchEvents.Options = {
      filter: options?.filter,
      enable_encoding: options?.enableEncoding,
      enable_decoding: options?.enableDecoding,
    }

    return await this.client.rpc.system.fetchEvents(blockHash, opt, retryOnError)
  }
}
