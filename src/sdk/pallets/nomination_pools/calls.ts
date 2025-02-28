import { Transaction } from "../../transaction"
import { AccountId, BN, Client } from "../../."

export class Calls {
  constructor(private client: Client) {}

  // Stake funds with a pool. The amount to bond is transferred from the member to the
  // pools account and immediately increases the pools bond.
  //
  // # Note
  //
  //   - An account can only be a member of a single pool.
  //   - An account cannot join the same pool multiple times.
  //   - This call will *not* dust the member account, so the member must have at least
  //     `existential deposit + amount` in their account.
  //   - Only a pool with [`PoolState::Open`] can be joined
  join(amount: BN, poolId: number): Transaction {
    const tx = this.client.api.tx.nomination_pools.join(amount, poolId)
    return new Transaction(this.client, tx)
  }

  // Bond `extra` more funds from `origin` into the pool to which they already belong.
  //
  // Additional funds can come from either the free balance of the account, of from the
  // accumulated rewards, see [`BondExtra`].
  //
  // Bonding extra funds implies an automatic payout of all pending rewards as well.
  // See `bond_extra_other` to bond pending rewards of `other` members.
  bondExtra(extra: { FreeBalance: BN } | { Rewards: any }): Transaction {
    const tx = this.client.api.tx.nomination_pools.bondExtra(extra)
    return new Transaction(this.client, tx)
  }

  // A bonded member can use this to claim their payout based on the rewards that the pool
  // has accumulated since their last claimed payout (OR since joining if this is their first
  // time claiming rewards). The payout will be transferred to the member's account.
  //
  // The member will earn rewards pro rata based on the members stake vs the sum of the
  // members in the pools stake. Rewards do not "expire".
  //
  // See `claim_payout_other` to caim rewards on bahalf of some `other` pool member.
  claimPayout(): Transaction {
    const tx = this.client.api.tx.nomination_pools.claimPayout()
    return new Transaction(this.client, tx)
  }

  // Unbond up to `unbonding_points` of the `member_account`'s funds from the pool. It
  // implicitly collects the rewards one last time, since not doing so would mean some
  // rewards would be forfeited.
  //
  // Under certain conditions, this call can be dispatched permissionlessly (i.e. by any
  // account).
  //
  // # Conditions for a permissionless dispatch.
  //
  //   - The pool is blocked and the caller is either the root or bouncer. This is refereed to
  //     as a kick.
  //   - The pool is destroying and the member is not the depositor.
  //   - The pool is destroying, the member is the depositor and no other members are in the
  //     pool.
  //
  // ## Conditions for permissioned dispatch (i.e. the caller is also the
  // `member_account`):
  //
  //   - The caller is not the depositor.
  //   - The caller is the depositor, the pool is destroying and no other members are in the
  //     pool.
  //
  // # Note
  //
  // If there are too many unlocking chunks to unbond with the pool account,
  // [`Call::pool_withdraw_unbonded`] can be called to try and minimize unlocking chunks.
  // The [`StakingInterface::unbond`] will implicitly call [`Call::pool_withdraw_unbonded`]
  // to try to free chunks if necessary (ie. if unbound was called and no unlocking chunks
  // are available). However, it may not be possible to release the current unlocking chunks,
  // in which case, the result of this call will likely be the `NoMoreChunks` error from the
  // staking system.
  unbond(memberAccount: string | AccountId, unbondingPoints: BN): Transaction {
    const tx = this.client.api.tx.nomination_pools.unbond(memberAccount.toString(), unbondingPoints)
    return new Transaction(this.client, tx)
  }

  // Call `withdraw_unbonded` for the pools account. This call can be made by any account.
  //
  // This is useful if there are too many unlocking chunks to call `unbond`, and some
  // can be cleared by withdrawing. In the case there are too many unlocking chunks, the user
  // would probably see an error like `NoMoreChunks` emitted from the staking system when
  // they attempt to unbond.
  poolWithdrawUnbonded(poolId: number, numSlashingSpans: number): Transaction {
    const tx = this.client.api.tx.nomination_pools.poolWithdrawUnbonded(poolId, numSlashingSpans)
    return new Transaction(this.client, tx)
  }

