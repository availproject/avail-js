import { avail } from ".."
import { IEncodableTransactionCall } from "../interface"
import { GenericTransactionCall, SubmittableTransaction } from "../transaction"
import { AccountId, BN, H256 } from "../types"
import { Weight } from "../types/metadata"
import { GenericExtrinsic } from "../types/polkadot"
import { multisig } from "../types/pallets"
import { Client } from "./main_client"
import { Hex } from "../utils"
import ClientError from "../error"

export class Transactions {
  dataAvailability: DataAvailability
  balances: Balances
  utility: Utility
  multisig: Multisig
  constructor(client: Client) {
    this.dataAvailability = new DataAvailability(client)
    this.balances = new Balances(client)
    this.utility = new Utility(client)
    this.multisig = new Multisig(client)
  }
}

export class DataAvailability {
  constructor(private client: Client) {}

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

export class Multisig {
  constructor(private client: Client) {}

  approveAsMulti(
    threshold: number,
    otherSignatories: AccountId[] | string[],
    maybeTimepoint: multisig.types.Timepoint | null,
    callHash: H256 | string,
    maxWeight: Weight,
  ): SubmittableTransaction {
    if (otherSignatories.every((x) => typeof x === "string")) {
      otherSignatories = otherSignatories.map((x) => AccountId.from(x))
    }

    if (typeof callHash === "string") {
      callHash = H256.fromUnsafe(callHash)
    }

    const call = new avail.multisig.tx.ApproveAsMulti(threshold, otherSignatories, maybeTimepoint, callHash, maxWeight)
    return SubmittableTransaction.from(this.client, call)
  }

  asMulti(
    threshold: number,
    otherSignatories: AccountId[] | string[],
    maybeTimepoint: multisig.types.Timepoint | null,
    call: GenericTransactionCall | Uint8Array | string,
    maxWeight: Weight,
  ): SubmittableTransaction {
    if (otherSignatories.every((x) => typeof x === "string")) {
      otherSignatories = otherSignatories.map((x) => AccountId.from(x))
    }
    if (typeof call === "string") {
      const maybe = Hex.decode(call)
      if (maybe instanceof ClientError) throw maybe
      call = maybe
    } else if ("data" in call) {
      call = call.encode()
    }

    const c = new avail.multisig.tx.AsMulti(threshold, otherSignatories, maybeTimepoint, call, maxWeight)
    return SubmittableTransaction.from(this.client, c)
  }

  asMultiThreshold1(
    otherSignatories: AccountId[] | string[],
    call: GenericTransactionCall | Uint8Array | string,
  ): SubmittableTransaction {
    if (otherSignatories.every((x) => typeof x === "string")) {
      otherSignatories = otherSignatories.map((x) => AccountId.from(x))
    }

    if (typeof call === "string") {
      const maybe = Hex.decode(call)
      if (maybe instanceof ClientError) throw maybe
      call = maybe
    } else if ("data" in call) {
      call = call.encode()
    }

    const c = new avail.multisig.tx.AsMultiThreshold1(otherSignatories, call)
    return SubmittableTransaction.from(this.client, c)
  }

  cancelAsMulti(
    threshold: number,
    otherSignatories: AccountId[] | string[],
    timepoint: multisig.types.Timepoint,
    callHash: H256 | string,
  ): SubmittableTransaction {
    if (otherSignatories.every((x) => typeof x === "string")) {
      otherSignatories = otherSignatories.map((x) => AccountId.from(x))
    }

    if (typeof callHash === "string") {
      callHash = H256.fromUnsafe(callHash)
    }

    const call = new avail.multisig.tx.CancelAsMulti(threshold, otherSignatories, timepoint, callHash)
    return SubmittableTransaction.from(this.client, call)
  }
}

export class Balances {
  constructor(private client: Client) {}
  transferAllowDeath(dest: AccountId | string, amount: BN): SubmittableTransaction {
    const destination = dest instanceof AccountId ? dest : AccountId.from(dest)
    const call = new avail.balances.tx.TransferAllowDeath(destination.toMultiAddress(), amount)
    return SubmittableTransaction.from(this.client, call)
  }

  transferKeepAlive(dest: AccountId | string, amount: BN): SubmittableTransaction {
    const destination = dest instanceof AccountId ? dest : AccountId.from(dest)
    const call = new avail.balances.tx.TransferKeepAlive(destination.toMultiAddress(), amount)
    return SubmittableTransaction.from(this.client, call)
  }

  transferAll(dest: AccountId | string, keepAlive: boolean): SubmittableTransaction {
    const destination = dest instanceof AccountId ? dest : AccountId.from(dest)
    const call = new avail.balances.tx.TransferAll(destination.toMultiAddress(), keepAlive)
    return SubmittableTransaction.from(this.client, call)
  }
}

export type CallLike = IEncodableTransactionCall | SubmittableTransaction | GenericExtrinsic
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
