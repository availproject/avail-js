import { avail } from ".."
import { Encodable, HasPalletInfo } from "../interface"
import { SubmittableTransaction } from "../transaction"
import { AccountId, BN } from "../types"
import { GenericExtrinsic } from "../types/polkadot"
import { Client } from "./main_client"

export class Transactions {
  dataAvailability: DataAvailability
  balances: Balances
  utility: Utility
  constructor(client: Client) {
    this.dataAvailability = new DataAvailability(client)
    this.balances = new Balances(client)
    this.utility = new Utility(client)
  }
}

export class DataAvailability {
  private client: Client
  constructor(client: Client) {
    this.client = client
  }

  createApplicationKey(data: string | Uint8Array): SubmittableTransaction {
    const d = typeof data === "string" ? new TextEncoder().encode(data) : data
    const call = new avail.dataAvailability.tx.CreateApplicationKey(d)
    return SubmittableTransaction.from(this.client, call)
  }

  submitData(data: string | Uint8Array): SubmittableTransaction {
    const d = typeof data === "string" ? new TextEncoder().encode(data) : data
    const call = new avail.dataAvailability.tx.SubmitData(d)
    return SubmittableTransaction.from(this.client, call)
  }
}

export class Balances {
  constructor(private client: Client) {}
  transferAllowDeath(dest: AccountId | string, amount: BN): SubmittableTransaction {
    const destination = dest instanceof AccountId ? dest : AccountId.fromSS58(dest)
    const call = new avail.balances.tx.TransferAllowDeath(destination.toMultiAddress(), amount)
    return SubmittableTransaction.from(this.client, call)
  }

  transferKeepAlive(dest: AccountId | string, amount: BN): SubmittableTransaction {
    const destination = dest instanceof AccountId ? dest : AccountId.fromSS58(dest)
    const call = new avail.balances.tx.TransferKeepAlive(destination.toMultiAddress(), amount)
    return SubmittableTransaction.from(this.client, call)
  }

  transferAll(dest: AccountId | string, keepAlive: boolean): SubmittableTransaction {
    const destination = dest instanceof AccountId ? dest : AccountId.fromSS58(dest)
    const call = new avail.balances.tx.TransferAll(destination.toMultiAddress(), keepAlive)
    return SubmittableTransaction.from(this.client, call)
  }
}

export type CallLike = (Encodable & HasPalletInfo) | SubmittableTransaction | GenericExtrinsic
export class Utility {
  constructor(private client: Client) {}

  batch(calls: CallLike[]): SubmittableTransaction {
    const tx = avail.utility.tx.Batch.create()
    for (const call of calls) {
      if ("call" in call) {
        tx.addGenericExt(call.call)
        continue
      }

      if ("addSignature" in call) {
        tx.addGenericExt(call)
        continue
      }

      tx.addCall(call)
    }

    return SubmittableTransaction.from(this.client, tx)
  }

  batchAll(calls: CallLike[]): SubmittableTransaction {
    const tx = avail.utility.tx.BatchAll.create()
    for (const call of calls) {
      if ("call" in call) {
        tx.addGenericExt(call.call)
        continue
      }

      if ("addSignature" in call) {
        tx.addGenericExt(call)
        continue
      }

      tx.addCall(call)
    }

    return SubmittableTransaction.from(this.client, tx)
  }

  forceBatch(calls: CallLike[]): SubmittableTransaction {
    const tx = avail.utility.tx.ForceBatch.create()
    for (const call of calls) {
      if ("call" in call) {
        tx.addGenericExt(call.call)
        continue
      }

      if ("addSignature" in call) {
        tx.addGenericExt(call)
        continue
      }

      tx.addCall(call)
    }

    return SubmittableTransaction.from(this.client, tx)
  }
}
