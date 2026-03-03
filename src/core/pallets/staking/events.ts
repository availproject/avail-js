import { addHeader } from "./../../interface"
import { AccountId } from "../../metadata"
import { Decoder, U128, U32 } from "./../../scale"
import { PALLET_ID } from "./header"
import { BN } from "@polkadot/util"
import { RewardDestination, RewardDestinationValue, ValidatorPerfs } from "./types"

export class Bonded extends addHeader(PALLET_ID, 6) {
  constructor(
    public stash: AccountId,
    public amount: BN,
  ) {
    super()
  }

  static decode(decoder: Decoder): Bonded {
    const result = decoder.any2(AccountId, U128)

    return new Bonded(...result)
  }
}

export class Unbonded extends addHeader(PALLET_ID, 7) {
  constructor(
    public stash: AccountId,
    public amount: BN,
  ) {
    super()
  }

  static decode(decoder: Decoder): Unbonded {
    const result = decoder.any2(AccountId, U128)

    return new Unbonded(...result)
  }
}

export class ValidatorPrefsSet extends addHeader(PALLET_ID, 13) {
  constructor(
    public stash: AccountId,
    public prefs: ValidatorPerfs,
  ) {
    super()
  }

  static decode(decoder: Decoder): ValidatorPrefsSet {
    const result = decoder.any2(AccountId, ValidatorPerfs)

    return new ValidatorPrefsSet(...result)
  }
}

export class Chilled extends addHeader(PALLET_ID, 11) {
  constructor(public stash: AccountId) {
    super()
  }

  static decode(decoder: Decoder): Chilled {
    const result = decoder.any1(AccountId)

    return new Chilled(result)
  }
}

// TODO tests
export class EraPaid extends addHeader(PALLET_ID, 0) {
  constructor(
    public eraIndex: number /* U32 */,
    public validatorPayout: BN /* U128 */,
    public remainder: BN /* U128 */,
  ) {
    super()
  }

  static decode(decoder: Decoder): EraPaid {
    const result = decoder.any3(U32, U128, U128)

    return new EraPaid(...result)
  }
}

export class Rewarded extends addHeader(PALLET_ID, 1) {
  constructor(
    public stash: AccountId,
    public dest: RewardDestinationValue,
    public amount: BN /* U128 */,
  ) {
    super()
  }

  static decode(decoder: Decoder): Rewarded {
    const result = decoder.any3(AccountId, RewardDestination, U128)

    return new Rewarded(...result)
  }
}

// TODO tests
export class Slashed extends addHeader(PALLET_ID, 2) {
  constructor(
    public staker: AccountId,
    public amount: BN /* U128 */,
  ) {
    super()
  }

  static decode(decoder: Decoder): Slashed {
    const result = decoder.any2(AccountId, U128)

    return new Slashed(...result)
  }
}

export class Withdrawn extends addHeader(PALLET_ID, 8) {
  constructor(
    public stash: AccountId,
    public amount: BN /* U128 */,
  ) {
    super()
  }

  static decode(decoder: Decoder): Withdrawn {
    const result = decoder.any2(AccountId, U128)

    return new Withdrawn(...result)
  }
}

// TODO tests
export class Kicked extends addHeader(PALLET_ID, 9) {
  constructor(
    public nominator: AccountId,
    public stash: AccountId,
  ) {
    super()
  }

  static decode(decoder: Decoder): Kicked {
    const result = decoder.any2(AccountId, AccountId)

    return new Kicked(...result)
  }
}

export class PayoutStarted extends addHeader(PALLET_ID, 12) {
  constructor(
    public eraIndex: number /* U32 */,
    public validatorStash: AccountId,
  ) {
    super()
  }

  static decode(decoder: Decoder): PayoutStarted {
    const result = decoder.any2(U32, AccountId)

    return new PayoutStarted(...result)
  }
}