  // Withdraw unbonded funds from `member_account`. If no bonded funds can be unbonded, an
  // error is returned.
  //
  // Under certain conditions, this call can be dispatched permissionlessly (i.e. by any
  // account).
  //
  // # Conditions for a permissionless dispatch
  //
  // * The pool is in destroy mode and the target is not the depositor.
  // * The target is the depositor and they are the only member in the sub pools.
  // * The pool is blocked and the caller is either the root or bouncer.
  //
  // # Conditions for permissioned dispatch
  //
  // * The caller is the target and they are not the depositor.
  //
  // # Note
  //
  // If the target is the depositor, the pool will be destroyed.
  withdrawUnbonded(memberAccount: string | AccountId, numSlashingSpans: number): Transaction {
    const tx = this.client.api.tx.nomination_pools.withdrawUnbonded(memberAccount.toString(), numSlashingSpans)
    return new Transaction(this.client, tx)
  }

  // Create a new delegation pool.
  //
  // # Arguments
  //
  //   - `amount` - The amount of funds to delegate to the pool. This also acts of a sort of
  //     deposit since the pools creator cannot fully unbond funds until the pool is being
  //     destroyed.
  //   - `root` - The account to set as [`PoolRoles::root`].
  //   - `nominator` - The account to set as the [`PoolRoles::nominator`].
  //   - `bouncer` - The account to set as the [`PoolRoles::bouncer`].
  //
  // # Note
  //
  // In addition to `amount`, the caller will transfer the existential deposit; so the caller
  // needs at have at least `amount + existential_deposit` transferable.
  create(
    amount: BN,
    root: string | AccountId,
    nominator: string | AccountId,
    bouncer: string | AccountId,
  ): Transaction {
    const tx = this.client.api.tx.nomination_pools.create(
      amount,
      root.toString(),
      nominator.toString(),
      bouncer.toString(),
    )
    return new Transaction(this.client, tx)
  }

  // Create a new delegation pool with a previously used pool id
  //
  // # Arguments
  //
  // same as `create` with the inclusion of
  // * `pool_id` - `A valid PoolId.
  createWithPoolId(
    amount: BN,
    root: string | AccountId,
    nominator: string | AccountId,
    bouncer: string | AccountId,
    poolId: number,
  ): Transaction {
    const tx = this.client.api.tx.nomination_pools.createWithPoolId(
      amount,
      root.toString(),
      nominator.toString(),
      bouncer.toString(),
      poolId,
    )
    return new Transaction(this.client, tx)
  }

  // Nominate on behalf of the pool.
  //
  // The dispatch origin of this call must be signed by the pool nominator or the pool
  // root role.
  //
  // This directly forward the call to the staking pallet, on behalf of the pool bonded
  // account.
  nominate(poolId: number, validators: string[]): Transaction {
    const tx = this.client.api.tx.nomination_pools.nominate(poolId, validators)
    return new Transaction(this.client, tx)
  }

  // Set a new state for the pool.
  //
  // If a pool is already in the `Destroying` state, then under no condition can its state
  // change again.
  //
  // The dispatch origin of this call must be either:
  //
  //  1. signed by the bouncer, or the root role of the pool,
  //  2. if the pool conditions to be open are NOT met (as described by `ok_to_be_open`), and
  //     then the state of the pool can be permissionlessly changed to `Destroying`.
  setState(poolId: number, state: "Open" | "Blocked" | "Destroying"): Transaction {
    const tx = this.client.api.tx.nomination_pools.setState(poolId, state)
    return new Transaction(this.client, tx)
  }

  // Set a new metadata for the pool.
  //
  // The dispatch origin of this call must be signed by the bouncer, or the root role of the
  // pool.
  setMetadata(poolId: number, metadata: string | Uint8Array): Transaction {
    const tx = this.client.api.tx.nomination_pools.setMetadata(poolId, metadata)
    return new Transaction(this.client, tx)
  }

  // Update the roles of the pool.
  //
  // The root is the only entity that can change any of the roles, including itself,
  // excluding the depositor, who can never change.
  //
  // It emits an event, notifying UIs of the role change. This event is quite relevant to
  // most pool members and they should be informed of changes to pool roles.
  updateRoles(
    poolId: number,
    newRoot: { Noop: any } | { Set: string } | { Remove: any },
    newNominator: { Noop: any } | { Set: string } | { Remove: any },
    newBouncer: { Noop: any } | { Set: string } | { Remove: any },
  ): Transaction {
    const tx = this.client.api.tx.nomination_pools.updateRoles(poolId, newRoot, newNominator, newBouncer)
    return new Transaction(this.client, tx)
  }

  // Chill on behalf of the pool.
  //
  // The dispatch origin of this call must be signed by the pool nominator or the pool
  // root role, same as [`Pallet::nominate`].
  //
  // This directly forward the call to the staking pallet, on behalf of the pool bonded
  // account.
  chill(poolId: number): Transaction {
    const tx = this.client.api.tx.nomination_pools.chill(poolId)
    return new Transaction(this.client, tx)
  }

