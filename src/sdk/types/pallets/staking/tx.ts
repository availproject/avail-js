import { Encoder, Decoder, CompactU128 } from "../../scale"
import { ClientError } from "../../../error"
import { addHeader } from "../../../interface"
import { PALLET_ID } from "."
import { AccountId } from "../../metadata"
import { BN } from "../../polkadot"

export type RewardDestinationValue = "Staked" | "Stash" | "Controller" | { Account: AccountId } | "None"
export class RewardDestination {
  constructor(public value: RewardDestinationValue) {}
  static decode(decoder: Decoder): RewardDestination | ClientError {
    const variant = decoder.u8()
    if (variant instanceof ClientError) return variant

    switch (variant) {
      case 0:
        return new RewardDestination("Staked")
      case 1:
        return new RewardDestination("Stash")
      case 2:
        return new RewardDestination("Controller")
      case 3:
        const accountId = decoder.any1(AccountId)
        if (accountId instanceof ClientError) return accountId

        return new RewardDestination({ Account: accountId })
      case 4:
        return new RewardDestination("None")
      default:
        return new ClientError("Unknown RewardDestination")
    }
  }

  encode(): Uint8Array {
    if (this.value == "Staked") return Encoder.u8(0)
    if (this.value == "Stash") return Encoder.u8(1)
    if (this.value == "Controller") return Encoder.u8(2)
    if (this.value == "None") return Encoder.u8(4)

    // NoLayer
    return Encoder.enum(3, this.value.Account)
  }
}

export class Bond extends addHeader(PALLET_ID, 0) {
  constructor(
    public value: BN, // Compact U128
    public payee: RewardDestinationValue,
  ) {
    super()
  }

  static decode(decoder: Decoder): Bond | ClientError {
    const result = decoder.any2(CompactU128, RewardDestination)
    if (result instanceof ClientError) return result

    return new Bond(result[0], result[1].value)
  }

  encode(): Uint8Array {
    return Encoder.concat(new CompactU128(this.value), new RewardDestination(this.payee))
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
