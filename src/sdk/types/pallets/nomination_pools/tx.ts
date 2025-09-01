import { Encoder, Decoder, U32, CompactU128 } from "../../scale"
import { ClientError } from "../../../error"
import { addHeader } from "../../../interface"
import { PALLET_ID } from "."
import { AccountId, MultiAddress } from "../../metadata"
import * as types from "./types"
import { BN } from "../../polkadot"

export class BondExtra extends addHeader(PALLET_ID, 1) {
  constructor(public value: types.BondExtraValue) {
    super()
  }

  static decode(decoder: Decoder): BondExtra | ClientError {
    const value = decoder.any1(types.BondExtra)
    if (value instanceof ClientError) return value
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

  static decode(decoder: Decoder): BondExtraOther | ClientError {
    const result = decoder.any2(MultiAddress, types.BondExtra)
    if (result instanceof ClientError) return result

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

  static decode(decoder: Decoder): Chill | ClientError {
    const result = decoder.any1(U32)
    if (result instanceof ClientError) return result

    return new Chill(result)
  }

  encode(): Uint8Array {
    return Encoder.concat(new U32(this.poolId))
  }
}

export class ClaimCommission extends addHeader(PALLET_ID, 20) {
  constructor(public poolId: number) {
    super()
  }

  static decode(decoder: Decoder): ClaimCommission | ClientError {
    const result = decoder.any1(U32)
    if (result instanceof ClientError) return result

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

  static decode(_decoder: Decoder): ClaimPayout | ClientError {
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

  static decode(decoder: Decoder): ClaimPayoutOther | ClientError {
    const result = decoder.any1(AccountId)
    if (result instanceof ClientError) return result

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

  static decode(decoder: Decoder): Create | ClientError {
    const result = decoder.any4(CompactU128, MultiAddress, MultiAddress, MultiAddress)
    if (result instanceof ClientError) return result

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

  static decode(decoder: Decoder): CreateWithPoolId | ClientError {
    const result = decoder.any5(CompactU128, MultiAddress, MultiAddress, MultiAddress, U32)
    if (result instanceof ClientError) return result

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

  static decode(decoder: Decoder): Join | ClientError {
    const result = decoder.any2(CompactU128, U32)
    if (result instanceof ClientError) return result

    return new Join(...result)
  }

  encode(): Uint8Array {
    return Encoder.concat(new CompactU128(this.amount), new U32(this.poolId))
  }
}
