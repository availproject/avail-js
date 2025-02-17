import { Metadata, Decoder } from "../.."
import { PALLET_INDEX, PALLET_NAME } from "."
import { EventRecord, palletEventMatch } from "../../events"


/// Batch of dispatches did not complete fully. Index of first failing dispatch given, as well as the error
export class BatchInterrupted {
  constructor(
    public index: number,
    public error: Metadata.DispatchError,
  ) { }

  static PALLET_NAME: string = PALLET_NAME
  static PALLET_INDEX: number = PALLET_INDEX
  static EVENT_NAME: string = "BatchInterrupted"
  static EVENT_INDEX: number = 0

  static decode(event: EventRecord): BatchInterrupted | undefined {
    if (!palletEventMatch(event, this)) {
      return undefined
    }

    const decoder = new Decoder.Decoder(event.inner.event.data.toU8a(), 0)
    return { index: decoder.decodeU32(), error: new Metadata.DispatchError(decoder) }
  }
}

/// Batch of dispatches completed fully with no error.
export class BatchCompleted {
  constructor() { }

  static PALLET_NAME: string = PALLET_NAME
  static PALLET_INDEX: number = PALLET_INDEX
  static EVENT_NAME: string = "BatchCompleted"
  static EVENT_INDEX: number = 1

  static decode(event: EventRecord): BatchCompleted | undefined {
    if (!palletEventMatch(event, this)) {
      return undefined
    }

    return new BatchCompleted()
  }
}

/// Batch of dispatches completed but has errors.
export class BatchCompletedWithErrors {
  constructor() { }

  static PALLET_NAME: string = PALLET_NAME
  static PALLET_INDEX: number = PALLET_INDEX
  static EVENT_NAME: string = "BatchCompletedWithErrors"
  static EVENT_INDEX: number = 2

  static decode(event: EventRecord): BatchCompletedWithErrors | undefined {
    if (!palletEventMatch(event, this)) {
      return undefined
    }

    return new BatchCompletedWithErrors()
  }
}

/// A single item within a Batch of dispatches has completed with no error.
export class ItemCompleted {
  constructor() { }

  static PALLET_NAME: string = PALLET_NAME
  static PALLET_INDEX: number = PALLET_INDEX
  static EVENT_NAME: string = "ItemCompleted"
  static EVENT_INDEX: number = 3

  static decode(event: EventRecord): ItemCompleted | undefined {
    if (!palletEventMatch(event, this)) {
      return undefined
    }

    return new ItemCompleted()
  }
}

/// A single item within a Batch of dispatches has completed with error.
export class ItemFailed {
  constructor(
    public error: Metadata.DispatchError,
  ) { }

  static PALLET_NAME: string = PALLET_NAME
  static PALLET_INDEX: number = PALLET_INDEX
  static EVENT_NAME: string = "ItemFailed"
  static EVENT_INDEX: number = 4

  static decode(event: EventRecord): ItemFailed | undefined {
    if (!palletEventMatch(event, this)) {
      return undefined
    }

    const decoder = new Decoder.Decoder(event.inner.event.data.toU8a(), 0)
    return { error: new Metadata.DispatchError(decoder) }
  }
}

export class DispatchedAs {
  constructor(
    public result: Metadata.DispatchResult,
  ) { }

  static PALLET_NAME: string = PALLET_NAME
  static PALLET_INDEX: number = PALLET_INDEX
  static EVENT_NAME: string = "DispatchedAs"
  static EVENT_INDEX: number = 5

  static decode(event: EventRecord): DispatchedAs | undefined {
    if (!palletEventMatch(event, this)) {
      return undefined
    }

    const decoder = new Decoder.Decoder(event.inner.event.data.toU8a(), 0)
    return { result: new Metadata.DispatchResult(decoder) }
  }
}