import { AccountId, H256, } from "@polkadot/types/interfaces/types"
import { PALLET_INDEX, PALLET_NAME } from "."
import { EventRecord, palletEventMatch } from "../../events"
import { Bytes, Compact, u32 } from "@polkadot/types-codec";

export class ApplicationKeyCreated {
  constructor(
    public key: Bytes,
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

    const [key, owner, id] = event.inner.event.data as unknown as [Bytes, AccountId, Compact<u32>]

    return new ApplicationKeyCreated(key, owner, id.toNumber())
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

    const [who, dataHash] = event.inner.event.data as unknown as [AccountId, H256]

    return new DataSubmitted(who, dataHash)
  }
}