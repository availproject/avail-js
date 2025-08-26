import ClientError from "../error"
import { H256 } from "../types"
import { fetchEventsTypes as Types } from "./../rpc/system"
import { Client } from "./main_client"

export interface TransactionEvent {
  index: number
  palletId: number
  variantId: number
  data: string
}

export class EventClient {
  private client: Client
  constructor(client: Client) {
    this.client = client
  }

  async transactionEvents(
    blockHash: H256 | string,
    txIndex: number,
    retryOnError: boolean = true,
  ): Promise<TransactionEvent[] | null | ClientError> {
    const filter: Types.Filter = { Only: [txIndex] }
    const result = await this.blockEvents(
      blockHash,
      { filter, enableEncoding: true, enableDecoding: false },
      retryOnError,
    )
    if (result instanceof ClientError) return result
    if (result == null) return null

    const events: TransactionEvent[] = []
    for (let event of result[0].events) {
      if (event.encoded == null) {
        return new ClientError("Fetch events endpoint return an event with no data.")
      }
      events.push({ index: event.index, palletId: event.palletId, variantId: event.variantId, data: event.encoded })
    }

    return events
  }

  async blockEvents(
    blockHash: H256 | string,
    options?: BlockEventsOptions,
    retryOnError: boolean = true,
  ): Promise<GroupedRuntimeEvents[] | ClientError> {
    const opt: Types.Options = {
      filter: options?.filter,
      enable_encoding: options?.enableEncoding,
      enable_decoding: options?.enableDecoding,
    }

    const groupedEvents = await this.client.rpc.system.fetchEvents(blockHash, opt, retryOnError)
    if (groupedEvents instanceof ClientError) return groupedEvents

    return groupedEvents.map((v) => {
      const events: RuntimeEvent[] = v.events.map((e) => {
        return {
          index: e.index,
          palletId: e.emitted_index[0],
          variantId: e.emitted_index[1],
          encoded: e.encoded,
          decoded: e.decoded,
        }
      })

      return { phase: v.phase, events }
    })
  }
}

export interface BlockEventsOptions {
  filter?: Types.Filter
  enableEncoding?: boolean
  enableDecoding?: boolean
}

export interface RuntimeEvent {
  index: number
  palletId: number
  variantId: number
  encoded: string | null
  decoded: string | null
}

export interface GroupedRuntimeEvents {
  phase: Types.Phase
  events: RuntimeEvent[]
}
