import { addHeader } from "./../../interface"
import { Encoder, Decoder, U32, CompactU128 } from "./../../scale"
import { AvailError } from "../../error"
import { PALLET_ID } from "./header"
import { AccountId, MultiAddress, MultiAddressValue } from "../../metadata"
import * as types from "./types"
import { BN, u8aConcat } from "@polkadot/util"
import { Vec, VecU8 } from "../../scale/types"

export { PALLET_ID }

export class BondExtra extends addHeader(PALLET_ID, 1) {
  constructor(public value: types.BondExtraValue) {
    super()
  }

  static decode(decoder: Decoder): BondExtra {
    const value = decoder.any1(types.BondExtra)
    return new BondExtra(value)
  }

  encode(): Uint8Array {
    return Encoder.any1(new types.BondExtra(this.value))
  }
}

export class BondExtraOther extends addHeader(PALLET_ID, 14) {
  constructor(
    public member: MultiAddressValue,
    public value: types.BondExtraValue,
  ) {
    super()
  }

  static decode(decoder: Decoder): BondExtraOther {
    const result = decoder.any2(MultiAddress, types.BondExtra)

    return new BondExtraOther(...result)
  }

  encode(): Uint8Array {
    return Encoder.concat(new MultiAddress(this.member), new types.BondExtra(this.value))
  }
}

export class Chill extends addHeader(PALLET_ID, 13) {
  constructor(public poolId: number) {
    super()
  }

  static decode(decoder: Decoder): Chill {
    const result = decoder.any1(U32)

    return new Chill(result)
  }

  encode(): Uint8Array {
    return Encoder.concat(new U32(this.poolId))
  }
}

export class ClaimCommission extends addHeader(PALLET_ID, 20) {
  constructor(public poolId: number /** U32 */) {
    super()
  }

  static decode(decoder: Decoder): ClaimCommission {
    const result = decoder.any1(U32)

    return new ClaimCommission(result)
  }

  encode(): Uint8Array {
    return Encoder.concat(new U32(this.poolId))
  }
}

export class ClaimPayout extends addHeader(PALLET_ID, 2) {
  constructor() {
    super()
  }

  static decode(_decoder: Decoder): ClaimPayout {
    return new ClaimPayout()
  }

  encode(): Uint8Array {
    return new Uint8Array()
  }
}

export class ClaimPayoutOther extends addHeader(PALLET_ID, 16) {
  constructor(public owner: AccountId) {
    super()
  }

  static decode(decoder: Decoder): ClaimPayoutOther {
    const result = decoder.any1(AccountId)

    return new ClaimPayoutOther(result)
  }

  encode(): Uint8Array {
    return Encoder.concat(this.owner)
  }
}

export class Create extends addHeader(PALLET_ID, 6) {
  constructor(
    public amount: BN /* Compact U128 */,
    public root: MultiAddressValue,
    public nominator: MultiAddressValue,
    public bouncer: MultiAddressValue,
  ) {
    super()
  }

  static decode(decoder: Decoder): Create {
    const result = decoder.any4(CompactU128, MultiAddress, MultiAddress, MultiAddress)

    return new Create(...result)
  }

  encode(): Uint8Array {
    return Encoder.concat(
      new CompactU128(this.amount),
      new MultiAddress(this.root),
      new MultiAddress(this.nominator),
      new MultiAddress(this.bouncer),
    )
  }
}

export class CreateWithPoolId extends addHeader(PALLET_ID, 7) {
  constructor(
    public amount: BN /* Compact U128 */,
    public root: MultiAddressValue,
    public nominator: MultiAddressValue,
    public bouncer: MultiAddressValue,
    public poolId: number,
  ) {
    super()
  }

  static decode(decoder: Decoder): CreateWithPoolId {
    const result = decoder.any5(CompactU128, MultiAddress, MultiAddress, MultiAddress, U32)

    return new CreateWithPoolId(...result)
  }

  encode(): Uint8Array {
    return Encoder.concat(
      new CompactU128(this.amount),
      new MultiAddress(this.root),
      new MultiAddress(this.nominator),
      new MultiAddress(this.bouncer),
      new U32(this.poolId),
    )
  }
}

export class Join extends addHeader(PALLET_ID, 0) {
  constructor(
    public amount: BN /* Compact U128 */,
    public poolId: number,
  ) {
    super()
  }

  static decode(decoder: Decoder): Join {
    const result = decoder.any2(CompactU128, U32)

    return new Join(...result)
  }

  encode(): Uint8Array {
    return Encoder.concat(new CompactU128(this.amount), new U32(this.poolId))
  }
}

export class Nominate extends addHeader(PALLET_ID, 8) {
  constructor(
    public poolId: number,
    public validators: AccountId[], // Vec<AccountId>
  ) {
    super()
  }

  static decode(decoder: Decoder): Nominate {
    const poolId = decoder.any1(U32)

    const validators = decoder.vec(AccountId)

    return new Nominate(poolId, validators)
  }

  encode(): Uint8Array {
    return u8aConcat(new U32(this.poolId).encode(), Vec.encode(this.validators))
  }
}

