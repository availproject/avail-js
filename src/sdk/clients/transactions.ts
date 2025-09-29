import { avail } from ".."
import { SubmittableTransaction } from "../extrinsic"
import { AccountId, BN, H256 } from "../types"
import { HashLike, MultiAddress, MultiAddressValue, Weight } from "../types/metadata"
import { multisig, proxy } from "../types/pallets"
import { Client } from "./main_client"
import { encodeTransactionCallLike, TransactionCallLike } from "../extrinsic/transaction_call"
import { RewardDestinationValue, ValidatorPerfs } from "../types/pallets/staking/types"
import { DataValue, IdentityInfo } from "../types/pallets/identity/types"
import { BondExtraValue, ClaimPermissionValue, PoolStateValue } from "../types/pallets/nomination_pools/types"
import { Hex } from "../utils"

export class TransactionApi {
  constructor(private client: Client) {}

  dataAvailability(): DataAvailability {
    return new DataAvailability(this.client)
  }
  balances(): Balances {
    return new Balances(this.client)
  }
  utility(): Utility {
    return new Utility(this.client)
  }
  multisig(): Multisig {
    return new Multisig(this.client)
  }
  proxy(): Proxy {
    return new Proxy(this.client)
  }
  staking(): Staking {
    return new Staking(this.client)
  }
  identity(): Identity {
    return new Identity(this.client)
  }
  nominationPools(): NominationPools {
    return new NominationPools(this.client)
  }
  sudo(): Sudo {
    return new Sudo(this.client)
  }
  session(): Session {
    return new Session(this.client)
  }
}

export class Session {
  constructor(private client: Client) {}

  setKeys(
    babe: H256 | Uint8Array | string,
    grandpa: H256 | Uint8Array | string,
    authorityDiscovery: H256 | Uint8Array | string,
    imOnline: H256 | Uint8Array | string,
    proof: Uint8Array | string | null,
  ): SubmittableTransaction {
    if (typeof proof == "string") {
      proof = Hex.decodeUnsafe(proof)
    }
    if (proof == null) {
      proof = new Uint8Array()
    }

    const call = new avail.session.tx.SetKeys(
      H256.from(babe, true),
      H256.from(grandpa, true),
      H256.from(authorityDiscovery, true),
      H256.from(imOnline, true),
      proof,
    )
    return SubmittableTransaction.from(this.client, call)
  }

  purgeKeys(): SubmittableTransaction {
    const call = new avail.session.tx.PurgeKeys()
    return SubmittableTransaction.from(this.client, call)
  }
}

export class NominationPools {
  constructor(private client: Client) {}
  bondExtra(value: BondExtraValue): SubmittableTransaction {
    const call = new avail.nominationPools.tx.BondExtra(value)
    return SubmittableTransaction.from(this.client, call)
  }

  bondExtraOther(member: MultiAddress | AccountId | string, value: BondExtraValue): SubmittableTransaction {
    const call = new avail.nominationPools.tx.BondExtraOther(MultiAddress.from(member), value)
    return SubmittableTransaction.from(this.client, call)
  }

  chill(poolId: number): SubmittableTransaction {
    const call = new avail.nominationPools.tx.Chill(poolId)
    return SubmittableTransaction.from(this.client, call)
  }

  claimCommission(poolId: number): SubmittableTransaction {
    const call = new avail.nominationPools.tx.ClaimCommission(poolId)
    return SubmittableTransaction.from(this.client, call)
  }

  claimPayout(): SubmittableTransaction {
    const call = new avail.nominationPools.tx.ClaimPayout()
    return SubmittableTransaction.from(this.client, call)
  }

  claimPayoutOther(owner: AccountId | string): SubmittableTransaction {
    const call = new avail.nominationPools.tx.ClaimPayoutOther(AccountId.from(owner, true))
    return SubmittableTransaction.from(this.client, call)
  }

  create(
    amount: BN,
    root: AccountId | string | MultiAddress,
    nominator: AccountId | string | MultiAddress,
    bouncer: AccountId | string | MultiAddress,
  ): SubmittableTransaction {
    const call = new avail.nominationPools.tx.Create(
      amount,
      MultiAddress.from(root),
      MultiAddress.from(nominator),
      MultiAddress.from(bouncer),
    )
    return SubmittableTransaction.from(this.client, call)
  }

