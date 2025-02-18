import { DispatchClass, DispatchError, Pays, Weight } from "@polkadot/types/interfaces/types"
import { AccountId, BN } from "../.."
import { PALLET_INDEX, PALLET_NAME } from "."
import { EventRecord, palletEventMatch } from "../../events"
import { Struct } from "@polkadot/types-codec";

export interface DispatchFeeModifier extends Struct {
  readonly weightMaximumFee: BN | null;
  readonly weightFeeDivider: BN | null;
  readonly weightFeeMultiplier: BN | null;
}

export interface DispatchInfo extends Struct {
  readonly weight: Weight;
  readonly class: DispatchClass;
  readonly paysFee: Pays;
  readonly feeModifier: DispatchFeeModifier;
}

/// An extrinsic completed successfully.
export class ExtrinsicSuccess {
  constructor(public dispatchInfo: DispatchInfo) { }

  static PALLET_NAME: string = PALLET_NAME
  static PALLET_INDEX: number = PALLET_INDEX
  static EVENT_NAME: string = "ExtrinsicSuccess"
  static EVENT_INDEX: number = 0

  static decode(event: EventRecord): ExtrinsicSuccess | undefined {
    if (!palletEventMatch(event, this)) {
      return undefined
    }

    const info = event.inner.event.data as unknown as DispatchInfo

    return new ExtrinsicSuccess(info)
  }
}

/// An extrinsic failed.
export class ExtrinsicFailed {
  constructor(public dispatchError: DispatchError, public dispatchInfo: DispatchInfo) { }

  static PALLET_NAME: string = PALLET_NAME
  static PALLET_INDEX: number = PALLET_INDEX
  static EVENT_NAME: string = "ExtrinsicFailed"
  static EVENT_INDEX: number = 1

  static decode(event: EventRecord): ExtrinsicFailed | undefined {
    if (!palletEventMatch(event, this)) {
      return undefined
    }

    const [error, info] = event.inner.event.data as unknown as [DispatchError, DispatchInfo]

    return new ExtrinsicFailed(error, info)
  }
}

/// A new account was created.
export class NewAccount {
  constructor(public account: AccountId) { }

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

/// An account was reaped.
export class KilledAccount {
  constructor(public account: string) { }

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
