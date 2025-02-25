import { Transaction } from "../../transaction"
import { Client, Metadata } from "../../."

export class Calls {
  constructor(private client: Client) { }

  /// Register approval for a dispatch to be made from a deterministic composite account if
  /// approved by a total of `threshold - 1` of `other_signatories`.
  ///
  /// If there are enough, then dispatch the call.
  ///
  /// Payment: `DepositBase` will be reserved if this is the first approval, plus
  /// `threshold` times `DepositFactor`. It is returned once this dispatch happens or
  /// is cancelled.
  ///
  /// The dispatch origin for this call must be _Signed_.
  ///
  /// - `threshold`: The total number of approvals for this dispatch before it is executed.
  /// - `other_signatories`: The accounts (other than the sender) who can approve this
  /// dispatch. May not be empty.
  /// - `maybe_timepoint`: If this is the first approval, then this must be `None`. If it is
  /// not the first approval, then it must be `Some`, with the timepoint (block number and
  /// transaction index) of the first approval transaction.
  /// - `call`: The call to be executed.
  ///
  /// NOTE: Unless this is the final approval, you will generally want to use
  /// `approve_as_multi` instead, since it only requires a hash of the call.
  ///
  /// Result is equivalent to the dispatched result if `threshold` is exactly `1`. Otherwise
  /// on success, result is `Ok` and the result from the interior call, if it was executed,
  /// may be found in the deposited `MultisigExecuted` event.
  asMulti(
    threshold: number,
    otherSignatures: string[],
    timepoint: Metadata.TimepointBlocknumber | null,
    call: string,
    maxWeight: Metadata.Weight,
  ): Transaction {
    const tx = this.client.api.tx.multisig.asMulti(threshold, otherSignatures, timepoint, call, maxWeight)
    return new Transaction(this.client, tx)
  }

  /// Register approval for a dispatch to be made from a deterministic composite account if
  /// approved by a total of `threshold - 1` of `other_signatories`.
  ///
  /// Payment: `DepositBase` will be reserved if this is the first approval, plus
  /// `threshold` times `DepositFactor`. It is returned once this dispatch happens or
  /// is cancelled.
  ///
  /// The dispatch origin for this call must be _Signed_.
  ///
  /// - `threshold`: The total number of approvals for this dispatch before it is executed.
  /// - `other_signatories`: The accounts (other than the sender) who can approve this
  /// dispatch. May not be empty.
  /// - `maybe_timepoint`: If this is the first approval, then this must be `None`. If it is
  /// not the first approval, then it must be `Some`, with the timepoint (block number and
  /// transaction index) of the first approval transaction.
  /// - `call_hash`: The hash of the call to be executed.
  ///
  /// NOTE: If this is the final approval, you will want to use `as_multi` instead.
  approveAsMulti(
    threshold: number,
    otherSignatures: string[],
    timepoint: Metadata.TimepointBlocknumber | null,
    callHash: string,
    maxWeight: Metadata.Weight,
  ): Transaction {
    const tx = this.client.api.tx.multisig.approveAsMulti(threshold, otherSignatures, timepoint, callHash, maxWeight)
    return new Transaction(this.client, tx)
  }
}
