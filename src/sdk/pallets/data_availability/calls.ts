import { Transaction } from "../../transaction"
import { Client } from "../../."
import { PALLET_NAME, PALLET_INDEX } from "."
import { palletCallMatch } from "../../events"
import { Decoder } from "../../decoder"

export class Calls {
  constructor(private client: Client) { }

  // Checked
  createApplicationKey(key: string | Uint8Array): Transaction {
    const tx = this.client.api.tx.dataAvailability.createApplicationKey(key)
    return new Transaction(this.client, tx)
  }

  // Checked
  submitData(data: string | Uint8Array): Transaction {
    const tx = this.client.api.tx.dataAvailability.submitData(data)
    return new Transaction(this.client, tx)
  }
}

// Checked
export class CreateApplicationKey {
  constructor(public key: Uint8Array) { }
  static PALLET_NAME: string = PALLET_NAME
  static PALLET_INDEX: number = PALLET_INDEX
  static CALL_NAME: string = "createApplicationKey"
  static CALL_INDEX: number = 0

  static decode(palletName: string, callName: string, callData: Uint8Array): CreateApplicationKey | undefined {
    if (!palletCallMatch(palletName, callName, this)) {
      return undefined
    }

    const decoder = new Decoder(callData, 0)
    return new CreateApplicationKey(decoder.bytesWLen())
  }
}

// Checked
export class SubmitData {
  constructor(public data: Uint8Array) { }
  static PALLET_NAME: string = PALLET_NAME
  static PALLET_INDEX: number = PALLET_INDEX
  static CALL_NAME: string = "submitData"
  static CALL_INDEX: number = 1

  static decode(palletName: string, callName: string, callData: Uint8Array): SubmitData | undefined {
    if (!palletCallMatch(palletName, callName, this)) {
      return undefined
    }

    const decoder = new Decoder(callData, 0)
    return new SubmitData(decoder.bytesWLen())
  }
}