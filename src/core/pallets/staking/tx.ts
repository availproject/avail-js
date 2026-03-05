import { addHeader } from "./../../interface"
import { Encoder, Decoder, CompactU128, U32 } from "./../../scale"
import { Vec } from "./../../scale/types"
import { PALLET_ID } from "./header"
import { BN } from "@polkadot/util"
import * as types from "./types"
import { AccountId, MultiAddress } from "../../types"
import { AccountIdScale, MultiAddressScale } from "../../scale/types"

export { PALLET_ID }

export class Bond extends addHeader(PALLET_ID, 0) {
  constructor(
    public value: BN, // Compact U128
    public payee: types.RewardDestinationValue,
  ) {
    super()
  }

  static decode(decoder: Decoder): Bond {
    const result = decoder.any2(CompactU128, types.RewardDestination)

    return new Bond(result[0], result[1])
  }

  encode(): Uint8Array {
    return Encoder.concat(new CompactU128(this.value), new types.RewardDestination(this.payee))
  }
}

export class BondExtra extends addHeader(PALLET_ID, 1) {
  constructor(
    public value: BN, // Compact U128
  ) {
    super()
  }

  static decode(decoder: Decoder): BondExtra {
    const result = decoder.any1(CompactU128)

    return new BondExtra(result)
  }

  encode(): Uint8Array {
    return Encoder.concat(new CompactU128(this.value))
  }
}

export class Unbond extends addHeader(PALLET_ID, 2) {
  constructor(
    public value: BN, // Compact U128
  ) {
    super()
  }

  static decode(decoder: Decoder): Unbond {
    const result = decoder.any1(CompactU128)

    return new Unbond(result)
  }

  encode(): Uint8Array {
    return Encoder.concat(new CompactU128(this.value))
  }
}

export class Rebond extends addHeader(PALLET_ID, 19) {
  constructor(
    public value: BN, // Compact U128
  ) {
    super()
  }

  static decode(decoder: Decoder): Rebond {
    const result = decoder.any1(CompactU128)

    return new Rebond(result)
  }

  encode(): Uint8Array {
    return Encoder.concat(new CompactU128(this.value))
  }
}

export class Validate extends addHeader(PALLET_ID, 4) {
  constructor(public prefs: types.ValidatorPerfs) {
    super()
  }

  static decode(decoder: Decoder): Validate {
    const result = decoder.any1(types.ValidatorPerfs)

    return new Validate(result)
  }

  encode(): Uint8Array {
    return Encoder.concat(this.prefs)
  }
}

export class Nominate extends addHeader(PALLET_ID, 5) {
  constructor(public targets: MultiAddress[]) {
    super()
  }

  static decode(decoder: Decoder): Nominate {
    const result = decoder.vec(MultiAddressScale)

    return new Nominate(result)
  }

  encode(): Uint8Array {
    return Vec.encode(this.targets.map((v) => new MultiAddressScale(v)))
  }
}

// TODO tests
export class ChillOther extends addHeader(PALLET_ID, 23) {
  constructor(public stash: AccountId) {
    super()
  }

  static decode(decoder: Decoder): ChillOther {
    const stash = decoder.any1(AccountIdScale)

    return new ChillOther(stash)
  }

  encode(): Uint8Array {
    return Encoder.concat(new AccountIdScale(this.stash))
  }
}

export class PayoutStakers extends addHeader(PALLET_ID, 18) {
  constructor(
    public validatorStash: AccountId,
    public era: number,
  ) {
    super()
  }

  static decode(decoder: Decoder): PayoutStakers {
    const result = decoder.any2(AccountIdScale, U32)

    return new PayoutStakers(...result)
  }

  encode(): Uint8Array {
    return Encoder.concat(new AccountIdScale(this.validatorStash), new U32(this.era))
  }
}

export class SetController extends addHeader(PALLET_ID, 8) {
  constructor() {
    super()
  }

  static decode(_decoder: Decoder): SetController {
    return new SetController()
  }

  encode(): Uint8Array {
    return new Uint8Array()
  }
}

export class SetPayee extends addHeader(PALLET_ID, 7) {
  constructor(public payee: types.RewardDestinationValue) {
    super()
  }

  static decode(decoder: Decoder): SetPayee {
    const result = decoder.any1(types.RewardDestination)

    return new SetPayee(result)
  }

  encode(): Uint8Array {
    return Encoder.concat(new types.RewardDestination(this.payee))
  }
}

export class Chill extends addHeader(PALLET_ID, 6) {
  constructor() {
    super()
  }

  static decode(_decoder: Decoder): Chill {
    return new Chill()
  }

  encode(): Uint8Array {
    return new Uint8Array()
  }
}

export class WithdrawUnbonded extends addHeader(PALLET_ID, 3) {
  constructor(public numSlashingSpans: number /* U32 */) {
    super()
  }

  static decode(decoder: Decoder): WithdrawUnbonded {
    const result = decoder.any1(U32)

    return new WithdrawUnbonded(result)
  }

  encode(): Uint8Array {
    return Encoder.concat(new U32(this.numSlashingSpans))
  }
}

// TODO tests
export class ReapStash extends addHeader(PALLET_ID, 20) {
  constructor(
    public stash: AccountId,
    public numSlashingSpans: number /* U32 */,
  ) {
    super()
  }

  static decode(decoder: Decoder): ReapStash {
    const value = decoder.any2(AccountIdScale, U32)

    return new ReapStash(...value)
  }

  encode(): Uint8Array {
    return Encoder.concat(new AccountIdScale(this.stash), new U32(this.numSlashingSpans))
  }
}

export class Kick extends addHeader(PALLET_ID, 21) {
  constructor(public who: MultiAddress[]) {
    super()
  }

  static decode(decoder: Decoder): Kick {
    const value = decoder.vec(MultiAddressScale)

    return new Kick(value)
  }

  encode(): Uint8Array {
    return Vec.encode(this.who.map((v) => new MultiAddressScale(v)))
  }
}

// TODO tests
export class ForceApplyMinCommission extends addHeader(PALLET_ID, 24) {
  constructor(public validatorStash: AccountId) {
    super()
  }

  static decode(decoder: Decoder): ForceApplyMinCommission {
    const value = decoder.any1(AccountIdScale)

    return new ForceApplyMinCommission(value)
  }

  encode(): Uint8Array {
    return Encoder.concat(new AccountIdScale(this.validatorStash))
  }
}

export class PayoutStakersByPage extends addHeader(PALLET_ID, 26) {
  constructor(
    public validatorStash: AccountId,
    public era: number /* U32 */,
    public page: number /* U32*/,
  ) {
    super()
  }

  static decode(decoder: Decoder): PayoutStakersByPage {
    const value = decoder.any3(AccountIdScale, U32, U32)

    return new PayoutStakersByPage(...value)
  }

  encode(): Uint8Array {
    return Encoder.concat(new AccountIdScale(this.validatorStash), new U32(this.era), new U32(this.page))
  }
}
