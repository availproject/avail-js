import { avail } from ".."
import { SubmittableTransaction } from "../transaction"
import { AccountId, BN, H256 } from "../types"
import { HashLike, MultiAddress, MultiAddressValue, Weight } from "../types/metadata"
import { multisig, proxy } from "../types/pallets"
import { Client } from "./main_client"
import { encodeTransactionCallLike, TransactionCallLike } from "../transaction/transaction_call"
import { RewardDestinationValue, ValidatorPerfs } from "../types/pallets/staking/types"
import { DataValue, IdentityInfo } from "../types/pallets/identity/types"

export class Transactions {
  dataAvailability: DataAvailability
  balances: Balances
  utility: Utility
  multisig: Multisig
  proxy: Proxy
  staking: Staking
  identity: Identity
  constructor(client: Client) {
    this.dataAvailability = new DataAvailability(client)
    this.balances = new Balances(client)
    this.utility = new Utility(client)
    this.multisig = new Multisig(client)
    this.proxy = new Proxy(client)
    this.staking = new Staking(client)
    this.identity = new Identity(client)
  }
}

export class Identity {
  constructor(private client: Client) {}
  addSub(sub: AccountId | MultiAddress | string, data: avail.identity.types.DataValue): SubmittableTransaction {
    const call = new avail.identity.tx.AddSub(MultiAddress.from(sub), data)
    return SubmittableTransaction.from(this.client, call)
  }

  clearIdentity(): SubmittableTransaction {
    const call = new avail.identity.tx.ClearIdentity()
    return SubmittableTransaction.from(this.client, call)
  }

  quitSub(): SubmittableTransaction {
    const call = new avail.identity.tx.QuitSub()
    return SubmittableTransaction.from(this.client, call)
  }

  removeSub(sub: AccountId | MultiAddress | string): SubmittableTransaction {
    const call = new avail.identity.tx.RemoveSub(MultiAddress.from(sub))
    return SubmittableTransaction.from(this.client, call)
  }

  setIdentity(info: IdentityInfo): SubmittableTransaction {
    const call = new avail.identity.tx.SetIdentity(info)
    return SubmittableTransaction.from(this.client, call)
  }

  setSubs(subs: [AccountId | string, DataValue][]): SubmittableTransaction {
    const s: [AccountId, DataValue][] = subs.map((x) => [AccountId.from(x[0]), x[1]])
    const call = new avail.identity.tx.SetSubs(s)
    return SubmittableTransaction.from(this.client, call)
  }
}

export class Staking {
  constructor(private client: Client) {}
  bond(value: BN, rewardDestination: RewardDestinationValue): SubmittableTransaction {
    const call = new avail.staking.tx.Bond(value, rewardDestination)
    return SubmittableTransaction.from(this.client, call)
  }

  bond_extra(value: BN): SubmittableTransaction {
    const call = new avail.staking.tx.BondExtra(value)
    return SubmittableTransaction.from(this.client, call)
  }

  unbond(value: BN): SubmittableTransaction {
    const call = new avail.staking.tx.Unbond(value)
    return SubmittableTransaction.from(this.client, call)
  }

  rebond(value: BN): SubmittableTransaction {
    const call = new avail.staking.tx.Rebond(value)
    return SubmittableTransaction.from(this.client, call)
  }

  validate(commission: number, blocked: boolean): SubmittableTransaction {
    const call = new avail.staking.tx.Validate(new ValidatorPerfs(commission, blocked))
    return SubmittableTransaction.from(this.client, call)
  }

  nominate(targets: (MultiAddress | string | AccountId)[]): SubmittableTransaction {
    const t = targets.map((x) => MultiAddress.from(x))
    const call = new avail.staking.tx.Nominate(t)
    return SubmittableTransaction.from(this.client, call)
  }

  chillOther(stash: string | AccountId): SubmittableTransaction {
    const call = new avail.staking.tx.ChillOther(AccountId.from(stash))
    return SubmittableTransaction.from(this.client, call)
  }

  payoutStakers(validatorStash: string | AccountId, era: number): SubmittableTransaction {
    const call = new avail.staking.tx.PayoutStakers(AccountId.from(validatorStash), era)
    return SubmittableTransaction.from(this.client, call)
  }

  setController(): SubmittableTransaction {
    const call = new avail.staking.tx.SetController()
    return SubmittableTransaction.from(this.client, call)
  }

  setPayee(payee: RewardDestinationValue): SubmittableTransaction {
    const call = new avail.staking.tx.SetPayee(payee)
    return SubmittableTransaction.from(this.client, call)
  }

  chill(): SubmittableTransaction {
    const call = new avail.staking.tx.Chill()
    return SubmittableTransaction.from(this.client, call)
  }

  withdrawUnbonded(numSlashingSpans: number): SubmittableTransaction {
    const call = new avail.staking.tx.WithdrawUnbonded(numSlashingSpans)
    return SubmittableTransaction.from(this.client, call)
  }

  reapStash(stash: AccountId | string, numSlashingSpans: number): SubmittableTransaction {
    const call = new avail.staking.tx.ReapStash(AccountId.from(stash), numSlashingSpans)
    return SubmittableTransaction.from(this.client, call)
  }

  kick(targets: (MultiAddress | string | AccountId | MultiAddressValue)[]): SubmittableTransaction {
    const t = targets.map((x) => MultiAddress.from(x))
    const call = new avail.staking.tx.Kick(t)
    return SubmittableTransaction.from(this.client, call)
  }

  forceApplyMinCommission(validatorStash: AccountId | string): SubmittableTransaction {
    const call = new avail.staking.tx.ForceApplyMinCommission(AccountId.from(validatorStash))
    return SubmittableTransaction.from(this.client, call)
  }

