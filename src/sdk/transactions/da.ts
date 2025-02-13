import { ApiPromise } from "@polkadot/api"
import { BN } from "@polkadot/util"
import { Bytes } from "@polkadot/types-codec"
import { Transaction } from "../transaction"
import { Client } from "../client"

export type DispatchFeeModifier = {
  weightMaximumFee: BN | null
  weightFeeDivider: number | null
  weightFeeMultiplier: number | null
}

export class DataAvailability {
  private client: Client

  constructor(client: Client) {
    this.client = client
  }

  submitData(data: string | Bytes): Transaction {
    const tx = this.client.api.tx.dataAvailability.submitData(data)
    return new Transaction(this.client, tx)
  }

  createApplicationKey(key: string): Transaction {
    const tx = this.client.api.tx.dataAvailability.createApplicationKey(key)
    return new Transaction(this.client, tx)
  }
}
