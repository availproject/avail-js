import { Encoder, Decoder, CompactU128 } from "../../scale"
import { ClientError } from "../../../error"
import { addHeader } from "../../../interface"
import { PALLET_ID } from "."
import { BN } from "../../polkadot"
import * as types from "./types"

export class Bond extends addHeader(PALLET_ID, 0) {
  constructor(
    public value: BN, // Compact U128
    public payee: types.RewardDestinationValue,
  ) {
    super()
  }

  static decode(decoder: Decoder): Bond | ClientError {
    const result = decoder.any2(CompactU128, types.RewardDestination)
    if (result instanceof ClientError) return result

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

  static decode(decoder: Decoder): BondExtra | ClientError {
    const result = decoder.any1(CompactU128)
    if (result instanceof ClientError) return result

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

  static decode(decoder: Decoder): Unbond | ClientError {
    const result = decoder.any1(CompactU128)
    if (result instanceof ClientError) return result

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

  static decode(decoder: Decoder): Rebond | ClientError {
    const result = decoder.any1(CompactU128)
    if (result instanceof ClientError) return result

    return new Rebond(result)
  }

  encode(): Uint8Array {
    return Encoder.concat(new CompactU128(this.value))
  }
}
