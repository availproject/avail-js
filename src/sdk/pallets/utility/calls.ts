import { Transaction } from "../../transaction"
import { Client, BN } from "../../."
import { SubmittableExtrinsic } from "@polkadot/api/types"

export class Calls {
  constructor(private client: Client) { }

  batch(calls: SubmittableExtrinsic<"promise">[]): Transaction {
    const tx = this.client.api.tx.utility.batch(calls)
    return new Transaction(this.client, tx)
  }
  asDerivate(index: number, calls: SubmittableExtrinsic<"promise">[]): Transaction {
    const tx = this.client.api.tx.utility.asDerivate(index, calls)
    return new Transaction(this.client, tx)
  }
  batchAll(calls: SubmittableExtrinsic<"promise">[]): Transaction {
    const tx = this.client.api.tx.utility.batchAll(calls)
    return new Transaction(this.client, tx)
  }
  forceBatch(calls: SubmittableExtrinsic<"promise">[]): Transaction {
    const tx = this.client.api.tx.utility.forceBatch(calls)
    return new Transaction(this.client, tx)
  }
}
