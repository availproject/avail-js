import type { BN } from "./core/polkadot"
import { avail } from "./core"
import { AccountId, H256, MultiAddress, type MultiAddressValue, type Weight } from "./core/metadata"
import type { ProxyTypeValue } from "./core/pallets/proxy/types"
import type { Timepoint } from "./core/pallets/multisig/types"
import { SubmittableTransaction, type ExtrinsicLike, encodeTransactionCallLike } from "./submission/submittable"
import type { Client } from "./client/client"
import { NotFoundError } from "./errors/sdk-error"
import { ErrorOperation } from "./errors/operations"
import { unwrapAvail as unwrapLegacy } from "./internal/result/unwrap"

function dynamicRuntimeTx(client: Client, pallet: string, method: string, args: unknown[]): SubmittableTransaction {
  const txRoot = client.api().tx as Record<string, unknown>
  const palletValue = txRoot[pallet]
  if (typeof palletValue !== "object" || palletValue == null) {
    throw new NotFoundError(`Missing runtime pallet '${pallet}'`, {
      operation: ErrorOperation.RuntimeTxLookup,
      details: { pallet },
    })
  }

  const methodValue = (palletValue as Record<string, unknown>)[method]
  if (typeof methodValue !== "function") {
    throw new NotFoundError(`Missing runtime call '${pallet}.${method}'`, {
      operation: ErrorOperation.RuntimeTxLookup,
      details: { pallet, method },
    })
  }

  const call = (methodValue as (...params: unknown[]) => unknown)(...args)
  if (typeof call !== "object" || call == null) {
    throw new NotFoundError(`Runtime call '${pallet}.${method}' returned no call object`, {
      operation: ErrorOperation.RuntimeTxLookup,
      details: { pallet, method },
    })
  }

  const runtimeMethod = (call as { method?: { toU8a?: () => Uint8Array } }).method
  if (runtimeMethod == null || typeof runtimeMethod.toU8a !== "function") {
    throw new NotFoundError(`Runtime call '${pallet}.${method}' missing method bytes`, {
      operation: ErrorOperation.RuntimeTxLookup,
      details: { pallet, method },
    })
  }

  return SubmittableTransaction.from(client, runtimeMethod.toU8a())
}

export class TransactionApi {
  constructor(private readonly client: Client) {}

  dataAvailability(): DataAvailabilityApi {
    return new DataAvailabilityApi(this.client)
  }

  balances(): BalancesApi {
    return new BalancesApi(this.client)
  }

  utility(): UtilityApi {
    return new UtilityApi(this.client)
  }

  proxy(): ProxyApi {
    return new ProxyApi(this.client)
  }

  multisig(): MultisigApi {
    return new MultisigApi(this.client)
  }

  session(): SessionApi {
    return new SessionApi(this.client)
  }

  nominationPools(): NominationPoolsApi {
    return new NominationPoolsApi(this.client)
  }

  staking(): StakingApi {
    return new StakingApi(this.client)
  }

  system(): SystemApi {
    return new SystemApi(this.client)
  }

  vector(): VectorApi {
    return new VectorApi(this.client)
  }
}

class DataAvailabilityApi {
  constructor(private readonly client: Client) {}

  createApplicationKey(data: string | Uint8Array): SubmittableTransaction {
    const payload = typeof data === "string" ? new TextEncoder().encode(data) : data
    return SubmittableTransaction.from(this.client, new avail.dataAvailability.tx.CreateApplicationKey(payload))
  }

  submitData(appId: number, data: string | Uint8Array): SubmittableTransaction {
    const payload = typeof data === "string" ? new TextEncoder().encode(data) : data
    return SubmittableTransaction.from(this.client, new avail.dataAvailability.tx.SubmitData(appId, payload))
  }

  submitBlobMetadata(
    appId: number,
    blobHash: H256 | string,
    size: number,
    commitments: Uint8Array,
    evalPointSeed: Uint8Array | null,
    evalClaim: Uint8Array | null,
  ): SubmittableTransaction {
    const hash = typeof blobHash === "string" ? unwrapLegacy(H256.from(blobHash, true)) : blobHash
    return dynamicRuntimeTx(this.client, "dataAvailability", "submitBlobMetadata", [
      appId,
      hash,
      size,
      commitments,
      evalPointSeed,
      evalClaim,
    ])
  }
}

