import { AccountId, DispatchFeeModifier, H256 } from "./../../metadata"
import { CompactU32, VecU8, Decoder, Option, U128, U32, Encoder, U64, U8, Bool } from "../../scale"
import { StorageHasher, makeStorageDoubleMap, makeStorageMap, makeStorageValue } from "../../../interface"
import { BN, u8aConcat } from "../../polkadot"
import { PALLET_NAME } from "."
import { ClientError } from "../../../error"
import { Vec } from "../../scale/types"

export class ActiveEraInfo {
  constructor(
    public index: number /* u32 */,
    public start: BN | null /* Option<u64> */,
  ) {}
  static decode(decoder: Decoder): ActiveEraInfo | ClientError {
    const index = decoder.u32()
    if (index instanceof ClientError) return index
    const start = decoder.option(U64)
    if (start instanceof ClientError) return start

    return new ActiveEraInfo(index, start)
  }

  encode(): Uint8Array {
    const start = this.start != null ? new U64(this.start) : null
    return u8aConcat(new U32(this.index).encode(), Encoder.option(start))
  }
}

export class ValidatorsPerfs {
  public constructor(
    public commission: number,
    public blocked: boolean,
  ) {}
  static decode(decoder: Decoder): ValidatorsPerfs | ClientError {
    const result = decoder.any2(CompactPerbill, Bool)
    if (result instanceof ClientError) return result

    return new ValidatorsPerfs(...result)
  }

  encode(): Uint8Array {
    return Encoder.concat(new CompactPerbill(this.commission), new Bool(this.blocked))
  }
}

export class Perbill {
  constructor(public value: number) {}
  static decode(decoder: Decoder): number | ClientError {
    return decoder.u32()
  }

  encode(): Uint8Array {
    return Encoder.u32(this.value)
  }
}
export class CompactPerbill {
  constructor(public value: number) {}
  static decode(decoder: Decoder): number | ClientError {
    return decoder.u32(true)
  }

  encode(): Uint8Array {
    return Encoder.u32(this.value, true)
  }
}
export type ForcingValue = "NotForcing" | "ForceNew" | "ForceNone" | "ForceAlways"
export class Forcing {
  constructor(public value: ForcingValue) {}
  static decode(decoder: Decoder): ForcingValue | ClientError {
    const variant = decoder.u8()
    if (variant instanceof ClientError) return variant

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
        return new ClientError("Unknown Forcing")
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
  static decode(decoder: Decoder): [number, number] | ClientError {
    return decoder.any2(U32, U32)
  }

  encode(): Uint8Array {
    return Encoder.concat(new U32(this.value[0]), new U32(this.value[1]))
  }
}

export class BondedEraValue {
  constructor(public list: [number, number][]) {}
  static decode(decoder: Decoder): [number, number][] | ClientError {
    return decoder.vec(BondedEraSingleValue)
  }

