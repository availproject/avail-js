import { avail } from ".."
import { IEncodableTransactionCall } from "../interface"
import { GenericTransactionCall, SubmittableTransaction } from "../transaction"
import { AccountId, BN, H256 } from "../types"
import { MultiAddress, Weight } from "../types/metadata"
import { GenericExtrinsic } from "../types/polkadot"
import { multisig, proxy } from "../types/pallets"
import { Client } from "./main_client"
import { Hex } from "../utils"
import ClientError from "../error"

export class Transactions {
  dataAvailability: DataAvailability
  balances: Balances
  utility: Utility
  multisig: Multisig
  proxy: Proxy
  constructor(client: Client) {
    this.dataAvailability = new DataAvailability(client)
    this.balances = new Balances(client)
    this.utility = new Utility(client)
    this.multisig = new Multisig(client)
    this.proxy = new Proxy(client)
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

export class Proxy {
  constructor(private client: Client) {}

  addProxy(
    address: MultiAddress | AccountId | string,
    proxyType: proxy.types.ProxyTypeValue,
    delay: number,
  ): SubmittableTransaction {
    if (typeof address == "string") {
      address = MultiAddress.from(AccountId.from(address))
    } else if ("toMultiAddress" in address) {
      address = address.toMultiAddress()
    }

    const call = new avail.proxy.tx.AddProxy(address, new proxy.types.ProxyType(proxyType), delay)
    return SubmittableTransaction.from(this.client, call)
  }

  createPure(proxyType: proxy.types.ProxyTypeValue, delay: number, index: number): SubmittableTransaction {
    const call = new avail.proxy.tx.CreatePure(new proxy.types.ProxyType(proxyType), delay, index)
    return SubmittableTransaction.from(this.client, call)
  }

  killPure(
    spawner: MultiAddress | AccountId | string,
    proxyType: proxy.types.ProxyTypeValue,
    index: number,
    height: number,
    extIndex: number,
  ): SubmittableTransaction {
    if (typeof spawner == "string") {
      spawner = MultiAddress.from(AccountId.from(spawner))
    } else if ("toMultiAddress" in spawner) {
      spawner = spawner.toMultiAddress()
    }

    const call = new avail.proxy.tx.KillPure(spawner, new proxy.types.ProxyType(proxyType), index, height, extIndex)
    return SubmittableTransaction.from(this.client, call)
  }

  proxy(
    id: MultiAddress | AccountId | string,
    forceProxyType: proxy.types.ProxyTypeValue | null,
    call: SubmittableTransaction | GenericExtrinsic | Uint8Array | string,
  ): SubmittableTransaction {
    if (typeof id == "string") {
      id = MultiAddress.from(AccountId.from(id))
    } else if ("toMultiAddress" in id) {
      id = id.toMultiAddress()
    }

    let proxyType = null
    if (forceProxyType != null) {
      proxyType = new proxy.types.ProxyType(forceProxyType)
    }

    if (typeof call == "string") {
      const maybe = Hex.decode(call)
      if (maybe instanceof ClientError) throw maybe
      call = maybe
    } else if ("call" in call) {
      call = call.call.method.toU8a()
    } else if ("toHuman" in call) {
      call = call.method.toU8a()
    }

    const c = new avail.proxy.tx.Proxy(id, proxyType, call)
    return SubmittableTransaction.from(this.client, c)
  }

  removeProxies(): SubmittableTransaction {
    const call = new avail.proxy.tx.RemoveProxies()
    return SubmittableTransaction.from(this.client, call)
  }

  removeProxy(
    delegate: MultiAddress | AccountId | string,
    proxyType: proxy.types.ProxyTypeValue,
    delay: number,
  ): SubmittableTransaction {
    if (typeof delegate == "string") {
      delegate = MultiAddress.from(AccountId.from(delegate))
    } else if ("toMultiAddress" in delegate) {
      delegate = delegate.toMultiAddress()
    }
    const type = new proxy.types.ProxyType(proxyType)

    const call = new avail.proxy.tx.RemoveProxy(delegate, type, delay)
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
