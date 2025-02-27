import { Transaction } from "../../transaction"
import { AccountId, BN, Client } from "../../."
import { commissionNumberToPerbill } from "../../utils"

type ValidatorPerfs = { commission: string; blocked: boolean }
export type StakingRewardDestination = "Staked" | "Stash" | "Controller" | "None" | { account: string }

export class Calls {
  constructor(private client: Client) {}

  // Take the origin account as a stash and lock up `value` of its balance. `controller` will
  // be the account that controls it.
  //
  // Checked
  bond(value: BN, payee: StakingRewardDestination): Transaction {
    const tx = this.client.api.tx.staking.bond(value, payee)
    return new Transaction(this.client, tx)
  }

  // Add some extra amount that have appeared in the stash `free_balance` into the balance up
  // for staking.
  bondExtra(maxAdditional: BN): Transaction {
    const tx = this.client.api.tx.staking.bondExtra(maxAdditional)
    return new Transaction(this.client, tx)
  }

  // Schedule a portion of the stash to be unlocked ready for transfer out after the bond
  // period ends. If this leaves an amount actively bonded less than
  // T::Currency::minimum_balance(), then it is increased to the full amount.
  unbond(value: BN): Transaction {
    const tx = this.client.api.tx.staking.unbond(value)
    return new Transaction(this.client, tx)
  }

  // Remove any unlocked chunks from the `unlocking` queue from our management.
  //
  // This essentially frees up that balance to be used by the stash account to do whatever
  // it wants.
  withdrawUnbonded(numSlashingSpans: number): Transaction {
    const tx = this.client.api.tx.staking.withdrawUnbonded(numSlashingSpans)
    return new Transaction(this.client, tx)
  }

  // Declare the desire to validate for the origin controller.
  //
  // Effects will be felt at the beginning of the next era.
  //
  // Checked
  validate(commission: number, blocked: boolean): Transaction {
    const maybeCommission = commissionNumberToPerbill(commission)
    if (maybeCommission.isErr()) throw Error(maybeCommission.error)

    const validatorPerfs = { commission: maybeCommission.value, blocked } as ValidatorPerfs
    const tx = this.client.api.tx.staking.validate(validatorPerfs)
    return new Transaction(this.client, tx)
  }

  // Declare the desire to nominate `targets` for the origin controller.
  //
  // Effects will be felt at the beginning of the next era.
  nominate(targets: string[]): Transaction {
    const tx = this.client.api.tx.staking.nominate(targets)
    return new Transaction(this.client, tx)
  }

  // Declare no desire to either validate or nominate.
  //
  // Effects will be felt at the beginning of the next era.
  chill(): Transaction {
    const tx = this.client.api.tx.staking.chill()
    return new Transaction(this.client, tx)
  }

  // (Re-)set the payment target for a controller.
  //
  // Effects will be felt instantly (as soon as this function is completed successfully).
  setPayee(payee: StakingRewardDestination): Transaction {
    const tx = this.client.api.tx.staking.setPayee(payee)
    return new Transaction(this.client, tx)
  }

  // (Re-)sets the controller of a stash to the stash itself. This function previously
  // accepted a `controller` argument to set the controller to an account other than the
  // stash itself. This functionality has now been removed, now only setting the controller
  // to the stash, if it is not already.
  //
  // Effects will be felt instantly (as soon as this function is completed successfully).
  setController(): Transaction {
    const tx = this.client.api.tx.staking.setController()
    return new Transaction(this.client, tx)
  }

  // Pay out next page of the stakers behind a validator for the given era.
  //
  // - `validator_stash` is the stash account of the validator.
  // - `era` may be any era between `[current_era - history_depth; current_era]`.
  payoutStakers(validatorStash: string | AccountId, era: number): Transaction {
    const tx = this.client.api.tx.staking.payoutStakers(validatorStash.toString(), era)
    return new Transaction(this.client, tx)
  }

  // Rebond a portion of the stash scheduled to be unlocked.
  rebond(value: BN): Transaction {
    const tx = this.client.api.tx.staking.rebond(value)
    return new Transaction(this.client, tx)
  }

