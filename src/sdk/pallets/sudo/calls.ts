import { Transaction } from "../../transaction"
import { Client, AccountId } from "../../."
import { SubmittableExtrinsic } from "@polkadot/api/types"

export class Calls {
  constructor(private client: Client) {}

  // Authenticates the sudo key and dispatches a function call with `Root` origin.
  sudo(call: SubmittableExtrinsic<"promise">): Transaction {
    const tx = this.client.api.tx.sudo.sudo(call)
    return new Transaction(this.client, tx)
  }

  // Authenticates the sudo key and dispatches a function call with `Root` origin.
  // This function does not check the weight of the call, and instead allows the
  // Sudo user to specify the weight of the call.
  //
  // The dispatch origin for this call must be _Signed_.
  sudoUncheckedWeight(call: SubmittableExtrinsic<"promise">): Transaction {
    const tx = this.client.api.tx.sudo.sudoUncheckedWeight(call)
    return new Transaction(this.client, tx)
  }

  // Authenticates the sudo key and dispatches a function call with `Signed` origin from
  // a given account.
  //
  // The dispatch origin for this call must be _Signed_.
  sudoAs(who: string | AccountId, call: SubmittableExtrinsic<"promise">): Transaction {
    const tx = this.client.api.tx.sudo.sudoAs(who.toString(), call)
    return new Transaction(this.client, tx)
  }
}
