import ClientError from "../error"
import { HashLike } from "../types/metadata"
import { Filter, Options, Phase } from "./../rpc/system/fetch_events"
import { Client } from "./main_client"

export interface TransactionEvent {
  index: number
  palletId: number
  variantId: number
  data: string
}

export interface BlockEventsOptions {
  filter?: Filter
  enableEncoding?: boolean
  enableDecoding?: boolean
}

export interface PhaseEvents {
  phase: Phase
  events: PhaseEvent[]
}

export interface PhaseEvent {
  index: number
  palletId: number
  variantId: number
  encodedData: string | null
  decodedData: string | null
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
    const filter: Filter = { Only: [txIndex] }
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
  ): Promise<PhaseEvents[] | ClientError> {
    const opt: Options = {
      filter: options?.filter,
      enable_encoding: options?.enableEncoding,
      enable_decoding: options?.enableDecoding,
    }

    const groupedEvents = await this.client.rpc.system.fetchEvents(blockHash, opt, retryOnError)
    if (groupedEvents instanceof ClientError) return groupedEvents

    return groupedEvents.map((v) => {
      const events: PhaseEvent[] = v.events.map((e) => {
        return {
          index: e.index,
          palletId: e.emitted_index[0],
          variantId: e.emitted_index[1],
          encodedData: e.encoded,
          decodedData: e.decoded,
        }
      })

      return { phase: v.phase, events }
    })
  }
}