class BalancesApi {
  constructor(private readonly client: Client) {}

  transferKeepAlive(dest: AccountId | string | MultiAddress, amount: BN): SubmittableTransaction {
    return SubmittableTransaction.from(
      this.client,
      new avail.balances.tx.TransferKeepAlive(MultiAddress.from(dest), amount),
    )
  }

  transferAllowDeath(dest: AccountId | string | MultiAddress, amount: BN): SubmittableTransaction {
    return SubmittableTransaction.from(
      this.client,
      new avail.balances.tx.TransferAllowDeath(MultiAddress.from(dest), amount),
    )
  }

  transferAll(dest: AccountId | string | MultiAddress, keepAlive: boolean): SubmittableTransaction {
    return SubmittableTransaction.from(
      this.client,
      new avail.balances.tx.TransferAll(MultiAddress.from(dest), keepAlive),
    )
  }
}

class UtilityApi {
  constructor(private readonly client: Client) {}

  batch(calls: ExtrinsicLike[]): SubmittableTransaction {
    const tx = avail.utility.tx.Batch.create()
    for (const call of calls) {
      tx.push(encodeTransactionCallLike(call))
    }
    return SubmittableTransaction.from(this.client, tx)
  }

  batchAll(calls: ExtrinsicLike[]): SubmittableTransaction {
    const tx = avail.utility.tx.BatchAll.create()
    for (const call of calls) {
      tx.push(encodeTransactionCallLike(call))
    }
    return SubmittableTransaction.from(this.client, tx)
  }

  forceBatch(calls: ExtrinsicLike[]): SubmittableTransaction {
    const tx = avail.utility.tx.ForceBatch.create()
    for (const call of calls) {
      tx.push(encodeTransactionCallLike(call))
    }
    return SubmittableTransaction.from(this.client, tx)
  }
}

class ProxyApi {
  constructor(private readonly client: Client) {}

  proxy(
    id: AccountId | string | MultiAddress,
    forceProxyType: ProxyTypeValue | null,
    call: ExtrinsicLike,
  ): SubmittableTransaction {
    return SubmittableTransaction.from(
      this.client,
      new avail.proxy.tx.Proxy(MultiAddress.from(id), forceProxyType, encodeTransactionCallLike(call)),
    )
  }

  addProxy(id: AccountId | string | MultiAddress, proxyType: ProxyTypeValue, delay: number): SubmittableTransaction {
    return SubmittableTransaction.from(
      this.client,
      new avail.proxy.tx.AddProxy(MultiAddress.from(id), proxyType, delay),
    )
  }

  removeProxy(
    delegate: AccountId | string | MultiAddress,
    proxyType: ProxyTypeValue,
    delay: number,
  ): SubmittableTransaction {
    return SubmittableTransaction.from(
      this.client,
      new avail.proxy.tx.RemoveProxy(MultiAddress.from(delegate), proxyType, delay),
    )
  }

  removeProxies(): SubmittableTransaction {
    return SubmittableTransaction.from(this.client, new avail.proxy.tx.RemoveProxies())
  }

  createPure(proxyType: ProxyTypeValue, delay: number, index: number): SubmittableTransaction {
    return SubmittableTransaction.from(this.client, new avail.proxy.tx.CreatePure(proxyType, delay, index))
  }

  killPure(
    spawner: AccountId | string | MultiAddress,
    proxyType: ProxyTypeValue,
    index: number,
    height: number,
    extIndex: number,
  ): SubmittableTransaction {
    return SubmittableTransaction.from(
      this.client,
      new avail.proxy.tx.KillPure(MultiAddress.from(spawner), proxyType, index, height, extIndex),
    )
  }
}

class MultisigApi {
  constructor(private readonly client: Client) {}

  approveAsMulti(
    threshold: number,
    otherSignatories: (AccountId | string)[],
    maybeTimepoint: Timepoint | null,
    callHash: string,
    maxWeight: Weight,
  ): SubmittableTransaction {
    const signatories = otherSignatories.map((value) => AccountId.from(value, true))
    const hash = unwrapLegacy(H256.from(callHash, true))
    return SubmittableTransaction.from(
      this.client,
      new avail.multisig.tx.ApproveAsMulti(threshold, signatories, maybeTimepoint, hash, maxWeight),
    )
  }

