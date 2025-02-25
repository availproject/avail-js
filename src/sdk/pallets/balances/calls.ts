import { Transaction } from "../../transaction"
import { Client, BN } from "../../."

export class Calls {
  constructor(private client: Client) { }

  // Transfer some liquid free balance to another account.
  //
  // `transfer_allow_death` will set the `FreeBalance` of the sender and receiver.
  // If the sender's account is below the existential deposit as a result
  // of the transfer, the account will be reaped.
  //
  // The dispatch origin for this call must be `Signed` by the transactor.
  transferAllowDeath(dest: string, value: BN): Transaction {
    const tx = this.client.api.tx.balances.transferAllowDeath(dest, value)
    return new Transaction(this.client, tx)
  }

  // Exactly as `TransferAlowDeath`, except the origin must be root and the source account
  // may be specified.
  forceTransfer(source: string, dest: string, value: BN): Transaction {
    const tx = this.client.api.tx.balances.forceTransfer(source, dest, value)
    return new Transaction(this.client, tx)
  }

  // Same as the `TransferAlowDeath` call, but with a check that the transfer will not
  // kill the origin account.
  transferKeepAlive(dest: string, value: BN): Transaction {
    const tx = this.client.api.tx.balances.transferKeepAlive(dest, value)
    return new Transaction(this.client, tx)
  }

  // Transfer the entire transferable balance from the caller account.
  //
  // NOTE: This function only attempts to transfer _transferable_ balances. This means that
  // any locked, reserved, or existential deposits (when `keep_alive` is `true`), will not be
  // transferred by this function.
  transferAll(dest: string, keepAlive: boolean): Transaction {
    const tx = this.client.api.tx.balances.transferAll(dest, keepAlive)
    return new Transaction(this.client, tx)
  }
}
