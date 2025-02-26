import { Transaction } from "../../transaction"
import { Client } from "../../."

export class Calls {
  constructor(private client: Client) { }

  // Make some on-chain remark.
  //
  // Checked
  remark(remark: Uint8Array | string): Transaction {
    const tx = this.client.api.tx.system.remark(remark)
    return new Transaction(this.client, tx)
  }

  // Make some on-chain remark and emit event
  //
  // Checked
  remarkWithEvent(remark: Uint8Array | string): Transaction {
    const tx = this.client.api.tx.system.remarkWithEvent(remark)
    return new Transaction(this.client, tx)
  }
}
