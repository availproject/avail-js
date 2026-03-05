import { addHeader } from "./../../interface"
import { Decoder } from "./../../scale"
import { AccountId, DispatchResult, H256 } from "./../../types"
import { PALLET_ID } from "./header"
import * as types from "./types"
import { AccountIdScale, DispatchResultScale, H256Scale } from "../../scale/types"

/// A new multisig operation has begun.
export class NewMultisig extends addHeader(PALLET_ID, 0) {
  constructor(
    public approving: AccountId,
    public multisig: AccountId,
    public callHash: H256,
  ) {
    super()
  }

  static decode(decoder: Decoder): NewMultisig {
    const result = decoder.any3(AccountIdScale, AccountIdScale, H256Scale)
    return new NewMultisig(...result)
  }
}

/// A multisig operation has been approved by someone.
export class MultisigApproval extends addHeader(PALLET_ID, 1) {
  constructor(
    public approving: AccountId,
    public timepoint: types.Timepoint,
    public multisig: AccountId,
    public callHash: H256,
  ) {
    super()
  }

  static decode(decoder: Decoder): MultisigApproval {
    const result = decoder.any4(AccountIdScale, types.Timepoint, AccountIdScale, H256Scale)
    return new MultisigApproval(...result)
  }
}

/// A multisig operation has been executed.
export class MultisigExecuted extends addHeader(PALLET_ID, 2) {
  constructor(
    public approving: AccountId,
    public timepoint: types.Timepoint,
    public multisig: AccountId,
    public callHash: H256,
    public result: DispatchResult,
  ) {
    super()
  }

  static decode(decoder: Decoder): MultisigExecuted {
    const result = decoder.any5(AccountIdScale, types.Timepoint, AccountIdScale, H256Scale, DispatchResultScale)
    return new MultisigExecuted(result[0], result[1], result[2], result[3], result[4])
  }
}

/// A multisig operation has been cancelled.
export class MultisigCancelled extends addHeader(PALLET_ID, 3) {
  constructor(
    public cancelling: AccountId,
    public timepoint: types.Timepoint,
    public multisig: AccountId,
    public callHash: H256,
  ) {
    super()
  }

  static decode(decoder: Decoder): MultisigCancelled {
    const result = decoder.any4(AccountIdScale, types.Timepoint, AccountIdScale, H256Scale)
    return new MultisigCancelled(...result)
  }
}
