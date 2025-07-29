import { AccountId, BN, avail, Encodable, HasTxDispatchIndex, GenericExtrinsic } from "../core"
import { Client } from "./clients"
import { SubmittableTransaction } from "./transaction"

export class Transactions {
  private client: Client
  constructor(client: Client) {
    this.client = client
  }

  dataAvailability(): DataAvailability {
    return new DataAvailability(this.client)
  }

  balances(): Balances {
    return new Balances(this.client)
  }

  utility(): Utility {
    return new Utility(this.client)
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
    return SubmittableTransaction.fromCall(this.client, call)
  }

  submitData(data: string | Uint8Array): SubmittableTransaction {
    const d = typeof data === "string" ? new TextEncoder().encode(data) : data
    const call = new avail.dataAvailability.tx.SubmitData(d)
    return SubmittableTransaction.fromCall(this.client, call)
  }
}

export class Balances {
  private client: Client
  constructor(client: Client) {
    this.client = client
  }
  transferAllowDeath(dest: AccountId | string, amount: BN): SubmittableTransaction {
    const destination = dest instanceof AccountId ? dest : AccountId.fromSS58(dest)
    const call = new avail.balances.tx.TransferAllowDeath(destination.toMultiAddress(), amount)
    return SubmittableTransaction.fromCall(this.client, call)
  }

  transferKeepAlive(dest: AccountId | string, amount: BN): SubmittableTransaction {
    const destination = dest instanceof AccountId ? dest : AccountId.fromSS58(dest)
    const call = new avail.balances.tx.TransferKeepAlive(destination.toMultiAddress(), amount)
    return SubmittableTransaction.fromCall(this.client, call)
  }

  transferAll(dest: AccountId | string, keepAlive: boolean): SubmittableTransaction {
    const destination = dest instanceof AccountId ? dest : AccountId.fromSS58(dest)
    const call = new avail.balances.tx.TransferAll(destination.toMultiAddress(), keepAlive)
    return SubmittableTransaction.fromCall(this.client, call)
  }
}

export class Utility {
  private client: Client
  constructor(client: Client) {
    this.client = client
  }

  batch(
    calls: ((Encodable & HasTxDispatchIndex) | SubmittableTransaction | GenericExtrinsic)[],
  ): SubmittableTransaction {
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

    return SubmittableTransaction.fromCall(this.client, tx)
  }

  batchAll(
    calls: ((Encodable & HasTxDispatchIndex) | SubmittableTransaction | GenericExtrinsic)[],
  ): SubmittableTransaction {
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

    return SubmittableTransaction.fromCall(this.client, tx)
  }

  forceBatch(
    calls: ((Encodable & HasTxDispatchIndex) | SubmittableTransaction | GenericExtrinsic)[],
  ): SubmittableTransaction {
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

    return SubmittableTransaction.fromCall(this.client, tx)
  }
}