  createWithPoolId(
    amount: BN,
    root: AccountId | string | MultiAddress,
    nominator: AccountId | string | MultiAddress,
    bouncer: AccountId | string | MultiAddress,
    poolId: number,
  ): SubmittableTransaction {
    const call = new avail.nominationPools.tx.CreateWithPoolId(
      amount,
      MultiAddress.from(root),
      MultiAddress.from(nominator),
      MultiAddress.from(bouncer),
      poolId,
    )
    return SubmittableTransaction.from(this.client, call)
  }

  join(amount: BN, poolId: number): SubmittableTransaction {
    const call = new avail.nominationPools.tx.Join(amount, poolId)
    return SubmittableTransaction.from(this.client, call)
  }

  nominate(poolId: number, validators: (AccountId | string)[]): SubmittableTransaction {
    const v: AccountId[] = validators.map((x) => AccountId.from(x, true))
    const call = new avail.nominationPools.tx.Nominate(poolId, v)
    return SubmittableTransaction.from(this.client, call)
  }

  setClaimPermission(permission: ClaimPermissionValue): SubmittableTransaction {
    const call = new avail.nominationPools.tx.SetClaimPermission(permission)
    return SubmittableTransaction.from(this.client, call)
  }

  setCommission(poolId: number, newCommission: [number, AccountId | string] | null): SubmittableTransaction {
    const nc: [number, AccountId] | null = newCommission
      ? [newCommission[0], AccountId.from(newCommission[1], true)]
      : null
    const call = new avail.nominationPools.tx.SetCommission(poolId, nc)
    return SubmittableTransaction.from(this.client, call)
  }

  setCommissionChangeRate(poolId: number, maxIncrease: number, minDelay: number): SubmittableTransaction {
    const call = new avail.nominationPools.tx.SetCommissionChangeRate(poolId, maxIncrease, minDelay)
    return SubmittableTransaction.from(this.client, call)
  }

  setCommissionMax(poolId: number, maxCommission: number): SubmittableTransaction {
    const call = new avail.nominationPools.tx.SetCommissionMax(poolId, maxCommission)
    return SubmittableTransaction.from(this.client, call)
  }

  setMetadata(poolId: number, metadata: string | Uint8Array): SubmittableTransaction {
    if (typeof metadata == "string") {
      metadata = new TextEncoder().encode(metadata)
    }
    const call = new avail.nominationPools.tx.SetMetadata(poolId, metadata)
    return SubmittableTransaction.from(this.client, call)
  }

  setState(poolId: number, state: PoolStateValue): SubmittableTransaction {
    const call = new avail.nominationPools.tx.SetState(poolId, state)
    return SubmittableTransaction.from(this.client, call)
  }

  unbond(memberAccount: MultiAddress | AccountId | string, unbondingPoints: BN): SubmittableTransaction {
    const call = new avail.nominationPools.tx.Unbond(MultiAddress.from(memberAccount), unbondingPoints)
    return SubmittableTransaction.from(this.client, call)
  }

  updateRoles(
    poolId: number,
    newRoot: "Noop" | { Set: AccountId | string } | "Remove",
    newNominator: "Noop" | { Set: AccountId | string } | "Remove",
    newBouncer: "Noop" | { Set: AccountId | string } | "Remove",
  ): SubmittableTransaction {
    let nr: "Noop" | "Remove" | { Set: AccountId } = "Noop"
    let nn: "Noop" | "Remove" | { Set: AccountId } = "Noop"
    let nb: "Noop" | "Remove" | { Set: AccountId } = "Noop"
    if (typeof newRoot != "string") {
      nr = { Set: AccountId.from(newRoot.Set, true) }
    } else {
      nr = newRoot
    }
    if (typeof newNominator != "string") {
      nn = { Set: AccountId.from(newNominator.Set, true) }
    } else {
      nn = newNominator
    }
    if (typeof newBouncer != "string") {
      nb = { Set: AccountId.from(newBouncer.Set, true) }
    } else {
      nb = newBouncer
    }
    const call = new avail.nominationPools.tx.UpdateRoles(poolId, nr, nn, nb)
    return SubmittableTransaction.from(this.client, call)
  }

