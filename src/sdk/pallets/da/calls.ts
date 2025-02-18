import { Transaction } from "../../transaction"
import { Client, Bytes } from "../../."

export class Calls {
  constructor(private client: Client) { }

  createApplicationKey(key: string | Uint8Array): Transaction {
    const tx = this.client.api.tx.dataAvailability.createApplicationKey(key)
    return new Transaction(this.client, tx)
  }

  submitData(data: string | Uint8Array): Transaction {
    const tx = this.client.api.tx.dataAvailability.submitData(data)
    return new Transaction(this.client, tx)
  }
}