  asMulti(
    threshold: number,
    otherSignatories: (AccountId | string)[],
    maybeTimepoint: Timepoint | null,
    call: ExtrinsicLike,
    maxWeight: Weight,
  ): SubmittableTransaction {
    const signatories = otherSignatories.map((value) => AccountId.from(value, true))
    const encodedCall = encodeTransactionCallLike(call)
    return SubmittableTransaction.from(
      this.client,
      new avail.multisig.tx.AsMulti(threshold, signatories, maybeTimepoint, encodedCall, maxWeight),
    )
  }

  asMultiThreshold1(otherSignatories: (AccountId | string)[], call: ExtrinsicLike): SubmittableTransaction {
    const signatories = otherSignatories.map((value) => AccountId.from(value, true))
    return SubmittableTransaction.from(
      this.client,
      new avail.multisig.tx.AsMultiThreshold1(signatories, encodeTransactionCallLike(call)),
    )
  }

  cancelAsMulti(
    threshold: number,
    otherSignatories: (AccountId | string)[],
    timepoint: Timepoint,
    callHash: string,
  ): SubmittableTransaction {
    const signatories = otherSignatories.map((value) => AccountId.from(value, true))
    const hash = unwrapLegacy(H256.from(callHash, true))
    return SubmittableTransaction.from(
      this.client,
      new avail.multisig.tx.CancelAsMulti(threshold, signatories, timepoint, hash),
    )
  }
}

class SessionApi {
  constructor(private readonly client: Client) {}

  setKeys(
    babe: string,
    grandpa: string,
    authorityDiscovery: string,
    imOnline: string,
    proof: string | Uint8Array,
  ): SubmittableTransaction {
    const proofValue = typeof proof === "string" ? new TextEncoder().encode(proof) : proof
    return SubmittableTransaction.from(
      this.client,
      new avail.session.tx.SetKeys(
        unwrapLegacy(H256.from(babe, true)),
        unwrapLegacy(H256.from(grandpa, true)),
        unwrapLegacy(H256.from(authorityDiscovery, true)),
        unwrapLegacy(H256.from(imOnline, true)),
        proofValue,
      ),
    )
  }

  purgeKeys(): SubmittableTransaction {
    return SubmittableTransaction.from(this.client, new avail.session.tx.PurgeKeys())
  }
}

class NominationPoolsApi {
  constructor(private readonly client: Client) {}

  bondExtra(value: avail.nominationPools.types.BondExtraValue): SubmittableTransaction {
    return SubmittableTransaction.from(this.client, new avail.nominationPools.tx.BondExtra(value))
  }

  bondExtraOther(
    member: MultiAddressValue | AccountId | string,
    value: avail.nominationPools.types.BondExtraValue,
  ): SubmittableTransaction {
    return SubmittableTransaction.from(
      this.client,
      new avail.nominationPools.tx.BondExtraOther(MultiAddress.from(member), value),
    )
  }

  chill(poolId: number): SubmittableTransaction {
    return SubmittableTransaction.from(this.client, new avail.nominationPools.tx.Chill(poolId))
  }

  claimCommission(poolId: number): SubmittableTransaction {
    return SubmittableTransaction.from(this.client, new avail.nominationPools.tx.ClaimCommission(poolId))
  }

  claimPayout(): SubmittableTransaction {
    return SubmittableTransaction.from(this.client, new avail.nominationPools.tx.ClaimPayout())
  }

  claimPayoutOther(owner: AccountId | string): SubmittableTransaction {
    return SubmittableTransaction.from(
      this.client,
      new avail.nominationPools.tx.ClaimPayoutOther(AccountId.from(owner, true)),
    )
  }

  create(
    amount: BN,
    root: AccountId | string | MultiAddressValue,
    nominator: AccountId | string | MultiAddressValue,
    bouncer: AccountId | string | MultiAddressValue,
  ): SubmittableTransaction {
    return SubmittableTransaction.from(
      this.client,
      new avail.nominationPools.tx.Create(
        amount,
        MultiAddress.from(root),
        MultiAddress.from(nominator),
        MultiAddress.from(bouncer),
      ),
    )
  }

  createWithPoolId(
    amount: BN,
    root: AccountId | string | MultiAddressValue,
    nominator: AccountId | string | MultiAddressValue,
    bouncer: AccountId | string | MultiAddressValue,
    poolId: number,
  ): SubmittableTransaction {
    return SubmittableTransaction.from(
      this.client,
      new avail.nominationPools.tx.CreateWithPoolId(
        amount,
        MultiAddress.from(root),
        MultiAddress.from(nominator),
        MultiAddress.from(bouncer),
        poolId,
      ),
    )
  }

