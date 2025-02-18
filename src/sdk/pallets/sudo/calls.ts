import { Transaction } from "../../transaction"
import { Client } from "../../."
import { SubmittableExtrinsic } from "@polkadot/api/types"

export class Calls {
  constructor(private client: Client) { }

  sudo(call: SubmittableExtrinsic<"promise">): Transaction {
    const tx = this.client.api.tx.sudo.sudo(call)
    return new Transaction(this.client, tx)
  }

  sudoUncheckedWeight(call: SubmittableExtrinsic<"promise">): Transaction {
    const tx = this.client.api.tx.sudo.sudoUncheckedWeight(call)
    return new Transaction(this.client, tx)
  }
}
