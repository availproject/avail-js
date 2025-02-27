import { PALLET_INDEX, PALLET_NAME } from "."
import { EventRecord, palletEventMatch } from "../../events"
import { DispatchResult } from "../../metadata";
import { Decoder } from "../../decoder";

// A sudo call just took place.
export class Sudid {
  constructor(public sudoResult: DispatchResult) { }

  static PALLET_NAME: string = PALLET_NAME
  static PALLET_INDEX: number = PALLET_INDEX
  static EVENT_NAME: string = "Sudid"
  static EVENT_INDEX: number = 0

  static decode(event: EventRecord): Sudid | undefined {
    if (!palletEventMatch(event, this)) {
      return undefined
    }

    const decoder = new Decoder(event.inner.event.data.toU8a(true), 0)
    return new Sudid(new DispatchResult(decoder))
  }
}

// A sudo call just took place.
export class SudoAsDone {
  constructor(public sudoResult: DispatchResult) { }

  static PALLET_NAME: string = PALLET_NAME
  static PALLET_INDEX: number = PALLET_INDEX
  static EVENT_NAME: string = "SudoAsDone"
  static EVENT_INDEX: number = 3

  static decode(event: EventRecord): SudoAsDone | undefined {
    if (!palletEventMatch(event, this)) {
      return undefined
    }

    const decoder = new Decoder(event.inner.event.data.toU8a(true), 0)
    return new SudoAsDone(new DispatchResult(decoder))
  }
}
