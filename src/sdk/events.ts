import { EventRecord as PolkaEventRecord } from "@polkadot/types/interfaces/types"
import { Client, H256 } from "."

export class EventRecords {
  public inner: EventRecord[]

  constructor(value: EventRecord[]) {
    this.inner = value
  }

  static new(values: PolkaEventRecord[]): EventRecords {
    let inner = values.map((v) => new EventRecord(v))
    return new EventRecords(inner)
  }


  len(): number {
    return this.inner.length
  }

  iter(): EventRecord[] {
    return this.inner
  }

  find<T>(c: { decode(arg0: EventRecord): T | undefined }): T[] {
    const decoded_events = []

    for (const event of this.inner) {
      const decoded_event = c.decode(event)
      if (decoded_event != null) {
        decoded_events.push(decoded_event)
      }
    }

    return decoded_events
  }


  findFirst<T>(c: { decode(arg0: EventRecord): T | undefined }): T | undefined {
    for (const event of this.inner) {
      const decoded_event = c.decode(event)
      if (decoded_event != null) {
        return decoded_event
      }
    }

    return undefined
  }

  static async fetch(client: Client, blockHash: H256 | string, txIndex?: number): Promise<EventRecords> {
    const storageAt = await client.storageAt(blockHash)
    const eventRecords = (await storageAt.system.events()) as any as PolkaEventRecord[]

    if (txIndex != undefined) {
      return EventRecords.new(eventRecords.filter((e) => {
        return e.phase.isApplyExtrinsic && e.phase.asApplyExtrinsic.toNumber() == txIndex
      }))
    }

    return EventRecords.new(eventRecords)
  }
}

export class EventRecord {
  public inner: PolkaEventRecord

  constructor(value: PolkaEventRecord) {
    this.inner = value
  }

  palletName(): string {
    return this.inner.event.section
  }

  palletIndex(): number {
    return this.inner.event.index[0]
  }

  eventName(): string {
    return this.inner.event.method
  }

  eventIndex(): number {
    return this.inner.event.index[1]
  }

  txIndex(): number | undefined {
    if (!this.inner.phase.isApplyExtrinsic) {
      return undefined
    }

    return this.inner.phase.asApplyExtrinsic.toNumber()
  }

  decode<T>(c: { decode(arg0: EventRecord): T | undefined }): T | undefined {
    return c.decode(this)
  }
}


interface PalletEventMetadata {
  PALLET_NAME: string
  PALLET_INDEX: number
  EVENT_NAME: string
  EVENT_INDEX: number
}

export function palletEventMatch(event: EventRecord, val: PalletEventMetadata): boolean {
  if (event.palletName() != val.PALLET_NAME || event.eventName() != val.EVENT_NAME) {
    return false
  }

  return true
}