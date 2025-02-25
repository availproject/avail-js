import { Transaction } from "../../transaction"
import { Client, Metadata } from "../../."

export class Calls {
  constructor(private client: Client) { }

  asMulti(
    threshold: number,
    otherSignatures: string[],
    timepoint: Metadata.TimepointBlocknumber | null,
    call: string,
    maxWeight: Metadata.Weight,
  ): Transaction {
    const tx = this.client.api.tx.multisig.asMulti(threshold, otherSignatures, timepoint, call, maxWeight)
    return new Transaction(this.client, tx)
  }

  approveAsMulti(
    threshold: number,
    otherSignatures: string[],
    timepoint: Metadata.TimepointBlocknumber | null,
    callHash: string,
    maxWeight: Metadata.Weight,
  ): Transaction {
    const tx = this.client.api.tx.multisig.approveAsMulti(threshold, otherSignatures, timepoint, callHash, maxWeight)
    return new Transaction(this.client, tx)
  }
}
