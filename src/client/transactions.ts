import { AccountId, BN, avail } from "../core"
import { Encodable } from "../core/decoded_encoded"
import { HasTxDispatchIndex } from "../core/decoded_transaction"
import { Client } from "./clients"
import { SubmittableTransaction } from "./transaction"
import { GenericExtrinsic } from "@polkadot/types"

export class Transactions {
  private client: Client
  constructor(client: Client) {
    this.client = client
  }

  balances(): Balances {
    return new Balances(this.client)
  }

  utility(): Utility {
    return new Utility(this.client)
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
