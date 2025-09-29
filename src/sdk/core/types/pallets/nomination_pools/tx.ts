import { Encoder, Decoder, U32, CompactU128 } from "../../scale"
import { AvailError } from "../../../error"
import { addHeader } from "../."
import { PALLET_ID } from "."
import { AccountId, MultiAddress } from "../../metadata"
import * as types from "./types"
import { BN, u8aConcat } from "../../polkadot"
import { Vec, VecU8 } from "../../scale/types"

export class BondExtra extends addHeader(PALLET_ID, 1) {
  constructor(public value: types.BondExtraValue) {
    super()
  }

  static decode(decoder: Decoder): BondExtra | AvailError {
    const value = decoder.any1(types.BondExtra)
    if (value instanceof AvailError) return value
    return new BondExtra(value)
  }

  encode(): Uint8Array {
    return Encoder.any1(new types.BondExtra(this.value))
  }
}

export class BondExtraOther extends addHeader(PALLET_ID, 14) {
  constructor(
    public member: MultiAddress,
    public value: types.BondExtraValue,
  ) {
    super()
  }

  static decode(decoder: Decoder): BondExtraOther | AvailError {
    const result = decoder.any2(MultiAddress, types.BondExtra)
    if (result instanceof AvailError) return result

    return new BondExtraOther(...result)
  }

  encode(): Uint8Array {
    return Encoder.concat(this.member, new types.BondExtra(this.value))
  }
}

export class Chill extends addHeader(PALLET_ID, 13) {
  constructor(public poolId: number) {
    super()
  }

  static decode(decoder: Decoder): Chill | AvailError {
    const result = decoder.any1(U32)
    if (result instanceof AvailError) return result

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

  static decode(decoder: Decoder): ClaimCommission | AvailError {
    const result = decoder.any1(U32)
    if (result instanceof AvailError) return result

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

  static decode(_decoder: Decoder): ClaimPayout | AvailError {
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

  static decode(decoder: Decoder): ClaimPayoutOther | AvailError {
    const result = decoder.any1(AccountId)
    if (result instanceof AvailError) return result

    return new ClaimPayoutOther(result)
  }

  encode(): Uint8Array {
    return Encoder.concat(this.owner)
  }
}

export class Create extends addHeader(PALLET_ID, 6) {
  constructor(
    public amount: BN /* Compact U128 */,
    public root: MultiAddress,
    public nominator: MultiAddress,
    public bouncer: MultiAddress,
  ) {
    super()
  }

  static decode(decoder: Decoder): Create | AvailError {
    const result = decoder.any4(CompactU128, MultiAddress, MultiAddress, MultiAddress)
    if (result instanceof AvailError) return result

    return new Create(...result)
  }

  encode(): Uint8Array {
    return Encoder.concat(new CompactU128(this.amount), this.root, this.nominator, this.bouncer)
  }
}

export class CreateWithPoolId extends addHeader(PALLET_ID, 7) {
  constructor(
    public amount: BN /* Compact U128 */,
    public root: MultiAddress,
    public nominator: MultiAddress,
    public bouncer: MultiAddress,
    public poolId: number,
  ) {
    super()
  }

  static decode(decoder: Decoder): CreateWithPoolId | AvailError {
    const result = decoder.any5(CompactU128, MultiAddress, MultiAddress, MultiAddress, U32)
    if (result instanceof AvailError) return result

    return new CreateWithPoolId(...result)
  }

  encode(): Uint8Array {
    return Encoder.concat(new CompactU128(this.amount), this.root, this.nominator, this.bouncer, new U32(this.poolId))
  }
}

export class Join extends addHeader(PALLET_ID, 0) {
  constructor(
    public amount: BN /* Compact U128 */,
    public poolId: number,
  ) {
    super()
  }

  static decode(decoder: Decoder): Join | AvailError {
    const result = decoder.any2(CompactU128, U32)
    if (result instanceof AvailError) return result

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

  static decode(decoder: Decoder): Nominate | AvailError {
    const poolId = decoder.any1(U32)
    if (poolId instanceof AvailError) return poolId

    const validators = decoder.vec(AccountId)
    if (validators instanceof AvailError) return validators

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

  static decode(decoder: Decoder): SetClaimPermission | AvailError {
    const value = decoder.any1(types.ClaimPermission)
    if (value instanceof AvailError) return value

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

  static decode(decoder: Decoder): SetCommission | AvailError {
    const poolId = decoder.any1(U32)
    if (poolId instanceof AvailError) return poolId

    const newCommission = decoder.optionTuple(U32, AccountId)
    if (newCommission instanceof AvailError) return newCommission

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

  static decode(decoder: Decoder): SetCommissionChangeRate | AvailError {
    const result = decoder.any3(U32, U32, U32)
    if (result instanceof AvailError) return result

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

  static decode(decoder: Decoder): SetCommissionMax | AvailError {
    const result = decoder.any2(U32, U32)
    if (result instanceof AvailError) return result

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

  static decode(decoder: Decoder): SetMetadata | AvailError {
    const result = decoder.any2(U32, VecU8)
    if (result instanceof AvailError) return result

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

  static decode(decoder: Decoder): SetState | AvailError {
    const result = decoder.any2(U32, types.PoolState)
    if (result instanceof AvailError) return result

    return new SetState(...result)
  }

  encode(): Uint8Array {
    return Encoder.concat(new U32(this.poolId), new types.PoolState(this.state))
  }
}

export class Unbond extends addHeader(PALLET_ID, 3) {
  constructor(
    public memberAccount: MultiAddress,
    public unbondingPoints: BN, // Compact U128
  ) {
    super()
  }

  static decode(decoder: Decoder): Unbond | AvailError {
    const result = decoder.any2(MultiAddress, CompactU128)
    if (result instanceof AvailError) return result

    return new Unbond(...result)
  }

  encode(): Uint8Array {
    return Encoder.concat(this.memberAccount, new CompactU128(this.unbondingPoints))
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

  static decode(decoder: Decoder): UpdateRoles | AvailError {
    const result = decoder.any4(U32, types.ConfigOpAccountId, types.ConfigOpAccountId, types.ConfigOpAccountId)
    if (result instanceof AvailError) return result

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
    public memberAccount: MultiAddress,
    public numSlashingSpans: number, // U32
  ) {
    super()
  }

  static decode(decoder: Decoder): WithdrawUnbonded | AvailError {
    const result = decoder.any2(MultiAddress, U32)
    if (result instanceof AvailError) return result

    return new WithdrawUnbonded(...result)
  }

  encode(): Uint8Array {
    return Encoder.concat(this.memberAccount, new U32(this.numSlashingSpans))
  }
}