export class SetClaimPermission extends addHeader(PALLET_ID, 15) {
  constructor(public permission: types.ClaimPermissionValue) {
    super()
  }

  static decode(decoder: Decoder): SetClaimPermission {
    const value = decoder.any1(types.ClaimPermission)

    return new SetClaimPermission(value)
  }

  encode(): Uint8Array {
    return Encoder.concat(new types.ClaimPermission(this.permission))
  }
}

export class SetCommission extends addHeader(PALLET_ID, 17) {
  constructor(
    public poolId: number /* u32 */,
    public newCommission: [number, AccountId] | null /* Option<(Perbill, T::AccountId)> */,
  ) {
    super()
  }

  static decode(decoder: Decoder): SetCommission {
    const poolId = decoder.any1(U32)

    const newCommission = decoder.optionTuple(U32, AccountId)

    return new SetCommission(poolId, newCommission)
  }

  encode(): Uint8Array {
    const newCommission = this.newCommission ? [new U32(this.newCommission[0]), this.newCommission[1]] : null
    return u8aConcat(U32.encode(this.poolId), Encoder.optionTuple(newCommission))
  }
}

export class SetCommissionChangeRate extends addHeader(PALLET_ID, 19) {
  constructor(
    public poolId: number /* u32 */,
    public maxIncrease: number, // U32
    public minDelay: number, // U32
  ) {
    super()
  }

  static decode(decoder: Decoder): SetCommissionChangeRate {
    const result = decoder.any3(U32, U32, U32)

    return new SetCommissionChangeRate(...result)
  }

  encode(): Uint8Array {
    return Encoder.concat(new U32(this.poolId), new U32(this.maxIncrease), new U32(this.minDelay))
  }
}

export class SetCommissionMax extends addHeader(PALLET_ID, 18) {
  constructor(
    public poolId: number /* u32 */,
    public maxCommission: number, // Perbill
  ) {
    super()
  }

  static decode(decoder: Decoder): SetCommissionMax {
    const result = decoder.any2(U32, U32)

    return new SetCommissionMax(...result)
  }

  encode(): Uint8Array {
    return Encoder.concat(new U32(this.poolId), new U32(this.maxCommission))
  }
}

export class SetMetadata extends addHeader(PALLET_ID, 10) {
  constructor(
    public poolId: number /* u32 */,
    public metadata: Uint8Array, // Vec<u8>
  ) {
    super()
  }

  static decode(decoder: Decoder): SetMetadata {
    const result = decoder.any2(U32, VecU8)

    return new SetMetadata(...result)
  }

  encode(): Uint8Array {
    return Encoder.concat(new U32(this.poolId), new VecU8(this.metadata))
  }
}

export class SetState extends addHeader(PALLET_ID, 9) {
  constructor(
    public poolId: number /* u32 */,
    public state: types.PoolStateValue, // Vec<u8>
  ) {
    super()
  }

  static decode(decoder: Decoder): SetState {
    const result = decoder.any2(U32, types.PoolState)

    return new SetState(...result)
  }

  encode(): Uint8Array {
    return Encoder.concat(new U32(this.poolId), new types.PoolState(this.state))
  }
}

export class Unbond extends addHeader(PALLET_ID, 3) {
  constructor(
    public memberAccount: MultiAddressValue,
    public unbondingPoints: BN, // Compact U128
  ) {
    super()
  }

  static decode(decoder: Decoder): Unbond {
    const result = decoder.any2(MultiAddress, CompactU128)

    return new Unbond(...result)
  }

  encode(): Uint8Array {
    return Encoder.concat(new MultiAddress(this.memberAccount), new CompactU128(this.unbondingPoints))
  }
}

export class UpdateRoles extends addHeader(PALLET_ID, 12) {
  constructor(
    public poolId: number, // U32
    public newRoot: types.ConfigOpAccountIdValue,
    public newNominator: types.ConfigOpAccountIdValue,
    public newBouncer: types.ConfigOpAccountIdValue,
  ) {
    super()
  }

  static decode(decoder: Decoder): UpdateRoles {
    const result = decoder.any4(U32, types.ConfigOpAccountId, types.ConfigOpAccountId, types.ConfigOpAccountId)

    return new UpdateRoles(...result)
  }

  encode(): Uint8Array {
    return Encoder.concat(
      new U32(this.poolId),
      new types.ConfigOpAccountId(this.newRoot),
      new types.ConfigOpAccountId(this.newNominator),
      new types.ConfigOpAccountId(this.newBouncer),
    )
  }
}

export class WithdrawUnbonded extends addHeader(PALLET_ID, 5) {
  constructor(
    public memberAccount: MultiAddressValue,
    public numSlashingSpans: number, // U32
  ) {
    super()
  }

  static decode(decoder: Decoder): WithdrawUnbonded {
    const result = decoder.any2(MultiAddress, U32)

    return new WithdrawUnbonded(...result)
  }

  encode(): Uint8Array {
    return Encoder.concat(new MultiAddress(this.memberAccount), new U32(this.numSlashingSpans))
  }
}