  withdrawUnbonded(memberAccount: MultiAddress | AccountId | string, numSlashingSpans: number): SubmittableTransaction {
    const call = new avail.nominationPools.tx.WithdrawUnbonded(MultiAddress.from(memberAccount), numSlashingSpans)
    return SubmittableTransaction.from(this.client, call)
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
    const s: [AccountId, DataValue][] = subs.map((x) => [AccountId.from(x[0], true), x[1]])
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
    const call = new avail.staking.tx.ChillOther(AccountId.from(stash, true))
    return SubmittableTransaction.from(this.client, call)
  }

  payoutStakers(validatorStash: string | AccountId, era: number): SubmittableTransaction {
    const call = new avail.staking.tx.PayoutStakers(AccountId.from(validatorStash, true), era)
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
    const call = new avail.staking.tx.ReapStash(AccountId.from(stash, true), numSlashingSpans)
    return SubmittableTransaction.from(this.client, call)
  }

  kick(who: (MultiAddress | string | AccountId | MultiAddressValue)[]): SubmittableTransaction {
    const t = who.map((x) => MultiAddress.from(x))
    const call = new avail.staking.tx.Kick(t)
    return SubmittableTransaction.from(this.client, call)
  }

  forceApplyMinCommission(validatorStash: AccountId | string): SubmittableTransaction {
    const call = new avail.staking.tx.ForceApplyMinCommission(AccountId.from(validatorStash, true))
    return SubmittableTransaction.from(this.client, call)
  }

  payoutStakersByPage(validatorStash: string | AccountId, era: number, page: number): SubmittableTransaction {
    const call = new avail.staking.tx.PayoutStakersByPage(AccountId.from(validatorStash, true), era, page)
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
    const call = new avail.proxy.tx.AddProxy(MultiAddress.from(address), proxyType, delay)
    return SubmittableTransaction.from(this.client, call)
  }

  createPure(proxyType: proxy.types.ProxyTypeValue, delay: number, index: number): SubmittableTransaction {
    const call = new avail.proxy.tx.CreatePure(proxyType, delay, index)
    return SubmittableTransaction.from(this.client, call)
  }

  killPure(
    spawner: MultiAddress | AccountId | string,
    proxyType: proxy.types.ProxyTypeValue,
    index: number,
    height: number,
    extIndex: number,
  ): SubmittableTransaction {
    const call = new avail.proxy.tx.KillPure(MultiAddress.from(spawner), proxyType, index, height, extIndex)
    return SubmittableTransaction.from(this.client, call)
  }

  proxy(
    id: MultiAddress | AccountId | string,
    forceProxyType: proxy.types.ProxyTypeValue | null,
    call: TransactionCallLike,
  ): SubmittableTransaction {
    const encodedCall = encodeTransactionCallLike(call)
    const c = new avail.proxy.tx.Proxy(MultiAddress.from(id), forceProxyType, encodedCall)
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
    const call = new avail.proxy.tx.RemoveProxy(MultiAddress.from(delegate), proxyType, delay)
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
    const ots = otherSignatories.map((x) => AccountId.from(x, true))

    if (typeof callHash === "string") {
      callHash = H256.from(callHash, true)
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
    const ots = otherSignatories.map((x) => AccountId.from(x, true))

    const encodedCall = encodeTransactionCallLike(call)
    const c = new avail.multisig.tx.AsMulti(threshold, ots, maybeTimepoint, encodedCall, maxWeight)
    return SubmittableTransaction.from(this.client, c)
  }

  asMultiThreshold1(otherSignatories: (AccountId | string)[], call: TransactionCallLike): SubmittableTransaction {
    const ots = otherSignatories.map((x) => AccountId.from(x, true))

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
    const ots = otherSignatories.map((x) => AccountId.from(x, true))

    if (typeof callHash === "string") {
      callHash = H256.from(callHash, true)
    }

    const call = new avail.multisig.tx.CancelAsMulti(threshold, ots, timepoint, callHash)
    return SubmittableTransaction.from(this.client, call)
  }
}

export class Sudo {
  constructor(private client: Client) {}

  sudo(call: TransactionCallLike): SubmittableTransaction {
    const c = new avail.sudo.tx.Sudo(encodeTransactionCallLike(call))
    return SubmittableTransaction.from(this.client, c)
  }

  sudoAs(who: MultiAddress | AccountId | string, call: TransactionCallLike): SubmittableTransaction {
    const c = new avail.sudo.tx.SudoAs(MultiAddress.from(who), encodeTransactionCallLike(call))
    return SubmittableTransaction.from(this.client, c)
  }
}
