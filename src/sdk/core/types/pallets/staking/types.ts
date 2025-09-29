import { Encoder, Decoder, U64, U32, Bool, CompactU128, CompactU32 } from "../../scale"
import { AvailError } from "../../../error"
import { AccountId } from "../../metadata"
import { BN, u8aConcat } from "../../polkadot"
import { Vec } from "../../scale/types"
import { IEncodable } from "../../../interface"

export type ConfigOpValue<T> = "Noop" | { Set: T & IEncodable } | "Remove"
export class ConfigOp {
  static encode<T>(value: ConfigOpValue<T>): Uint8Array {
    if (value == "Noop") return Encoder.u8(0)
    if (value == "Remove") return Encoder.u8(2)

    // NoLayer
    return Encoder.enum(2, value.Set.encode())
  }
}

export type RewardDestinationValue = "Staked" | "Stash" | "Controller" | { Account: AccountId } | "None"
export class RewardDestination {
  constructor(public value: RewardDestinationValue) {}
  static decode(decoder: Decoder): RewardDestinationValue | AvailError {
    const variant = decoder.u8()
    if (variant instanceof AvailError) return variant
    if (variant == 0) return "Staked"
    if (variant == 1) return "Stash"
    if (variant == 2) return "Controller"
    if (variant == 3) {
      const accountId = decoder.any1(AccountId)
      if (accountId instanceof AvailError) return accountId

      return { Account: accountId }
    }
    if (variant == 4) return "None"

    return new AvailError("Unknown RewardDestination")
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

export class ActiveEraInfo {
  constructor(
    public index: number /* u32 */,
    public start: BN | null /* Option<u64> */,
  ) {}
  static decode(decoder: Decoder): ActiveEraInfo | AvailError {
    const index = decoder.u32()
    if (index instanceof AvailError) return index
    const start = decoder.option(U64)
    if (start instanceof AvailError) return start

    return new ActiveEraInfo(index, start)
  }

  encode(): Uint8Array {
    const start = this.start != null ? new U64(this.start) : null
    return u8aConcat(new U32(this.index).encode(), Encoder.option(start))
  }
}

export class ValidatorPerfs {
  public constructor(
    public commission: number, // Compact Perbill
    public blocked: boolean,
  ) {}
  static decode(decoder: Decoder): ValidatorPerfs | AvailError {
    const result = decoder.any2(CompactPerbill, Bool)
    if (result instanceof AvailError) return result

    return new ValidatorPerfs(...result)
  }

  encode(): Uint8Array {
    return Encoder.concat(new CompactPerbill(this.commission), new Bool(this.blocked))
  }
}

export class Perbill {
  constructor(public value: number) {}
  static decode(decoder: Decoder): number | AvailError {
    return decoder.u32()
  }

  encode(): Uint8Array {
    return Encoder.u32(this.value)
  }
}
export class CompactPerbill {
  constructor(public value: number) {}
  static decode(decoder: Decoder): number | AvailError {
    return decoder.u32(true)
  }

  encode(): Uint8Array {
    return Encoder.u32(this.value, true)
  }
}
export type ForcingValue = "NotForcing" | "ForceNew" | "ForceNone" | "ForceAlways"
export class Forcing {
  constructor(public value: ForcingValue) {}
  static decode(decoder: Decoder): ForcingValue | AvailError {
    const variant = decoder.u8()
    if (variant instanceof AvailError) return variant

    switch (variant) {
      case 0:
        return "NotForcing"
      case 1:
        return "ForceNew"
      case 2:
        return "ForceNone"
      case 3:
        return "ForceAlways"
      default:
        return new AvailError("Unknown Forcing")
    }
  }

  encode(): Uint8Array {
    if (this.value == "NotForcing") return Encoder.u8(0)
    if (this.value == "ForceNew") return Encoder.u8(1)
    if (this.value == "ForceNone") return Encoder.u8(2)

    // ForceAlways
    return Encoder.u8(3)
  }
}

export class BondedEraSingleValue {
  constructor(public value: [number, number]) {}
  static decode(decoder: Decoder): [number, number] | AvailError {
    return decoder.any2(U32, U32)
  }

  encode(): Uint8Array {
    return Encoder.concat(new U32(this.value[0]), new U32(this.value[1]))
  }
}

export class BondedEraValue {
  constructor(public list: [number, number][]) {}
  static decode(decoder: Decoder): [number, number][] | AvailError {
    return decoder.vec(BondedEraSingleValue)
  }

  encode(): Uint8Array {
    return Encoder.vec(this.list.map((x) => new BondedEraSingleValue(x)))
  }
}

export class IndividualEraRewardPoint {
  constructor(public value: [AccountId, number]) {}
  static decode(decoder: Decoder): [AccountId, number] | AvailError {
    return decoder.any2(AccountId, U32)
  }

  encode(): Uint8Array {
    return Encoder.concat(this.value[0], new U32(this.value[1]))
  }
}

export class EraRewardPoints {
  constructor(
    public total: number,
    public individual: [AccountId, number][],
  ) {}
  static decode(decoder: Decoder): EraRewardPoints | AvailError {
    const total = decoder.any1(U32)
    if (total instanceof AvailError) return total
    const individual = decoder.vec(IndividualEraRewardPoint)
    if (individual instanceof AvailError) return individual

    return new EraRewardPoints(total, individual)
  }

  encode(): Uint8Array {
    return u8aConcat(
      new U32(this.total).encode(),
      Vec.encode(this.individual.map((x) => new IndividualEraRewardPoint(x))),
    )
  }
}

export class PagedExposureMetadata {
  constructor(
    public total: BN /*Compact U128 */,
    public own: BN /* Compact U128 */,
    public nominatorCount: number /* U32 */,
    public pageCount: number /* U32 */,
  ) {}

  static decode(decoder: Decoder): PagedExposureMetadata | AvailError {
    const result = decoder.any4(CompactU128, CompactU128, U32, U32)
    if (result instanceof AvailError) return result

    return new PagedExposureMetadata(...result)
  }

  encode(): Uint8Array {
    return Encoder.concat(
      new CompactU128(this.total),
      new CompactU128(this.own),
      new U32(this.nominatorCount),
      new U32(this.pageCount),
    )
  }
}

export class UnlockChunk {
  constructor(
    public value: BN /* Compact U128 */,
    public era: number /* Compact U32 */,
  ) {}

  static decode(decoder: Decoder): UnlockChunk | AvailError {
    const result = decoder.any2(CompactU128, CompactU32)
    if (result instanceof AvailError) return result

    return new UnlockChunk(...result)
  }

  encode(): Uint8Array {
    return Encoder.concat(new CompactU128(this.value), new CompactU32(this.era))
  }
}

export class StakingLedger {
  constructor(
    public stash: AccountId,
    public total: BN /* Compact U128 */,
    public active: BN /* Compact U128 */,
    public unlocking: UnlockChunk[] /* Vec<UnlockChunk> */,
    public legacyClaimedRewards: number[] /* Vec<U32> */,
  ) {}

  static decode(decoder: Decoder): StakingLedger | AvailError {
    const stash = decoder.any1(AccountId)
    if (stash instanceof AvailError) return stash

    const total = decoder.any1(CompactU128)
    if (total instanceof AvailError) return total

    const active = decoder.any1(CompactU128)
    if (active instanceof AvailError) return active

    const unlocking = decoder.vec(UnlockChunk)
    if (unlocking instanceof AvailError) return unlocking

    const legacyClaimedRewards = decoder.vec(U32)
    if (legacyClaimedRewards instanceof AvailError) return legacyClaimedRewards

    return new StakingLedger(stash, total, active, unlocking, legacyClaimedRewards)
  }

  encode(): Uint8Array {
    return u8aConcat(
      this.stash.encode(),
      new CompactU128(this.total).encode(),
      new CompactU128(this.active).encode(),
      Vec.encode(this.unlocking),
      Vec.encode(this.legacyClaimedRewards.map((x) => new U32(x))),
    )
  }
}

export class Nominations {
  constructor(
    public targets: AccountId[], // Vec<AccountId>
    public submittedIn: number, // U32
    public suppressed: boolean,
  ) {}

  static decode(decoder: Decoder): Nominations | AvailError {
    const targets = decoder.vec(AccountId)
    if (targets instanceof AvailError) return targets

    const submittedIn = decoder.any1(U32)
    if (submittedIn instanceof AvailError) return submittedIn

    const suppressed = decoder.any1(Bool)
    if (suppressed instanceof AvailError) return suppressed

    return new Nominations(targets, submittedIn, suppressed)
  }

  encode(): Uint8Array {
    return u8aConcat(
      Vec.encode(this.targets),
      new CompactU32(this.submittedIn).encode(),
      new Bool(this.suppressed).encode(),
    )
  }
}

export class SlashingSpansStruct {
  constructor(
    public spanIndex: number, // U32
    public lastStart: number, // U32
    public lastNonZeroSlash: number, // U32
    public prior: number[], // Vec<U32>
  ) {}

  static decode(decoder: Decoder): SlashingSpansStruct | AvailError {
    const spanIndex = decoder.any1(U32)
    if (spanIndex instanceof AvailError) return spanIndex

    const lastStart = decoder.any1(U32)
    if (lastStart instanceof AvailError) return lastStart

    const lastNonZeroSlash = decoder.any1(U32)
    if (lastNonZeroSlash instanceof AvailError) return lastNonZeroSlash

    const prior = decoder.vec(U32)
    if (prior instanceof AvailError) return prior

    return new SlashingSpansStruct(spanIndex, lastStart, lastNonZeroSlash, prior)
  }

  encode(): Uint8Array {
    return u8aConcat(
      new U32(this.spanIndex).encode(),
      new U32(this.lastStart).encode(),
      new U32(this.lastNonZeroSlash).encode(),
      Vec.encode(this.prior.map((x) => new U32(x))),
    )
  }
}