  join(amount: BN, poolId: number): SubmittableTransaction {
    return SubmittableTransaction.from(this.client, new avail.nominationPools.tx.Join(amount, poolId))
  }

  nominate(poolId: number, validators: (AccountId | string)[]): SubmittableTransaction {
    const v = validators.map((value) => AccountId.from(value, true))
    return SubmittableTransaction.from(this.client, new avail.nominationPools.tx.Nominate(poolId, v))
  }

  setClaimPermission(permission: avail.nominationPools.types.ClaimPermissionValue): SubmittableTransaction {
    return SubmittableTransaction.from(this.client, new avail.nominationPools.tx.SetClaimPermission(permission))
  }

  setCommission(poolId: number, newCommission: [number, AccountId | string] | null): SubmittableTransaction {
    const nc: [number, AccountId] | null =
      newCommission == null ? null : [newCommission[0], AccountId.from(newCommission[1], true)]
    return SubmittableTransaction.from(this.client, new avail.nominationPools.tx.SetCommission(poolId, nc))
  }

  setCommissionChangeRate(poolId: number, maxIncrease: number, minDelay: number): SubmittableTransaction {
    return SubmittableTransaction.from(
      this.client,
      new avail.nominationPools.tx.SetCommissionChangeRate(poolId, maxIncrease, minDelay),
    )
  }

  setCommissionMax(poolId: number, maxCommission: number): SubmittableTransaction {
    return SubmittableTransaction.from(
      this.client,
      new avail.nominationPools.tx.SetCommissionMax(poolId, maxCommission),
    )
  }

  setMetadata(poolId: number, metadata: string | Uint8Array): SubmittableTransaction {
    const value = typeof metadata === "string" ? new TextEncoder().encode(metadata) : metadata
    return SubmittableTransaction.from(this.client, new avail.nominationPools.tx.SetMetadata(poolId, value))
  }

  setState(poolId: number, state: avail.nominationPools.types.PoolStateValue): SubmittableTransaction {
    return SubmittableTransaction.from(this.client, new avail.nominationPools.tx.SetState(poolId, state))
  }

  unbond(memberAccount: MultiAddressValue | AccountId | string, unbondingPoints: BN): SubmittableTransaction {
    return SubmittableTransaction.from(
      this.client,
      new avail.nominationPools.tx.Unbond(MultiAddress.from(memberAccount), unbondingPoints),
    )
  }

  updateRoles(
    poolId: number,
    newRoot: "Noop" | { Set: AccountId | string } | "Remove",
    newNominator: "Noop" | { Set: AccountId | string } | "Remove",
    newBouncer: "Noop" | { Set: AccountId | string } | "Remove",
  ): SubmittableTransaction {
    const nr = typeof newRoot === "string" ? newRoot : { Set: AccountId.from(newRoot.Set, true) }
    const nn = typeof newNominator === "string" ? newNominator : { Set: AccountId.from(newNominator.Set, true) }
    const nb = typeof newBouncer === "string" ? newBouncer : { Set: AccountId.from(newBouncer.Set, true) }
    return SubmittableTransaction.from(this.client, new avail.nominationPools.tx.UpdateRoles(poolId, nr, nn, nb))
  }

  withdrawUnbonded(memberAccount: MultiAddress | AccountId | string, numSlashingSpans: number): SubmittableTransaction {
    return SubmittableTransaction.from(
      this.client,
      new avail.nominationPools.tx.WithdrawUnbonded(MultiAddress.from(memberAccount), numSlashingSpans),
    )
  }
}

class StakingApi {
  constructor(private readonly client: Client) {}

  bond(value: BN, rewardDestination: avail.staking.types.RewardDestinationValue): SubmittableTransaction {
    return SubmittableTransaction.from(this.client, new avail.staking.tx.Bond(value, rewardDestination))
  }

  bondExtra(value: BN): SubmittableTransaction {
    return SubmittableTransaction.from(this.client, new avail.staking.tx.BondExtra(value))
  }

  unbond(value: BN): SubmittableTransaction {
    return SubmittableTransaction.from(this.client, new avail.staking.tx.Unbond(value))
  }

