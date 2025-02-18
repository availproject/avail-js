import { Transaction } from "../../transaction"
import { Client } from "../../."
import { SessionKeys } from "../../metadata"

export class Calls {
  constructor(private client: Client) { }

  setKeys(keys: SessionKeys | string, proof: Uint8Array): Transaction {
    keys = keys instanceof SessionKeys ? keys : SessionKeys.fromHex(keys)
    const tx = this.client.api.tx.session.setKeys(keys.toHex(), proof)
    return new Transaction(this.client, tx)
  }

  purgeKeys(): Transaction {
    const tx = this.client.api.tx.session.purgeKeys()
    return new Transaction(this.client, tx)
  }
}
