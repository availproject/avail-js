import { Transaction } from "../../transaction"
import { Client } from "../../."
import { SessionKeys } from "../../metadata"

export class Calls {
  constructor(private client: Client) {}

  // Sets the session key(s) of the function caller to `keys`.
  // Allows an account to set its session key prior to becoming a validator.
  // This doesn't take effect until the next session.
  //
  // Checked
  setKeys(keys: SessionKeys | string, proof: Uint8Array): Transaction {
    keys = keys instanceof SessionKeys ? keys : SessionKeys.fromHex(keys)
    const tx = this.client.api.tx.session.setKeys(keys.toHex(), proof)
    return new Transaction(this.client, tx)
  }

  // Removes any session key(s) of the function caller.
  //
  // This doesn't take effect until the next session.
  //
  // The dispatch origin of this function must be Signed and the account must be either be
  // convertible to a validator ID using the chain's typical addressing system (this usually
  // means being a controller account) or directly convertible into a validator ID (which
  // usually means being a stash account).
  purgeKeys(): Transaction {
    const tx = this.client.api.tx.session.purgeKeys()
    return new Transaction(this.client, tx)
  }
}