  rebond(value: BN): SubmittableTransaction {
    return SubmittableTransaction.from(this.client, new avail.staking.tx.Rebond(value))
  }

  validate(commission: number, blocked: boolean): SubmittableTransaction {
    return SubmittableTransaction.from(
      this.client,
      new avail.staking.tx.Validate(new avail.staking.types.ValidatorPerfs(commission, blocked)),
    )
  }

  nominate(targets: (MultiAddressValue | string | AccountId)[]): SubmittableTransaction {
    const t = targets.map((value) => MultiAddress.from(value))
    return SubmittableTransaction.from(this.client, new avail.staking.tx.Nominate(t))
  }

  chillOther(stash: string | AccountId): SubmittableTransaction {
    return SubmittableTransaction.from(this.client, new avail.staking.tx.ChillOther(AccountId.from(stash, true)))
  }

  payoutStakers(validatorStash: string | AccountId, era: number): SubmittableTransaction {
    return SubmittableTransaction.from(
      this.client,
      new avail.staking.tx.PayoutStakers(AccountId.from(validatorStash, true), era),
    )
  }

  setController(): SubmittableTransaction {
    return SubmittableTransaction.from(this.client, new avail.staking.tx.SetController())
  }

  setPayee(payee: avail.staking.types.RewardDestinationValue): SubmittableTransaction {
    return SubmittableTransaction.from(this.client, new avail.staking.tx.SetPayee(payee))
  }

  chill(): SubmittableTransaction {
    return SubmittableTransaction.from(this.client, new avail.staking.tx.Chill())
  }

  withdrawUnbonded(numSlashingSpans: number): SubmittableTransaction {
    return SubmittableTransaction.from(this.client, new avail.staking.tx.WithdrawUnbonded(numSlashingSpans))
  }

  reapStash(stash: AccountId | string, numSlashingSpans: number): SubmittableTransaction {
    return SubmittableTransaction.from(
      this.client,
      new avail.staking.tx.ReapStash(AccountId.from(stash, true), numSlashingSpans),
    )
  }

  kick(who: (MultiAddress | string | AccountId | MultiAddressValue)[]): SubmittableTransaction {
    const t = who.map((value) => MultiAddress.from(value))
    return SubmittableTransaction.from(this.client, new avail.staking.tx.Kick(t))
  }

  forceApplyMinCommission(validatorStash: AccountId | string): SubmittableTransaction {
    return SubmittableTransaction.from(
      this.client,
      new avail.staking.tx.ForceApplyMinCommission(AccountId.from(validatorStash, true)),
    )
  }

  payoutStakersByPage(validatorStash: string | AccountId, era: number, page: number): SubmittableTransaction {
    return SubmittableTransaction.from(
      this.client,
      new avail.staking.tx.PayoutStakersByPage(AccountId.from(validatorStash, true), era, page),
    )
  }
}

class SystemApi {
  constructor(private readonly client: Client) {}

  remark(remark: string | Uint8Array): SubmittableTransaction {
    const value = typeof remark === "string" ? new TextEncoder().encode(remark) : remark
    return SubmittableTransaction.from(this.client, new avail.system.tx.Remark(value))
  }

  setCode(code: Uint8Array): SubmittableTransaction {
    return SubmittableTransaction.from(this.client, new avail.system.tx.SetCode(code))
  }

  setCodeWithoutChecks(code: Uint8Array): SubmittableTransaction {
    return SubmittableTransaction.from(this.client, new avail.system.tx.SetCodeWithoutChecks(code))
  }

  remarkWithEvent(remark: string | Uint8Array): SubmittableTransaction {
    const value = typeof remark === "string" ? new TextEncoder().encode(remark) : remark
    return SubmittableTransaction.from(this.client, new avail.system.tx.RemarkWithEvent(value))
  }
}

class VectorApi {
  constructor(private readonly client: Client) {}

  batch(
    functionId: H256 | string,
    input: Uint8Array,
    output: Uint8Array,
    proof: Uint8Array,
    slot: BN,
  ): SubmittableTransaction {
    return this.fulfillCall(functionId, input, output, proof, slot)
  }

  execute(
    slot: BN,
    addressedMessage: avail.vector.types.AddressedMessage,
    accountProof: Uint8Array[],
    storageProof: Uint8Array[],
  ): SubmittableTransaction {
    return SubmittableTransaction.from(
      this.client,
      new avail.vector.tx.Execute(slot, addressedMessage, accountProof, storageProof),
    )
  }

