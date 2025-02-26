import { Transaction } from "../../transaction"
import { Client } from "../../."
import { PALLET_INDEX, PALLET_NAME } from "."
import { palletCallMatch } from "../../events"
import { Decoder } from "../../decoder"

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


// Checked
export class Remark {
  constructor(public data: Uint8Array) { }
  static PALLET_NAME: string = PALLET_NAME
  static PALLET_INDEX: number = PALLET_INDEX
  static CALL_NAME: string = "remark"
  static CALL_INDEX: number = 0

  static decode(palletName: string, callName: string, callData: Uint8Array): Remark | undefined {
    if (!palletCallMatch(palletName, callName, this)) {
      return undefined
    }

    const decoder = new Decoder(callData, 0)
    const bytes = decoder.bytesWLen()
    decoder.throwOnRemLength()
    return new Remark(bytes)
  }
}

// Checked
export class RemarkWithEvent {
  constructor(public data: Uint8Array) { }
  static PALLET_NAME: string = PALLET_NAME
  static PALLET_INDEX: number = PALLET_INDEX
  static CALL_NAME: string = "remarkWithEvent"
  static CALL_INDEX: number = 7

  static decode(palletName: string, callName: string, callData: Uint8Array): RemarkWithEvent | undefined {
    if (!palletCallMatch(palletName, callName, this)) {
      return undefined
    }

    const decoder = new Decoder(callData, 0)
    const bytes = decoder.bytesWLen()
    decoder.throwOnRemLength()
    return new RemarkWithEvent(bytes)
  }
}