  // Remove all data structures concerning a staker/stash once it is at a state where it can
  // be considered `dust` in the staking system. The requirements are:
  //
  // 1. the `total_balance` of the stash is below existential deposit.
  // 2. or, the `ledger.total` of the stash is below existential deposit.
  //
  // The former can happen in cases like a slash; the latter when a fully unbonded account
  // is still receiving staking rewards in `RewardDestination::Staked`.
  //
  // It can be called by anyone, as long as `stash` meets the above requirements.
  //
  // Refunds the transaction fees upon successful execution.
  reapStash(stash: string | AccountId, numSlashingSpans: number): Transaction {
    const tx = this.client.api.tx.staking.reapStash(stash.toString(), numSlashingSpans)
    return new Transaction(this.client, tx)
  }

  // Remove the given nominations from the calling validator.
  //
  // Effects will be felt at the beginning of the next era.
  kick(who: string[]): Transaction {
    const tx = this.client.api.tx.staking.reapStash(who)
    return new Transaction(this.client, tx)
  }

  // Declare a `controller` to stop participating as either a validator or nominator.
  //
  // Effects will be felt at the beginning of the next era.
  //
  // The dispatch origin for this call must be _Signed_, but can be called by anyone.
  //
  // If the caller is the same as the controller being targeted, then no further checks are
  // enforced, and this function behaves just like `chill`.
  //
  // If the caller is different than the controller being targeted, the following conditions
  // must be met:
  //
  // * `controller` must belong to a nominator who has become non-decodable,
  //
  // Or:
  //
  //   - A `ChillThreshold` must be set and checked which defines how close to the max
  //     nominators or validators we must reach before users can start chilling one-another.
  //   - A `MaxNominatorCount` and `MaxValidatorCount` must be set which is used to determine
  //     how close we are to the threshold.
  //   - A `MinNominatorBond` and `MinValidatorBond` must be set and checked, which determines
  //     if this is a person that should be chilled because they have not met the threshold
  //     bond required.
  //
  // This can be helpful if bond requirements are updated, and we need to remove old users
  // who do not satisfy these requirements.
  chillOther(stash: string | AccountId): Transaction {
    const tx = this.client.api.tx.staking.chillOther(stash.toString())
    return new Transaction(this.client, tx)
  }

  // Force a validator to have at least the minimum commission. This will not affect a
  // validator who already has a commission greater than or equal to the minimum. Any account
  // can call this.
  forceApplyMinCommission(validatorStash: string | AccountId): Transaction {
    const tx = this.client.api.tx.staking.forceApplyMinCommission(validatorStash.toString())
    return new Transaction(this.client, tx)
  }

  // Pay out a page of the stakers behind a validator for the given era and page.
  //
  //   - `validator_stash` is the stash account of the validator.
  //   - `era` may be any era between `[current_era - history_depth; current_era]`.
  //   - `page` is the page index of nominators to pay out with value between 0 and
  //     `num_nominators / T::MaxExposurePageSize`.
  //
  // The origin of this call must be _Signed_. Any account can call this function, even if
  // it is not one of the stakers.
  //
  // If a validator has more than [`Config::MaxExposurePageSize`] nominators backing
  // them, then the list of nominators is paged, with each page being capped at
  // [`Config::MaxExposurePageSize`.] If a validator has more than one page of nominators,
  // the call needs to be made for each page separately in order for all the nominators
  // backing a validator to receive the reward. The nominators are not sorted across pages
  // and so it should not be assumed the highest staker would be on the topmost page and vice
  // versa. If rewards are not claimed in [`Config::HistoryDepth`] eras, they are lost.
  payoutStakersByPage(validatorStash: string | AccountId, era: number, page: number): Transaction {
    const tx = this.client.api.tx.staking.payoutStakersByPage(validatorStash.toString(), era, page)
    return new Transaction(this.client, tx)
  }

  // Migrates an account's `RewardDestination::Controller` to
  // `RewardDestination::Account(controller)`.
  //
  // Effects will be felt instantly (as soon as this function is completed successfully).
  //
  // This will waive the transaction fee if the `payee` is successfully migrated.
  updatePayee(controller: string | AccountId): Transaction {
    const tx = this.client.api.tx.staking.updatePayee(controller.toString())
    return new Transaction(this.client, tx)
  }
}