  fulfillCall(
    functionId: H256 | string,
    input: Uint8Array,
    output: Uint8Array,
    proof: Uint8Array,
    slot: BN,
  ): SubmittableTransaction {
    const hash = typeof functionId === "string" ? unwrapLegacy(H256.from(functionId, true)) : functionId
    return SubmittableTransaction.from(this.client, new avail.vector.tx.FulfillCall(hash, input, output, proof, slot))
  }

  sourceChainFroze(sourceChainId: number, frozen: boolean): SubmittableTransaction {
    return SubmittableTransaction.from(this.client, new avail.vector.tx.SourceChainFroze(sourceChainId, frozen))
  }

  sendMessage(
    slot: BN,
    message: avail.vector.types.Message,
    to: H256 | string,
    domain: number,
  ): SubmittableTransaction {
    const account = typeof to === "string" ? unwrapLegacy(H256.from(to, true)) : to
    return SubmittableTransaction.from(this.client, new avail.vector.tx.SendMessage(slot, message, account, domain))
  }

  setPoseidonHash(period: BN, poseidonHash: Uint8Array): SubmittableTransaction {
    return SubmittableTransaction.from(this.client, new avail.vector.tx.SetPoseidonHash(period, poseidonHash))
  }

  setBroadcaster(broadcasterDomain: number, broadcaster: H256 | string): SubmittableTransaction {
    const account = typeof broadcaster === "string" ? unwrapLegacy(H256.from(broadcaster, true)) : broadcaster
    return SubmittableTransaction.from(this.client, new avail.vector.tx.SetBroadcaster(broadcasterDomain, account))
  }

  failedSendMessageTxs(failedTxs: number[]): SubmittableTransaction {
    return SubmittableTransaction.from(this.client, new avail.vector.tx.FailedSendMessageTxs(failedTxs))
  }

  setWhitelistedDomains(value: number[]): SubmittableTransaction {
    return dynamicRuntimeTx(this.client, "vector", "setWhitelistedDomains", [value])
  }

  setConfiguration(value: unknown): SubmittableTransaction {
    return dynamicRuntimeTx(this.client, "vector", "setConfiguration", [value])
  }

  setFunctionIds(value: [H256 | string, H256 | string] | null): SubmittableTransaction {
    const parsed =
      value == null
        ? null
        : [
            typeof value[0] === "string" ? unwrapLegacy(H256.from(value[0], true)) : value[0],
            typeof value[1] === "string" ? unwrapLegacy(H256.from(value[1], true)) : value[1],
          ]
    return dynamicRuntimeTx(this.client, "vector", "setFunctionIds", [parsed])
  }

  setStepVerificationKey(value: Uint8Array | null): SubmittableTransaction {
    return dynamicRuntimeTx(this.client, "vector", "setStepVerificationKey", [value])
  }

  setUpdater(updater: H256 | string): SubmittableTransaction {
    const hash = typeof updater === "string" ? unwrapLegacy(H256.from(updater, true)) : updater
    return dynamicRuntimeTx(this.client, "vector", "setUpdater", [hash])
  }

  fulfill(proof: Uint8Array, publicValues: Uint8Array): SubmittableTransaction {
    return dynamicRuntimeTx(this.client, "vector", "fulfill", [proof, publicValues])
  }

  setSp1VerificationKey(sp1Vk: H256 | string): SubmittableTransaction {
    const hash = typeof sp1Vk === "string" ? unwrapLegacy(H256.from(sp1Vk, true)) : sp1Vk
    return dynamicRuntimeTx(this.client, "vector", "setSp1VerificationKey", [hash])
  }

  setSyncCommitteeHash(period: number, hash: H256 | string): SubmittableTransaction {
    const parsed = typeof hash === "string" ? unwrapLegacy(H256.from(hash, true)) : hash
    return dynamicRuntimeTx(this.client, "vector", "setSyncCommitteeHash", [period, parsed])
  }

  enableMock(value: boolean): SubmittableTransaction {
    return dynamicRuntimeTx(this.client, "vector", "enableMock", [value])
  }

  mockFulfill(publicValues: Uint8Array): SubmittableTransaction {
    return dynamicRuntimeTx(this.client, "vector", "mockFulfill", [publicValues])
  }
}

export type { ExtrinsicLike }
