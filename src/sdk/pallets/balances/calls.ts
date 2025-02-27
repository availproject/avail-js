import { Transaction } from "../../transaction"
import { Client, BN, Metadata } from "../../."
import { PALLET_NAME, PALLET_INDEX } from "."
import { palletCallMatch } from "../../events"
import { Decoder } from "../../decoder"

export class Calls {
  constructor(private client: Client) { }

  // Transfer some liquid free balance to another account.
  //
  // `transfer_allow_death` will set the `FreeBalance` of the sender and receiver.
  // If the sender's account is below the existential deposit as a result
  // of the transfer, the account will be reaped.
  //
  // The dispatch origin for this call must be `Signed` by the transactor.
  //
  // Checked
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
  //
  // Checked
  transferKeepAlive(dest: string, value: BN): Transaction {
    const tx = this.client.api.tx.balances.transferKeepAlive(dest, value)
    return new Transaction(this.client, tx)
  }

  // Transfer the entire transferable balance from the caller account.
  //
  // NOTE: This function only attempts to transfer _transferable_ balances. This means that
  // any locked, reserved, or existential deposits (when `keep_alive` is `true`), will not be
  // transferred by this function.
  //
  // Checked
  transferAll(dest: string, keepAlive: boolean): Transaction {
    const tx = this.client.api.tx.balances.transferAll(dest, keepAlive)
    return new Transaction(this.client, tx)
  }
}

export class TransferAllowDeath {
  constructor(public dest: Metadata.MultiAddress, public value: BN) { }
  static PALLET_NAME: string = PALLET_NAME
  static PALLET_INDEX: number = PALLET_INDEX
  static CALL_NAME: string = "transferAllowDeath"
  static CALL_INDEX: number = 0

  static decode(palletName: string, callName: string, callData: Uint8Array): TransferKeepAlive | undefined {
    if (!palletCallMatch(palletName, callName, this)) {
      return undefined
    }

    const decoder = new Decoder(callData, 0)
    return new TransferKeepAlive(new Metadata.MultiAddress(decoder), decoder.decodeU128(true))
  }
}

// Checked
export class TransferKeepAlive {
  constructor(public dest: Metadata.MultiAddress, public value: BN) { }
  static PALLET_NAME: string = PALLET_NAME
  static PALLET_INDEX: number = PALLET_INDEX
  static CALL_NAME: string = "transferKeepAlive"
  static CALL_INDEX: number = 3

  static decode(palletName: string, callName: string, callData: Uint8Array): TransferKeepAlive | undefined {
    if (!palletCallMatch(palletName, callName, this)) {
      return undefined
    }

    const decoder = new Decoder(callData, 0)
    return new TransferKeepAlive(new Metadata.MultiAddress(decoder), decoder.decodeU128(true))
  }
}

export class TransferAll {
  constructor(public dest: Metadata.MultiAddress, public keepAlive: boolean) { }
  static PALLET_NAME: string = PALLET_NAME
  static PALLET_INDEX: number = PALLET_INDEX
  static CALL_NAME: string = "transferAll"
  static CALL_INDEX: number = 4

  static decode(palletName: string, callName: string, callData: Uint8Array): TransferAll | undefined {
    if (!palletCallMatch(palletName, callName, this)) {
      return undefined
    }

    const decoder = new Decoder(callData, 0)
    return new TransferAll(new Metadata.MultiAddress(decoder), decoder.decodeU8() == 1)
  }
}