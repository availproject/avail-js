import { Decoder, AccountId, H256 } from "../.."
import { PALLET_INDEX, PALLET_NAME } from "."
import { EventRecord, palletEventMatch } from "../../events"
import { DispatchResult, TimepointBlocknumber } from "../../metadata"

// A new multisig operation has begun.
//
// Checked
export class NewMultisig {
  constructor(
    public approving: AccountId,
    public multisig: AccountId,
    public callHash: H256
  ) { }

  static PALLET_NAME: string = PALLET_NAME
  static PALLET_INDEX: number = PALLET_INDEX
  static EVENT_NAME: string = "NewMultisig"
  static EVENT_INDEX: number = 0

  static decode(event: EventRecord): NewMultisig | undefined {
    if (!palletEventMatch(event, this)) {
      return undefined
    }

    const decoder = new Decoder.Decoder(event.inner.event.data.toU8a(), 0)
    const approving = AccountId.decode(decoder)
    const multisig = AccountId.decode(decoder)
    const callHash = H256.decode(decoder)
    decoder.throwOnRemLength()

    return new NewMultisig(approving, multisig, callHash)
  }
}

// A multisig operation has been approved by someone.
//
// Checked
export class MultisigApproval {
  constructor(
    public approving: AccountId,
    public timepoint: TimepointBlocknumber,
    public multisig: AccountId,
    public callHash: H256
  ) { }

  static PALLET_NAME: string = PALLET_NAME
  static PALLET_INDEX: number = PALLET_INDEX
  static EVENT_NAME: string = "MultisigApproval"
  static EVENT_INDEX: number = 1

  static decode(event: EventRecord): MultisigApproval | undefined {
    if (!palletEventMatch(event, this)) {
      return undefined
    }

    const decoder = new Decoder.Decoder(event.inner.event.data.toU8a(), 0)
    const approving = AccountId.decode(decoder)
    const timepoint = TimepointBlocknumber.decode(decoder)
    const multisig = AccountId.decode(decoder)
    const callHash = H256.decode(decoder)
    decoder.throwOnRemLength()

    return new MultisigApproval(approving, timepoint, multisig, callHash)
  }
}

// A multisig operation has been executed.
//
// Checked
export class MultisigExecuted {
  constructor(
    public approving: AccountId,
    public timepoint: TimepointBlocknumber,
    public multisig: AccountId,
    public callHash: H256,
    public result: DispatchResult
  ) { }

  static PALLET_NAME: string = PALLET_NAME
  static PALLET_INDEX: number = PALLET_INDEX
  static EVENT_NAME: string = "MultisigExecuted"
  static EVENT_INDEX: number = 2

  static decode(event: EventRecord): MultisigExecuted | undefined {
    if (!palletEventMatch(event, this)) {
      return undefined
    }

    const decoder = new Decoder.Decoder(event.inner.event.data.toU8a(), 0)
    const approving = AccountId.decode(decoder)
    const timepoint = TimepointBlocknumber.decode(decoder)
    const multisig = AccountId.decode(decoder)
    const callHash = H256.decode(decoder)
    const result = new DispatchResult(decoder)
    decoder.throwOnRemLength()

    return new MultisigExecuted(approving, timepoint, multisig, callHash, result)
  }
}

// A multisig operation has been cancelled.
export class MultisigCancelled {
  constructor(
    public cancelling: AccountId,
    public timepoint: TimepointBlocknumber,
    public multisig: AccountId,
    public callHash: H256,
  ) { }

  static PALLET_NAME: string = PALLET_NAME
  static PALLET_INDEX: number = PALLET_INDEX
  static EVENT_NAME: string = "MultisigCancelled"
  static EVENT_INDEX: number = 3

  static decode(event: EventRecord): MultisigCancelled | undefined {
    if (!palletEventMatch(event, this)) {
      return undefined
    }

    const decoder = new Decoder.Decoder(event.inner.event.data.toU8a(), 0)
    return new MultisigCancelled(AccountId.decode(decoder), TimepointBlocknumber.decode(decoder), AccountId.decode(decoder), H256.decode(decoder))
  }
}