  // `origin` bonds funds from `extra` for some pool member `member` into their respective
  // pools.
  //
  // `origin` can bond extra funds from free balance or pending rewards when `origin ==
  // other`.
  //
  // In the case of `origin != other`, `origin` can only bond extra pending rewards of
  // `other` members assuming set_claim_permission for the given member is
  // `PermissionlessAll` or `PermissionlessCompound`.
  bondExtraOther(member: string | AccountId, extra: { FreeBalance: BN } | { Rewards: any }): Transaction {
    const tx = this.client.api.tx.nomination_pools.bondExtraOther(member, extra)
    return new Transaction(this.client, tx)
  }

  // Allows a pool member to set a claim permission to allow or disallow permissionless
  // bonding and withdrawing.
  //
  // By default, this is `Permissioned`, which implies only the pool member themselves can
  // claim their pending rewards. If a pool member wishes so, they can set this to
  // `PermissionlessAll` to allow any account to claim their rewards and bond extra to the
  // pool.
  setClaimPermission(
    permission: "Permissioned" | "PermissionlessCompound" | "PermissionlessWithdraw" | "PermissionlessAll",
  ): Transaction {
    const tx = this.client.api.tx.nomination_pools.setClaimPermission(permission)
    return new Transaction(this.client, tx)
  }

  // `origin` can claim payouts on some pool member `other`'s behalf.
  //
  // Pool member `other` must have a `PermissionlessAll` or `PermissionlessWithdraw` in order
  // for this call to be successful.
  claimPayoutOther(other: string | AccountId): Transaction {
    const tx = this.client.api.tx.nomination_pools.claimPayoutOther(other.toString())
    return new Transaction(this.client, tx)
  }

  // Set the commission of a pool.
  //
  // Both a commission percentage and a commission payee must be provided in the `current`
  // tuple. Where a `current` of `None` is provided, any current commission will be removed.
  //
  // - If a `None` is supplied to `new_commission`, existing commission will be removed.
  setCommission(poolId: number, newCommission: [number, string] | null): Transaction {
    const tx = this.client.api.tx.nomination_pools.setCommission(poolId, newCommission)
    return new Transaction(this.client, tx)
  }

  // Set the maximum commission of a pool.
  //
  //   - Initial max can be set to any `Perbill`, and only smaller values thereafter.
  //   - Current commission will be lowered in the event it is higher than a new max
  //     commission.
  setCommissionMax(poolId: number, maxCommission: number): Transaction {
    const tx = this.client.api.tx.nomination_pools.setCommissionMax(poolId, maxCommission)
    return new Transaction(this.client, tx)
  }

  // Set the commission change rate for a pool.
  //
  // Initial change rate is not bounded, whereas subsequent updates can only be more
  // restrictive than the current.
  setCommissionChangeRate(poolId: number, changeRate: { maxIncrease?: number; minDelay?: number }): Transaction {
    const tx = this.client.api.tx.nomination_pools.setCommissionChangeRate(poolId, changeRate)
    return new Transaction(this.client, tx)
  }

  // Claim pending commission.
  //
  // The dispatch origin of this call must be signed by the `root` role of the pool. Pending
  // commission is paid out and added to total claimed commission`. Total pending commission
  // is reset to zero. the current.
  claimCommission(poolId: number): Transaction {
    const tx = this.client.api.tx.nomination_pools.claimCommission(poolId)
    return new Transaction(this.client, tx)
  }

  // Top up the deficit or withdraw the excess ED from the pool.
  //
  // When a pool is created, the pool depositor transfers ED to the reward account of the
  // pool. ED is subject to change and over time, the deposit in the reward account may be
  // insufficient to cover the ED deficit of the pool or vice-versa where there is excess
  // deposit to the pool. This call allows anyone to adjust the ED deposit of the
  // pool by either topping up the deficit or claiming the excess.
  adjustPoolDeposit(poolId: number): Transaction {
    const tx = this.client.api.tx.nomination_pools.adjustPoolDeposit(poolId)
    return new Transaction(this.client, tx)
  }

  // Set or remove a pool's commission claim permission.
  //
  // Determines who can claim the pool's pending commission. Only the `Root` role of the pool
  // is able to conifigure commission claim permissions.
  setCommissionClaimPermission(
    poolId: number,
    permission: { Permissionless: any } | { Account: string } | null,
  ): Transaction {
    const tx = this.client.api.tx.nomination_pools.setCommissionClaimPermission(poolId, permission)
    return new Transaction(this.client, tx)
  }
}
