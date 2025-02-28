import { Transaction } from "../../transaction"
import { Client } from "../../."
import { SubmittableExtrinsic } from "@polkadot/api/types"

export class Calls {
  constructor(private client: Client) {}

  // Send a batch of dispatch calls.
  //
  // May be called from any origin except `None`.
  //
  // Checked
  batch(calls: SubmittableExtrinsic<"promise">[]): Transaction {
    const tx = this.client.api.tx.utility.batch(calls)
    return new Transaction(this.client, tx)
  }

  // Send a call through an indexed pseudonym of the sender.
  //
  // Filter from origin are passed along. The call will be dispatched with an origin which
  // use the same filter as the origin of this call.
  //
  // NOTE: If you need to ensure that any account-based filtering is not honored (i.e.
  // because you expect `proxy` to have been used prior in the call stack and you do not want
  // the call restrictions to apply to any sub-accounts), then use `as_multi_threshold_1`
  // in the Multisig pallet instead.
  asDerivate(index: number, calls: SubmittableExtrinsic<"promise">[]): Transaction {
    const tx = this.client.api.tx.utility.asDerivate(index, calls)
    return new Transaction(this.client, tx)
  }

  // Send a batch of dispatch calls and atomically execute them.
  // The whole transaction will rollback and fail if any of the calls failed.
  //
  // May be called from any origin except `None`.
  //
  // Checked
  batchAll(calls: SubmittableExtrinsic<"promise">[]): Transaction {
    const tx = this.client.api.tx.utility.batchAll(calls)
    return new Transaction(this.client, tx)
  }

  // Send a batch of dispatch calls.
  // Unlike `batch`, it allows errors and won't interrupt.
  //
  // May be called from any origin except `None`.
  //
  // Checked
  forceBatch(calls: SubmittableExtrinsic<"promise">[]): Transaction {
    const tx = this.client.api.tx.utility.forceBatch(calls)
    return new Transaction(this.client, tx)
  }
}
