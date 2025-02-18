import { PALLET_INDEX, PALLET_NAME } from "."
import { EventRecord, palletEventMatch } from "../../events"
import { AccountId, H256 } from "../..";
import { Decoder } from "../../decoder";

export class ApplicationKeyCreated {
  constructor(
    public key: Uint8Array,
    public owner: AccountId,
    public id: number,
  ) { }

  static PALLET_NAME: string = PALLET_NAME
  static PALLET_INDEX: number = PALLET_INDEX
  static EVENT_NAME: string = "ApplicationKeyCreated"
  static EVENT_INDEX: number = 0

  static decode(event: EventRecord): ApplicationKeyCreated | undefined {
    if (!palletEventMatch(event, this)) {
      return undefined
    }

    const decoder = new Decoder(event.inner.event.data.toU8a(), 0)
    return new ApplicationKeyCreated(decoder.bytesWLen(), AccountId.decode(decoder), decoder.decodeU32(true))
  }

  keyToString(): string {
    const decoder = new TextDecoder("utf-8");
    return decoder.decode(this.key);
  }
}

export class DataSubmitted {
  constructor(public who: AccountId, public dataHash: H256) { }

  static PALLET_NAME: string = PALLET_NAME
  static PALLET_INDEX: number = PALLET_INDEX
  static EVENT_NAME: string = "DataSubmitted"
  static EVENT_INDEX: number = 1

  static decode(event: EventRecord): DataSubmitted | undefined {
    if (!palletEventMatch(event, this)) {
      return undefined
    }

    const decoder = new Decoder(event.inner.event.data.toU8a(), 0)
    return new DataSubmitted(AccountId.decode(decoder), H256.decode(decoder))
  }
}