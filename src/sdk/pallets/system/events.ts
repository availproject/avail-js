import { AccountId } from "../.."
import { PALLET_INDEX, PALLET_NAME } from "."
import { EventRecord, palletEventMatch } from "../../events"
import { DispatchInfo, DispatchError, H256 } from "../../metadata"
import { Decoder } from "../../decoder"

// An extrinsic completed successfully.
//
// Checked
export class ExtrinsicSuccess {
  constructor(public dispatchInfo: DispatchInfo) {}

  static PALLET_NAME: string = PALLET_NAME
  static PALLET_INDEX: number = PALLET_INDEX
  static EVENT_NAME: string = "ExtrinsicSuccess"
  static EVENT_INDEX: number = 0

  static decode(event: EventRecord): ExtrinsicSuccess | undefined {
    if (!palletEventMatch(event, this)) {
      return undefined
    }

    const decoder = new Decoder(event.inner.event.data.toU8a(), 0)
    const dispatchInfo = new DispatchInfo(decoder)
    decoder.throwOnRemLength()

    return new ExtrinsicSuccess(dispatchInfo)
  }
}

// An extrinsic failed.
//
// Checked
export class ExtrinsicFailed {
  constructor(
    public dispatchError: DispatchError,
    public dispatchInfo: DispatchInfo,
  ) {}

  static PALLET_NAME: string = PALLET_NAME
  static PALLET_INDEX: number = PALLET_INDEX
  static EVENT_NAME: string = "ExtrinsicFailed"
  static EVENT_INDEX: number = 1

  static decode(event: EventRecord): ExtrinsicFailed | undefined {
    if (!palletEventMatch(event, this)) {
      return undefined
    }

    const decoder = new Decoder(event.inner.event.data.toU8a(), 0)
    const error = new DispatchError(decoder)
    const info = new DispatchInfo(decoder)
    decoder.throwOnRemLength()

    return new ExtrinsicFailed(error, info)
  }
}

// A new account was created.
//
// Checked
export class NewAccount {
  constructor(public account: AccountId) {}

  static PALLET_NAME: string = PALLET_NAME
  static PALLET_INDEX: number = PALLET_INDEX
  static EVENT_NAME: string = "NewAccount"
  static EVENT_INDEX: number = 3

  static decode(event: EventRecord): NewAccount | undefined {
    if (!palletEventMatch(event, this)) {
      return undefined
    }

    return new NewAccount(new AccountId(event.inner.event.data.toU8a()))
  }
}

// An account was reaped.
//
// Checked
export class KilledAccount {
  constructor(public account: AccountId) {}

  static PALLET_NAME: string = PALLET_NAME
  static PALLET_INDEX: number = PALLET_INDEX
  static EVENT_NAME: string = "KilledAccount"
  static EVENT_INDEX: number = 4

  static decode(event: EventRecord): NewAccount | undefined {
    if (!palletEventMatch(event, this)) {
      return undefined
    }

    return new NewAccount(new AccountId(event.inner.event.data.toU8a()))
  }
}

// On on-chain remark happened
//
// Checked
export class Remarked {
  constructor(
    public account: AccountId,
    public hash: H256,
  ) {}

  static PALLET_NAME: string = PALLET_NAME
  static PALLET_INDEX: number = PALLET_INDEX
  static EVENT_NAME: string = "Remarked"
  static EVENT_INDEX: number = 5

  static decode(event: EventRecord): Remarked | undefined {
    if (!palletEventMatch(event, this)) {
      return undefined
    }

    const decoder = new Decoder(event.inner.event.data.toU8a(), 0)
    const account = AccountId.decode(decoder)
    const hash = H256.decode(decoder)
    decoder.throwOnRemLength()

    return new Remarked(account, hash)
  }
}
