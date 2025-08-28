import { ClientError } from "../error"
import { IEvent, IHeader, IHeaderAndDecodable } from "../interface"
import { HashLike } from "../types/metadata"
import { multisig, proxy, system } from "../types/pallets"
import { fetchEvents } from "./../rpc/system"
import { Client } from "./main_client"

export interface TransactionEvent {
  index: number
  palletId: number
  variantId: number
  data: string
}

export class TransactionsWithEvents {
  constructor(public events: TransactionEvent[]) {}

  find<T>(as: IHeaderAndDecodable<T>): T | null {
    const pos = this.events.findIndex((v) => v.palletId == as.palletId() && v.variantId == as.variantId())
    if (pos == -1) return null

    return IEvent.decode(as, this.events[pos].data)
  }

  findUnsafe<T>(as: IHeaderAndDecodable<T>): T {
    const pos = this.events.findIndex((v) => v.palletId == as.palletId() && v.variantId == as.variantId())
    if (pos == -1) throw new Error(`Failed to find event with palletId: ${as.palletId()}, variantId: ${as.variantId()}`)

    const decoded = IEvent.decode(as, this.events[pos].data)
    if (decoded == null)
      throw new Error(`Failed to decode event with palletId: ${as.palletId()}, variantId: ${as.variantId()}`)

    return decoded
  }

  isExtrinsicSuccessPresent(): boolean {
    return this.isPresent(system.events.ExtrinsicSuccess)
  }

  isExtrinsicFailedPresent(): boolean {
    return this.isPresent(system.events.ExtrinsicFailed)
  }

  proxyExecutedSuccessfully(): boolean | null {
    const executed = this.find(proxy.events.ProxyExecuted)
    if (executed == null) return null
    return executed.result == "Ok"
  }

  multisigExecutedSuccessfully(): boolean | null {
    const executed = this.find(multisig.events.MultisigExecuted)
    if (executed == null) return null
    return executed.result == "Ok"
  }

  isPresent(as: IHeader): boolean {
    return this.count(as) > 0
  }

  isPresentParts(palletId: number, variantId: number): boolean {
    return this.countParts(palletId, variantId) > 0
  }

  count(as: IHeader): number {
    let count = 0
    this.events.forEach((e) => {
      if (e.palletId == as.palletId() && e.variantId == as.variantId()) {
        count += 1
      }
    })

    return count
  }

  countParts(palletId: number, variantId: number): number {
    let count = 0
    this.events.forEach((e) => {
      if (e.palletId == palletId && e.variantId == variantId) {
        count += 1
      }
    })

    return count
  }
}

export class BlockEvents {
  constructor(public list: fetchEvents.PhaseEvents[]) {}
}

export interface BlockEventsOptions {
  filter?: fetchEvents.Filter
  enableEncoding?: boolean
  enableDecoding?: boolean
}

export class EventClient {
  constructor(private client: Client) {}

  async transactionEvents(
    blockHash: HashLike,
    txIndex: number,
    retryOnError: boolean = true,
  ): Promise<TransactionsWithEvents | null | ClientError> {
    const filter: fetchEvents.Filter = { Only: [txIndex] }
    const result = await this.blockEvents(
      blockHash,
      { filter, enableEncoding: true, enableDecoding: false },
      retryOnError,
    )
    if (result instanceof ClientError) return result
    if (result == null) return null

    const events: TransactionEvent[] = []
    for (const event of result.list[0].events) {
      if (event.encodedData == null) {
        return new ClientError("Fetch events endpoint return an event with no data.")
      }
      events.push({ index: event.index, palletId: event.palletId, variantId: event.variantId, data: event.encodedData })
    }

    return new TransactionsWithEvents(events)
  }

  async blockEvents(
    blockHash: HashLike,
    options?: BlockEventsOptions,
    retryOnError: boolean = true,
  ): Promise<BlockEvents | ClientError> {
    const result = await this.client.rpc.system.fetchEvents(blockHash, options, retryOnError)
    if (result instanceof ClientError) return result

    return new BlockEvents(result)
  }
}
