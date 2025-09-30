import { addHeader } from "../."

import { AvailError } from "../../../error"
import { AccountId } from "../../metadata"
import { Decoder, U128, U32 } from "../../scale"
import { PALLET_ID } from "."
import { BN } from "../../polkadot"
import { RewardDestination, RewardDestinationValue, ValidatorPerfs } from "./types"

export class Bonded extends addHeader(PALLET_ID, 6) {
  constructor(
    public stash: AccountId,
    public amount: BN,
  ) {
    super()
  }

  static decode(decoder: Decoder): Bonded | AvailError {
    const result = decoder.any2(AccountId, U128)
    if (result instanceof AvailError) return result

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

  static decode(decoder: Decoder): Unbonded | AvailError {
    const result = decoder.any2(AccountId, U128)
    if (result instanceof AvailError) return result

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

  static decode(decoder: Decoder): ValidatorPrefsSet | AvailError {
    const result = decoder.any2(AccountId, ValidatorPerfs)
    if (result instanceof AvailError) return result

    return new ValidatorPrefsSet(...result)
  }
}

export class Chilled extends addHeader(PALLET_ID, 11) {
  constructor(public stash: AccountId) {
    super()
  }

  static decode(decoder: Decoder): Chilled | AvailError {
    const result = decoder.any1(AccountId)
    if (result instanceof AvailError) return result

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

  static decode(decoder: Decoder): EraPaid | AvailError {
    const result = decoder.any3(U32, U128, U128)
    if (result instanceof AvailError) return result

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

  static decode(decoder: Decoder): Rewarded | AvailError {
    const result = decoder.any3(AccountId, RewardDestination, U128)
    if (result instanceof AvailError) return result

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

  static decode(decoder: Decoder): Slashed | AvailError {
    const result = decoder.any2(AccountId, U128)
    if (result instanceof AvailError) return result

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

  static decode(decoder: Decoder): Withdrawn | AvailError {
    const result = decoder.any2(AccountId, U128)
    if (result instanceof AvailError) return result

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

  static decode(decoder: Decoder): Kicked | AvailError {
    const result = decoder.any2(AccountId, AccountId)
    if (result instanceof AvailError) return result

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

  static decode(decoder: Decoder): PayoutStarted | AvailError {
    const result = decoder.any2(U32, AccountId)
    if (result instanceof AvailError) return result

    return new PayoutStarted(...result)
  }
}
