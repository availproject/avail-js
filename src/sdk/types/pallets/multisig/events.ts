import { Decoder } from "../../scale"
import ClientError from "../../../error"
import { AccountId, DispatchResult, DispatchResultValue, H256 } from "./../../metadata"
import { addHeader } from "../../../interface"
import { PALLET_ID, types } from "."

/// A new multisig operation has begun.
export class NewMultisig extends addHeader(PALLET_ID, 0) {
  constructor(
    public approving: AccountId,
    public multisig: AccountId,
    public callHash: H256,
  ) {
    super()
  }

  static decode(decoder: Decoder): NewMultisig | ClientError {
    const result = decoder.any3(AccountId, AccountId, H256)
    if (result instanceof ClientError) return result

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

  static decode(decoder: Decoder): MultisigApproval | ClientError {
    const result = decoder.any4(AccountId, types.Timepoint, AccountId, H256)
    if (result instanceof ClientError) return result

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
    public result: DispatchResultValue,
  ) {
    super()
  }

  static decode(decoder: Decoder): MultisigExecuted | ClientError {
    const result = decoder.any5(AccountId, types.Timepoint, AccountId, H256, DispatchResult)
    if (result instanceof ClientError) return result

    return new MultisigExecuted(result[0], result[1], result[2], result[3], result[4].value)
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

  static decode(decoder: Decoder): MultisigCancelled | ClientError {
    const result = decoder.any4(AccountId, types.Timepoint, AccountId, H256)
    if (result instanceof ClientError) return result

    return new MultisigCancelled(...result)
  }
}