  encode(): Uint8Array {
    return Encoder.vec(this.list.map((x) => new BondedEraSingleValue(x)))
  }
}

export class ClaimedRewards extends makeStorageDoubleMap<number, AccountId, number[]>({
  PALLET_NAME,
  STORAGE_NAME: "ClaimedRewards",
  KEY1_HASHER: "Twox64Concat",
  KEY2_HASHER: "Twox64Concat",
  decodeKey1: U32.decode,
  decodeKey2: AccountId.decode,
  encodeKey1: U32.encode,
  encodeKey2: AccountId.encode,
  decodeValue: (decoder: Decoder) => Vec.decode(U32, decoder),
}) {}

export class Validators extends makeStorageMap<AccountId, ValidatorsPerfs>({
  PALLET_NAME,
  STORAGE_NAME: "Validators",
  KEY_HASHER: "Twox64Concat",
  decodeKey: AccountId.decode,
  encodeKey: AccountId.encode,
  decodeValue: ValidatorsPerfs.decode,
}) {}

export class Bonded extends makeStorageMap<AccountId, AccountId>({
  PALLET_NAME,
  STORAGE_NAME: "Bonded",
  KEY_HASHER: "Twox64Concat",
  decodeKey: AccountId.decode,
  encodeKey: AccountId.encode,
  decodeValue: AccountId.decode,
}) {}

// export class Ledger extends makeStorageMap<AccountId, AccountId | null>({
//   PALLET_NAME,
//   STORAGE_NAME: "Ledger",
//   KEY_HASHER: new StorageHasher("Blake2_128Concat"),
//   decodeKey: AccountId.decode,
//   encodeKey: AccountId.encode,
//   decodeValue: (decoder: Decoder) => decoder.option(AccountId),
// }) { }

export class ActiveEra extends makeStorageValue<ActiveEraInfo>({
  PALLET_NAME,
  STORAGE_NAME: "ActiveEra",
  decodeValue: ActiveEraInfo.decode,
}) {}

export class BondedEras extends makeStorageValue<[number, number][]>({
  PALLET_NAME,
  STORAGE_NAME: "BondedEras",
  decodeValue: BondedEraValue.decode,
}) {}

export class MinValidatorBond extends makeStorageValue<BN>({
  PALLET_NAME,
  STORAGE_NAME: "MinValidatorBond",
  decodeValue: U128.decode,
}) {}

export class MinNominatorBond extends makeStorageValue<BN>({
  PALLET_NAME,
  STORAGE_NAME: "MinNominatorBond",
  decodeValue: U128.decode,
}) {}

export class MinimumActiveStake extends makeStorageValue<BN>({
  PALLET_NAME,
  STORAGE_NAME: "MinimumActiveStake",
  decodeValue: U128.decode,
}) {}

export class MinimumValidatorCount extends makeStorageValue<number>({
  PALLET_NAME,
  STORAGE_NAME: "MinimumValidatorCount",
  decodeValue: U32.decode,
}) {}

export class MaxValidatorsCount extends makeStorageValue<number | null>({
  PALLET_NAME,
  STORAGE_NAME: "MaxValidatorsCount",
  decodeValue: U32.decode,
}) {}

export class MaxNominatorsCount extends makeStorageValue<number | null>({
  PALLET_NAME,
  STORAGE_NAME: "MaxNominatorsCount",
  decodeValue: U32.decode,
}) {}

export class ValidatorCount extends makeStorageValue<number>({
  PALLET_NAME,
  STORAGE_NAME: "ValidatorCount",
  decodeValue: U32.decode,
}) {}

export class CurrentEra extends makeStorageValue<number | null>({
  PALLET_NAME,
  STORAGE_NAME: "CurrentEra",
  decodeValue: U32.decode,
}) {}

export class CurrentPlannedSession extends makeStorageValue<number | null>({
  PALLET_NAME,
  STORAGE_NAME: "CurrentPlannedSession",
  decodeValue: U32.decode,
}) {}

export class CounterForValidators extends makeStorageValue<number>({
  PALLET_NAME,
  STORAGE_NAME: "CounterForValidators",
  decodeValue: U32.decode,
}) {}

export class CounterForNominators extends makeStorageValue<number>({
  PALLET_NAME,
  STORAGE_NAME: "CounterForNominators",
  decodeValue: U32.decode,
}) {}

export class ForceEra extends makeStorageValue<ForcingValue>({
  PALLET_NAME,
  STORAGE_NAME: "ForceEra",
  decodeValue: Forcing.decode,
}) {}

export class MinCommission extends makeStorageValue<number>({
  PALLET_NAME,
  STORAGE_NAME: "MinCommission",
  decodeValue: Perbill.decode,
}) {}

export class ChillThreshold extends makeStorageValue<number>({
  PALLET_NAME,
  STORAGE_NAME: "ChillThreshold",
  decodeValue: U8.decode,
}) {}

export class CanceledSlashPayout extends makeStorageValue<BN>({
  PALLET_NAME,
  STORAGE_NAME: "CanceledSlashPayout",
  decodeValue: U128.decode,
}) {}
