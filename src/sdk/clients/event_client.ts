import { ClientError } from "../error"
import { IEvent, IHeader, IHeaderAndDecodable } from "../interface"
import { H256 } from "../types/metadata"
import { multisig, proxy, system } from "../types/pallets"
import { fetchEvents } from "./../rpc/system"
import { Client } from "./main_client"

export interface TransactionEvent {
  index: number
  palletId: number
  variantId: number
  data: string
}

export class TransactionEvents {
  constructor(public events: TransactionEvent[]) {}

  find<T>(as: IHeaderAndDecodable<T>): T | null
  find<T>(as: IHeaderAndDecodable<T>, unsafe: true): T
  find<T>(as: IHeaderAndDecodable<T>, unsafe?: boolean): T | null {
    const pos = this.events.findIndex((v) => v.palletId == as.palletId() && v.variantId == as.variantId())
    if (pos == -1) throw new Error(`Failed to find event with palletId: ${as.palletId()}, variantId: ${as.variantId()}`)

    const decoded = IEvent.decode(as, this.events[pos].data, true)
    if (decoded instanceof ClientError) {
      if (unsafe === true) {
        throw decoded
      }
      return null
    }

    return decoded
  }

  findAll<T>(as: IHeaderAndDecodable<T>): T[] | ClientError
  findAll<T>(as: IHeaderAndDecodable<T>, unsafe: true): T[]
  findAll<T>(as: IHeaderAndDecodable<T>, unsafe?: boolean): T[] | ClientError {
    const result = []

    for (const event of this.events) {
      if (!(event.palletId == as.palletId() && event.variantId == as.variantId())) {
        continue
      }

      const decoded = IEvent.decode(as, event.data, true)
      if (decoded instanceof ClientError) {
        if (unsafe === true) {
          throw decoded
        } else {
          return decoded
        }
      }

      result.push(decoded)
    }

    return result
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

  isPresent(as: IHeader): boolean
  isPresent(palletId: number, variantId: number): boolean
  isPresent(first: number | IHeader, second?: number): boolean {
    if (typeof first === "number") {
      if (typeof second !== "number") {
        throw new Error("variantId is required when using palletId")
      }

      return this.count(first, second) > 0
    }

    return this.count(first) > 0
  }

  count(as: IHeader): number
  count(palletId: number, variantId: number): number
  count(first: number | IHeader, second?: number): number {
    let palletId = 0
    let variantId = 0

    if (typeof first === "number") {
      if (typeof second !== "number") {
        throw new Error("variantId is required when using palletId")
      }

      palletId = first
      variantId = second
    } else {
      palletId = first.palletId()
      variantId = first.variantId()
    }

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
    blockId: H256 | string | number,
    txIndex: number,
    retryOnError: boolean = true,
  ): Promise<TransactionEvents | null | ClientError> {
    const filter: fetchEvents.Filter = { Only: [txIndex] }
    const result = await this.blockEvents(
      blockId,
      { filter, enableEncoding: true, enableDecoding: false },
      retryOnError,
    )
    if (result instanceof ClientError) return result
    if (result == null) return null

    const events: TransactionEvent[] = []
    for (const event of result.list[0].events) {
      if (event.encodedData == null) {
        return new ClientError("Fetch events endpoint returned an event with no data.")
      }
      events.push({ index: event.index, palletId: event.palletId, variantId: event.variantId, data: event.encodedData })
    }

    return new TransactionEvents(events)
  }

  async blockEvents(
    blockId: H256 | string | number,
    options?: BlockEventsOptions,
    retryOnError: boolean = true,
  ): Promise<BlockEvents | ClientError> {
    if (typeof blockId === "number") {
      const hash = await this.client.blockHash(blockId)
      if (hash instanceof ClientError) return hash
      if (hash == null) return new ClientError("No hash for for that block height")
      blockId = hash
    }

    const result = await this.client.rpc.system.fetchEvents(blockId, options, retryOnError)
    if (result instanceof ClientError) return result

    return new BlockEvents(result)
  }
}
