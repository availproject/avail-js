import { ApiPromise } from "@polkadot/api"
import { Weight } from "@polkadot/types/interfaces/types"
import { Transaction } from "./../transaction"
import { Client } from "../client"

export interface MultisigTimepoint {
  height: number
  index: number
}

export class Multisig {
  private client: Client

  constructor(client: Client) {
    this.client = client
  }

  asMulti(
    threshold: number,
    otherSignatures: string[],
    timepoint: MultisigTimepoint | null,
    call: string,
    maxWeight: Weight,
  ): Transaction {
    const tx = this.client.api.tx.multisig.asMulti(threshold, otherSignatures, timepoint, call, maxWeight)
    return new Transaction(this.client, tx)
  }

  approveAsMulti(
    threshold: number,
    otherSignatures: string[],
    timepoint: MultisigTimepoint | null,
    callHash: string,
    maxWeight: Weight,
  ): Transaction {
    const tx = this.client.api.tx.multisig.approveAsMulti(threshold, otherSignatures, timepoint, callHash, maxWeight)
    return new Transaction(this.client, tx)
  }
}