  payoutStakersByPage(validatorStash: string | AccountId, era: number, page: number): SubmittableTransaction {
    const call = new avail.staking.tx.PayoutStakersByPage(AccountId.from(validatorStash), era, page)
    return SubmittableTransaction.from(this.client, call)
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

export class Balances {
  constructor(private client: Client) {}
  transferAllowDeath(dest: AccountId | string | MultiAddress, amount: BN): SubmittableTransaction {
    const call = new avail.balances.tx.TransferAllowDeath(MultiAddress.from(dest), amount)
    return SubmittableTransaction.from(this.client, call)
  }

  transferKeepAlive(dest: AccountId | string | MultiAddress, amount: BN): SubmittableTransaction {
    const call = new avail.balances.tx.TransferKeepAlive(MultiAddress.from(dest), amount)
    return SubmittableTransaction.from(this.client, call)
  }

  transferAll(dest: AccountId | string | MultiAddress, keepAlive: boolean): SubmittableTransaction {
    const call = new avail.balances.tx.TransferAll(MultiAddress.from(dest), keepAlive)
    return SubmittableTransaction.from(this.client, call)
  }
}

export class Utility {
  constructor(private client: Client) {}

  batch(calls: TransactionCallLike[]): SubmittableTransaction {
    const tx = avail.utility.tx.Batch.create()
    for (const call of calls) {
      tx.push(encodeTransactionCallLike(call))
    }

    return SubmittableTransaction.from(this.client, tx)
  }

  batchAll(calls: TransactionCallLike[]): SubmittableTransaction {
    const tx = avail.utility.tx.BatchAll.create()
    for (const call of calls) {
      tx.push(encodeTransactionCallLike(call))
    }

    return SubmittableTransaction.from(this.client, tx)
  }

  forceBatch(calls: TransactionCallLike[]): SubmittableTransaction {
    const tx = avail.utility.tx.ForceBatch.create()
    for (const call of calls) {
      tx.push(encodeTransactionCallLike(call))
    }

    return SubmittableTransaction.from(this.client, tx)
  }
}

export class Proxy {
  constructor(private client: Client) {}

  addProxy(
    address: MultiAddress | AccountId | string,
    proxyType: proxy.types.ProxyTypeValue,
    delay: number,
  ): SubmittableTransaction {
    const call = new avail.proxy.tx.AddProxy(MultiAddress.from(address), new proxy.types.ProxyType(proxyType), delay)
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
    const call = new avail.proxy.tx.KillPure(
      MultiAddress.from(spawner),
      new proxy.types.ProxyType(proxyType),
      index,
      height,
      extIndex,
    )
    return SubmittableTransaction.from(this.client, call)
  }

  proxy(
    id: MultiAddress | AccountId | string,
    forceProxyType: proxy.types.ProxyTypeValue | null,
    call: TransactionCallLike,
  ): SubmittableTransaction {
    let proxyType = null
    if (forceProxyType != null) {
      proxyType = new proxy.types.ProxyType(forceProxyType)
    }

    const encodedCall = encodeTransactionCallLike(call)
    const c = new avail.proxy.tx.Proxy(MultiAddress.from(id), proxyType, encodedCall)
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
    const type = new proxy.types.ProxyType(proxyType)
    const call = new avail.proxy.tx.RemoveProxy(MultiAddress.from(delegate), type, delay)
    return SubmittableTransaction.from(this.client, call)
  }
}

export class Multisig {
  constructor(private client: Client) {}

  approveAsMulti(
    threshold: number,
    otherSignatories: (AccountId | string)[],
    maybeTimepoint: multisig.types.Timepoint | null,
    callHash: HashLike,
    maxWeight: Weight,
  ): SubmittableTransaction {
    const ots = otherSignatories.map((x) => AccountId.from(x))

    if (typeof callHash === "string") {
      callHash = H256.fromUnsafe(callHash)
    }

    const call = new avail.multisig.tx.ApproveAsMulti(threshold, ots, maybeTimepoint, callHash, maxWeight)
    return SubmittableTransaction.from(this.client, call)
  }

  asMulti(
    threshold: number,
    otherSignatories: (AccountId | string)[],
    maybeTimepoint: multisig.types.Timepoint | null,
    call: TransactionCallLike,
    maxWeight: Weight,
  ): SubmittableTransaction {
    const ots = otherSignatories.map((x) => AccountId.from(x))

    const encodedCall = encodeTransactionCallLike(call)
    const c = new avail.multisig.tx.AsMulti(threshold, ots, maybeTimepoint, encodedCall, maxWeight)
    return SubmittableTransaction.from(this.client, c)
  }

  asMultiThreshold1(otherSignatories: (AccountId | string)[], call: TransactionCallLike): SubmittableTransaction {
    const ots = otherSignatories.map((x) => AccountId.from(x))

    const encodedCall = encodeTransactionCallLike(call)
    const c = new avail.multisig.tx.AsMultiThreshold1(ots, encodedCall)
    return SubmittableTransaction.from(this.client, c)
  }

  cancelAsMulti(
    threshold: number,
    otherSignatories: (AccountId | string)[],
    timepoint: multisig.types.Timepoint,
    callHash: HashLike,
  ): SubmittableTransaction {
    const ots = otherSignatories.map((x) => AccountId.from(x))

    if (typeof callHash === "string") {
      callHash = H256.fromUnsafe(callHash)
    }

    const call = new avail.multisig.tx.CancelAsMulti(threshold, ots, timepoint, callHash)
    return SubmittableTransaction.from(this.client, call)
  }
}
