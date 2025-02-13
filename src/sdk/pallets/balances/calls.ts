import { Transaction } from "../../transaction"
import { Client, BN } from "../../."

export class Calls {
  constructor(private client: Client) { }

  transferAll(dest: string, keepAlive: boolean): Transaction {
    const tx = this.client.api.tx.balances.transferAll(dest, keepAlive)
    return new Transaction(this.client, tx)
  }
  transferAllowDeath(dest: string, value: BN): Transaction {
    const tx = this.client.api.tx.balances.transferAllowDeath(dest, value)
    return new Transaction(this.client, tx)
  }
  transferKeepAlive(dest: string, value: BN): Transaction {
    const tx = this.client.api.tx.balances.transferKeepAlive(dest, value)
    return new Transaction(this.client, tx)
  }
}
