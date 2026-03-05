import { type IEncodable, Encoder } from "./encoder"
import { type IDecodable, Decoder } from "./decoder"
import { blake2AsU8a, BN, Struct, u8aConcat, xxhashAsU8a } from "../polkadot"
import { DecodeError, EnumDecodeError, HashComputationError, ValidationError } from "../../errors/sdk-error"
import {
  type Extension,
  type EraValue,
  type MultiAddress,
  AccountId,
  type MultiSignature,
  type Pays,
  type DispatchInfo,
  type DispatchClass,
  type RuntimeDispatchInfo,
  type Weight,
  type PerDispatchClassWeight,
  type DispatchFeeModifier,
  type DispatchResult,
  type DispatchError,
  type AccountInfo,
  type AccountData,
  type AuthorityList,
  H256,
  type PerDispatchClassU32,
  type FeeDetails,
  type InclusionFee,
  type ModuleError,
  type TransactionalError,
  type TokenError,
  type ArithmeticError,
  type StorageHasher,
} from "../types"
import { mergeArrays } from "../utils"

export class VecU8 {
  constructor(public value: Uint8Array) {}

  static decode(decoder: Decoder): Uint8Array {
    return decoder.vecU8()
  }

  static encode(value: Uint8Array): Uint8Array {
    return Encoder.vecU8(value)
  }

  encode(): Uint8Array {
    return Encoder.vecU8(this.value)
  }
}

export class ArrayU8L65 {
  constructor(public value: Uint8Array) {}

  static decode(decoder: Decoder): Uint8Array {
    return decoder.bytes(65)
  }

  static encode(value: Uint8Array): Uint8Array {
    return value
  }

  encode(): Uint8Array {
    return this.value
  }
}

export class ArrayU8L64 {
  constructor(public value: Uint8Array) {}

  static decode(decoder: Decoder): Uint8Array {
    return decoder.bytes(64)
  }

  static encode(value: Uint8Array): Uint8Array {
    return value
  }

  encode(): Uint8Array {
    return this.value
  }
}

export class ArrayU8L32 {
  constructor(public value: Uint8Array) {}

  static decode(decoder: Decoder): Uint8Array {
    return decoder.bytes(32)
  }

  static encode(value: Uint8Array): Uint8Array {
    return value
  }

  encode(): Uint8Array {
    return this.value
  }
}

export class ArrayU8L20 {
  constructor(public value: Uint8Array) {}

  static decode(decoder: Decoder): Uint8Array {
    return decoder.bytes(20)
  }

  static encode(value: Uint8Array): Uint8Array {
    return value
  }

  encode(): Uint8Array {
    return this.value
  }
}

export class Tuple {
  constructor(public values: IEncodable[]) {}
  encode(): Uint8Array {
    return Encoder.vec(this.values)
  }
}

export class Vec {
  static decode<T>(as: IDecodable<T>, decoder: Decoder): T[] {
    return decoder.vec(as)
  }

  static encode<T>(list: (T & IEncodable)[]): Uint8Array {
    return Encoder.vec(list)
  }
}

export class Bool {
  constructor(public value: boolean) {}

  static decode(decoder: Decoder): boolean {
    const byte = decoder.u8()
    if (byte == 0) return false
    if (byte == 1) return true

    throw new DecodeError("Invalid boolean value.")
  }

  static encode(value: boolean): Uint8Array {
    return Encoder.bool(value)
  }

  encode(): Uint8Array {
    return Encoder.bool(this.value)
  }
}

export class U8 {
  constructor(public value: number) {}

  static decode(decoder: Decoder): number {
    return decoder.u8()
  }

  static encode(value: number): Uint8Array {
    return Encoder.u8(value, false)
  }

  encode(): Uint8Array {
    return Encoder.u8(this.value, false)
  }
}

export class CompactU8 {
  constructor(public value: number) {}

  static decode(decoder: Decoder): number {
    return decoder.u8(true)
  }

  static encode(value: number): Uint8Array {
    return Encoder.u8(value, true)
  }

  encode(): Uint8Array {
    return Encoder.u8(this.value, true)
  }
}

export class U16 {
  constructor(public value: number) {}

  static decode(decoder: Decoder): number {
    return decoder.u16()
  }

  static encode(value: number): Uint8Array {
    return Encoder.u16(value, false)
  }

  encode(): Uint8Array {
    return Encoder.u16(this.value, false)
  }
}

export class CompactU16 {
  constructor(public value: number) {}

  static decode(decoder: Decoder): number {
    return decoder.u16(true)
  }

  static encode(value: number): Uint8Array {
    return Encoder.u16(value, true)
  }

  encode(): Uint8Array {
    return Encoder.u16(this.value, true)
  }
}

export class U32 {
  constructor(public value: number) {}

  static decode(decoder: Decoder): number {
    return decoder.u32()
  }

  static encode(value: number): Uint8Array {
    return Encoder.u32(value, false)
  }

  encode(): Uint8Array {
    return Encoder.u32(this.value, false)
  }
}

export class CompactU32 {
  constructor(public value: number) {}

  static decode(decoder: Decoder): number {
    return decoder.u32(true)
  }

  static encode(value: number): Uint8Array {
    return Encoder.u32(value, true)
  }

  encode(): Uint8Array {
    return Encoder.u32(this.value, true)
  }
}

export class U64 {
  constructor(public value: BN) {}

  static decode(decoder: Decoder): BN {
    return decoder.u64()
  }

  static encode(value: BN): Uint8Array {
    return Encoder.u64(value, false)
  }

  encode(): Uint8Array {
    return Encoder.u64(this.value, false)
  }
}

export class CompactU64 {
  constructor(public value: BN) {}

  static decode(decoder: Decoder): BN {
    return decoder.u64(true)
  }

  static encode(value: BN): Uint8Array {
    return Encoder.u64(value, true)
  }

  encode(): Uint8Array {
    return Encoder.u64(this.value, true)
  }
}

export class U128 {
  constructor(public value: BN) {}

  static decode(decoder: Decoder): BN {
    return decoder.u128()
  }

  static encode(value: BN): Uint8Array {
    return Encoder.u128(value, false)
  }

  encode(): Uint8Array {
    return Encoder.u128(this.value, false)
  }
}

export class CompactU128 {
  constructor(public value: BN) {}

  static decode(decoder: Decoder): BN {
    return decoder.u128(true)
  }

  static encode(value: BN): Uint8Array {
    return Encoder.u128(value, true)
  }

  encode(): Uint8Array {
    return Encoder.u128(this.value, true)
  }
}

export class Option {
  static decode<T>(as: IDecodable<T>, decoder: Decoder): T | null {
    return decoder.option(as)
  }

  static encode(value: IEncodable | null): Uint8Array {
    return Encoder.option(value)
  }
}

export class AlreadyEncoded {
  value: Uint8Array
  constructor(value: Uint8Array) {
    this.value = value
  }

  static decode(decoder: Decoder): AlreadyEncoded {
    return new AlreadyEncoded(decoder.consumeRemainingBytes())
  }

  static encode(value: Uint8Array): Uint8Array {
    return value
  }

  encode(): Uint8Array {
    return this.value
  }
}

export class EraScale {
  constructor(public value: EraValue) {}

  static decode(decoder: Decoder): EraValue {
    const first = decoder.u8()

    if (first == 0) return "Immortal"

    const nextByte = decoder.byte()
    const encoded = first + (nextByte << 8)
    const period = 2 << (encoded % (1 << 4))
    const quantizeFactorTmp = period >> 12
    const quantizeFactor = quantizeFactorTmp > 1 ? quantizeFactorTmp : 1
    const phase = (encoded >> 4) * quantizeFactor
    if (period >= 4 && phase < period) return { Mortal: [period, phase] }

    throw new DecodeError("Invalid period and phase")
  }

  isImmortal(): boolean {
    return this.value == "Immortal"
  }

  asMortal(): [number, number] {
    if (this.value == "Immortal") throw new ValidationError("Era is not Mortal")

    return this.value.Mortal
  }

  isMortal(): boolean {
    return !this.isImmortal()
  }
}

export class ExtensionScale {
  constructor(public value: Extension) {}

  static decode(decoder: Decoder): Extension {
    const era = EraScale.decode(decoder)
    const nonce = decoder.u32(true)
    const tip = decoder.u128(true)

    return { era, nonce, tip }
  }
}

export class MultiAddressScale {
  constructor(public value: MultiAddress) {}

  /// Can Throw
  asId(): AccountId {
    if (!("Id" in this.value)) throw new ValidationError("AccountID has no ID.")
    return this.value.Id
  }

  static decode(decoder: Decoder): MultiAddress {
    const variant = decoder.u8()

    if (variant == 0) {
      const id = AccountIdScale.decode(decoder)
      return { Id: id }
    }
    if (variant == 1) {
      const index = CompactU32.decode(decoder)
      return { Index: index }
    }
    if (variant == 2) {
      const raw = decoder.vecU8()
      return { Raw: raw }
    }
    if (variant == 3) {
      const address32 = decoder.any1(ArrayU8L32)
      return { Address32: address32 }
    }
    if (variant == 4) {
      const address20 = decoder.any1(ArrayU8L20)
      return { Address20: address20 }
    }

    throw new EnumDecodeError("Unknown MultiAddress. Cannot Decode")
  }

  static encode(value: MultiAddress): Uint8Array {
    if ("Id" in value) return Encoder.enum(0, new AccountIdScale(value.Id))
    if ("Index" in value) return Encoder.enum(1, Encoder.u32(value.Index, true))
    if ("Raw" in value) return Encoder.enum(2, Encoder.vecU8(value.Raw))
    if ("Address32" in value) return Encoder.enum(3, value.Address32)

    // Address20
    return Encoder.enum(4, value.Address20)
  }

  encode(): Uint8Array {
    return MultiAddressScale.encode(this.value)
  }
}

export class MultiSignatureScale {
  constructor(public value: MultiSignature) {}

  static encode(value: MultiSignature): Uint8Array {
    if ("Ed25519" in value) return Encoder.enum(0, value.Ed25519)
    if ("Sr25519" in value) return Encoder.enum(1, value.Sr25519)

    // Ecdsa
    return Encoder.enum(2, value.Ecdsa)
  }

  encode(): Uint8Array {
    return MultiSignatureScale.encode(this.value)
  }

  static decode(decoder: Decoder): MultiSignature {
    const variant = decoder.u8()

    switch (variant) {
      case 0: {
        const ed25519 = decoder.any1(ArrayU8L64)
        return { Ed25519: ed25519 }
      }
      case 1: {
        const sr25519 = decoder.any1(ArrayU8L64)
        return { Sr25519: sr25519 }
      }
      case 2: {
        const ecdsa = decoder.any1(ArrayU8L65)
        return { Ecdsa: ecdsa }
      }
      default:
        throw new EnumDecodeError("Unknown MultiSignature")
    }
  }
}

export class PaysScale {
  constructor(public value: Pays) {}

  static encode(value: Pays): Uint8Array {
    switch (value) {
      case "Yes":
        return Encoder.u8(0)
      case "No":
        return Encoder.u8(0)
    }
  }

  encode(): Uint8Array {
    return PaysScale.encode(this.value)
  }

  static decode(decoder: Decoder): Pays {
    const variant = decoder.u8()

    switch (variant) {
      case 0:
        return "Yes"
      case 1:
        return "No"
      default:
        throw new DecodeError("Failed to decode Pays")
    }
  }
}

export class DispatchInfoScale {
  constructor(public value: DispatchInfo) {}

  static encode(value: DispatchInfo): Uint8Array {
    return mergeArrays([
      Encoder.any1(new WeightScale(value.weight)),
      Encoder.any1(new DispatchClassScale(value.c)),
      Encoder.any1(new PaysScale(value.pays)),
      Encoder.any1(new DispatchFeeModifierScale(value.feeModifier)),
    ])
  }

  encode(): Uint8Array {
    return DispatchInfoScale.encode(this.value)
  }

  static decode(decoder: Decoder): DispatchInfo {
    const weight = decoder.any1(WeightScale)
    const c = decoder.any1(DispatchClassScale)
    const pays = decoder.any1(PaysScale)
    const feeModifier = decoder.any1(DispatchFeeModifierScale)

    return { weight, c, pays, feeModifier }
  }
}

export class DispatchClassScale {
  constructor(public value: DispatchClass) {}

  static encode(value: DispatchClass): Uint8Array {
    switch (value) {
      case "Normal":
        return Encoder.u8(0)
      case "Operational":
        return Encoder.u8(1)
      case "Mandatory":
        return Encoder.u8(2)
    }
  }

  encode(): Uint8Array {
    return DispatchClassScale.encode(this.value)
  }

  static decode(decoder: Decoder): DispatchClass {
    const variant = decoder.u8()

    switch (variant) {
      case 0:
        return "Normal"
      case 1:
        return "Operational"
      case 2:
        return "Mandatory"
      default:
        throw new EnumDecodeError("Unknown DispatchClass")
    }
  }
}

export class RuntimeDispatchInfoScale {
  constructor(public value: RuntimeDispatchInfo) {}

  static decode(decoder: Decoder): RuntimeDispatchInfo {
    const weight = WeightScale.decode(decoder)
    const c = DispatchClassScale.decode(decoder)
    const partialFee = decoder.u128()

    return { weight, c, partialFee }
  }
}

export class WeightScale {
  // public refTime: BN // Compact
  // public proofSize: BN // Compact

  constructor(public value: Weight) {}

  static decode(decoder: Decoder): Weight {
    const refTime = decoder.u64(true)
    const proofSize = decoder.u64(true)

    return { proofSize, refTime }
  }

  static encode(value: Weight): Uint8Array {
    return mergeArrays([Encoder.u64(value.refTime, true), Encoder.u64(value.proofSize, true)])
  }

  encode(): Uint8Array {
    return WeightScale.encode(this.value)
  }
}

export class PerDispatchClassWeightScale {
  constructor(public value: PerDispatchClassWeight) {}

  static decode(decoder: Decoder): PerDispatchClassWeight {
    const result = decoder.any3(WeightScale, WeightScale, WeightScale)
    return { normal: result[0], operational: result[1], mandatory: result[2] }
  }

  static encode(value: PerDispatchClassWeight): Uint8Array {
    return u8aConcat(
      WeightScale.encode(value.normal),
      WeightScale.encode(value.operational),
      WeightScale.encode(value.mandatory),
    )
  }

  encode(): Uint8Array {
    return PerDispatchClassWeightScale.encode(this.value)
  }
}

export class DispatchFeeModifierScale {
  constructor(public value: DispatchFeeModifier) {}

  static encode(value: DispatchFeeModifier): Uint8Array {
    const weightMaximumFee = Encoder.option(value.weightMaximumFee ? new U128(value.weightMaximumFee) : null)
    const weightFeeDivider = Encoder.option(value.weightFeeDivider ? new U32(value.weightFeeDivider) : null)
    const weightFeeMultiplier = Encoder.option(value.weightFeeMultiplier ? new U32(value.weightFeeMultiplier) : null)
    return mergeArrays([weightMaximumFee, weightFeeDivider, weightFeeMultiplier])
  }

  encode(): Uint8Array {
    return DispatchFeeModifierScale.encode(this.value)
  }

  static decode(decoder: Decoder): DispatchFeeModifier {
    const weightMaximumFee = decoder.option(U128)
    const weightFeeDivider = decoder.option(U32)
    const weightFeeMultiplier = decoder.option(U32)

    return { weightMaximumFee, weightFeeDivider, weightFeeMultiplier }
  }
}

export class DispatchResultScale {
  constructor(public value: DispatchResult) {}

  static decode(decoder: Decoder): DispatchResult {
    const variant = decoder.u8()

    switch (variant) {
      case 0:
        return "Ok"
      case 1: {
        const err = DispatchErrorScale.decode(decoder)
        return { Err: err }
      }
      default:
        throw new DecodeError("Failed to decode DispatchResult")
    }
  }

  static encode(value: DispatchResult): Uint8Array {
    if (value == "Ok") return Encoder.u8(0)
    return u8aConcat(Encoder.u8(1), Encoder.any1(new DispatchErrorScale(value.Err)))
  }

  encode(): Uint8Array {
    return DispatchResultScale.encode(this.value)
  }
}

export class DispatchErrorScale {
  constructor(public value: DispatchError) {}

  static encode(value: DispatchError): Uint8Array {
    if (value == "Other") return Encoder.u8(0)
    if (value == "CannotLookup") return Encoder.u8(1)
    if (value == "BadOrigin") return Encoder.u8(2)
    if (value == "ConsumerRemaining") return Encoder.u8(4)
    if (value == "NoProviders") return Encoder.u8(5)
    if (value == "TooManyConsumers") return Encoder.u8(6)
    if (value == "Exhausted") return Encoder.u8(10)
    if (value == "Corruption") return Encoder.u8(11)
    if (value == "Unavailable") return Encoder.u8(12)
    if (value == "RootNotAllowed") return Encoder.u8(13)
    if ("Module" in value) return Encoder.enum(3, new ModuleErrorScale(value.Module))
    if ("Token" in value) return Encoder.enum(7, new TokenErrorScale(value.Token))
    if ("Arithmetic" in value) return Encoder.enum(8, new ArithmeticErrorScale(value.Arithmetic))

    // Transactional
    return Encoder.enum(9, new TransactionalErrorScale(value.Transactional))
  }

  encode(): Uint8Array {
    return DispatchErrorScale.encode(this.value)
  }

  static decode(decoder: Decoder): DispatchError {
    const variant = decoder.u8()

    switch (variant) {
      case 0:
        return "Other"
      case 1:
        return "CannotLookup"
      case 2:
        return "BadOrigin"
      case 3: {
        const module = ModuleErrorScale.decode(decoder)
        return { Module: module }
      }
      case 4:
        return "ConsumerRemaining"
      case 5:
        return "NoProviders"
      case 6:
        return "TooManyConsumers"
      case 7: {
        const token = TokenErrorScale.decode(decoder)
        return { Token: token }
      }
      case 8: {
        const arithmetic = ArithmeticErrorScale.decode(decoder)
        return { Arithmetic: arithmetic }
      }
      case 9: {
        const transactional = TransactionalErrorScale.decode(decoder)
        return { Transactional: transactional }
      }
      case 10:
        return "Exhausted"
      case 11:
        return "Corruption"
      case 12:
        return "Unavailable"
      case 13:
        return "RootNotAllowed"
      default:
        throw new EnumDecodeError("Unknown DispatchError")
    }
  }
}

export class AccountInfoScale {
  constructor(public value: AccountInfo) {}

  static decode(decoder: Decoder): AccountInfo {
    const result = decoder.any5(U32, U32, U32, U32, AccountDataScale)

    return { nonce: result[0], consumers: result[1], providers: result[2], sufficients: result[3], data: result[4] }
  }

  static encode(value: AccountInfo): Uint8Array {
    return Encoder.concat(
      new U32(value.nonce),
      new U32(value.consumers),
      new U32(value.providers),
      new U32(value.sufficients),
      new AccountDataScale(value.data),
    )
  }

  encode(): Uint8Array {
    return AccountInfoScale.encode(this.value)
  }
}

export class AccountDataScale {
  constructor(public value: AccountData) {}

  static decode(decoder: Decoder): AccountData {
    const result = decoder.any4(U128, U128, U128, U128)

    return { free: result[0], reserved: result[1], frozen: result[2], flags: result[3] }
  }

  static encode(value: AccountData): Uint8Array {
    return Encoder.concat(new U128(value.free), new U128(value.reserved), new U128(value.frozen), new U128(value.flags))
  }

  encode(): Uint8Array {
    return AccountDataScale.encode(this.value)
  }
}

export interface AccountInfoStruct extends Struct {
  nonce: BN
  consumers: BN
  providers: BN
  sufficients: BN
  data: AccountData
}

export const decodeAccountInfoStruct = (decoder: Decoder): AccountInfoStruct => {
  const nonce = decoder.u32()
  const consumers = decoder.u32()
  const providers = decoder.u32()
  const sufficients = decoder.u32()
  const data = decoder.any1(AccountDataScale)

  return {
    nonce: new BN(nonce),
    consumers: new BN(consumers),
    providers: new BN(providers),
    sufficients: new BN(sufficients),
    data,
  } as AccountInfoStruct
}

export class AccountIdScale {
  constructor(public value: AccountId) {}

  static decode(decoder: Decoder): AccountId {
    const data = decoder.any1(ArrayU8L32)

    return new AccountId(data)
  }

  static encode(value: AccountId): Uint8Array {
    return value.value
  }

  encode(): Uint8Array {
    return AccountIdScale.encode(this.value)
  }
}

export class AuthorityListScale {
  constructor(public value: AuthorityList) {}

  static decode(decoder: Decoder): AuthorityList {
    const length = decoder.u32(true)

    const value = []
    for (let i = 0; i < length; ++i) {
      const res = decoder.any2(AccountIdScale, U64)
      value.push(res)
    }

    return value
  }

  static encode(value: AuthorityList): Uint8Array {
    let encoded = new CompactU32(value.length).encode()
    for (let i = 0; i < value.length; ++i) {
      encoded = u8aConcat(encoded, AccountIdScale.encode(value[i][0]), new U64(value[i][1]).encode())
    }

    return encoded
  }

  encode(): Uint8Array {
    return AuthorityListScale.encode(this.value)
  }
}

export class H256Scale {
  constructor(public value: H256) {}

  static decode(decoder: Decoder): H256 {
    const data = decoder.any1(ArrayU8L32)

    return new H256(data)
  }

  static encode(value: H256): Uint8Array {
    return value.value
  }

  encode(): Uint8Array {
    return H256Scale.encode(this.value)
  }
}

export class PerDispatchClassU32Scale {
  constructor(public value: PerDispatchClassU32) {}
  static decode(decoder: Decoder): PerDispatchClassU32 {
    const normal = decoder.u32()
    const operational = decoder.u32()
    const mandatory = decoder.u32()

    return { normal, operational, mandatory }
  }
}

export class FeeDetailsScale {
  constructor(public value: FeeDetails) {}

  static decode(decoder: Decoder): FeeDetails {
    const inclusionFee = decoder.option(InclusionFeeScale)
    return inclusionFee
  }
}

export class InclusionFeeScale {
  constructor(public value: InclusionFee) {}

  static decode(decoder: Decoder): InclusionFee {
    const baseFee = decoder.u128()
    const lenFee = decoder.u128()
    const adjustedWeightFee = decoder.u128()

    return { baseFee, lenFee, adjustedWeightFee }
  }
}

export class ModuleErrorScale {
  constructor(public value: ModuleError) {}

  static encode(value: ModuleError): Uint8Array {
    return mergeArrays([Encoder.u8(value.index), value.error])
  }

  encode(): Uint8Array {
    return ModuleErrorScale.encode(this.value)
  }

  static decode(decoder: Decoder): ModuleError {
    const index = decoder.u8()
    const error = decoder.bytes(4)

    return { index, error }
  }
}

export class TransactionalErrorScale {
  constructor(public value: TransactionalError) {}

  static decode(decoder: Decoder): TransactionalError {
    const variant = decoder.u8()

    switch (variant) {
      case 0:
        return "LimitReached"
      case 1:
        return "NoLayer"
      default:
        throw new EnumDecodeError("Unknown TransactionalError")
    }
  }

  static encode(value: TransactionalError): Uint8Array {
    if (value == "LimitReached") return Encoder.u8(0)

    // NoLayer
    return Encoder.u8(1)
  }

  encode(): Uint8Array {
    return TransactionalErrorScale.encode(this.value)
  }
}

export class TokenErrorScale {
  constructor(public value: TokenError) {}

  static encode(value: TokenError): Uint8Array {
    if (value == "Underflow") return Encoder.u8(0)
    if (value == "Overflow") return Encoder.u8(1)
    if (value == "BelowMinimum") return Encoder.u8(2)
    if (value == "CannotCreate") return Encoder.u8(3)
    if (value == "UnknownAsset") return Encoder.u8(4)
    if (value == "Frozen") return Encoder.u8(5)
    if (value == "Unsupported") return Encoder.u8(6)
    if (value == "CannotCreateHold") return Encoder.u8(7)
    if (value == "NotExpendable") return Encoder.u8(8)

    // Blocked
    return Encoder.u8(9)
  }

  encode(): Uint8Array {
    return TokenErrorScale.encode(this.value)
  }

  static decode(decoder: Decoder): TokenError {
    const variant = decoder.u8()

    switch (variant) {
      case 0:
        return "Underflow"
      case 1:
        return "Overflow"
      case 2:
        return "BelowMinimum"
      case 3:
        return "CannotCreate"
      case 4:
        return "UnknownAsset"
      case 5:
        return "Frozen"
      case 6:
        return "Unsupported"
      case 7:
        return "CannotCreateHold"
      case 8:
        return "NotExpendable"
      case 9:
        return "Blocked"
      default:
        throw new EnumDecodeError("Unknown TokenError")
    }
  }
}

export class ArithmeticErrorScale {
  constructor(public value: ArithmeticError) {}

  static encode(value: ArithmeticError): Uint8Array {
    if (value == "Underflow") return Encoder.u8(0)
    if (value == "Overflow") return Encoder.u8(1)

    // DivisionByZero
    return Encoder.u8(2)
  }

  encode(): Uint8Array {
    return ArithmeticErrorScale.encode(this.value)
  }

  static decode(decoder: Decoder): ArithmeticError {
    const variant = decoder.u8()

    switch (variant) {
      case 0:
        return "Underflow"
      case 1:
        return "Overflow"
      case 2:
        return "DivisionByZero"
      default:
        throw new EnumDecodeError("Unknown ArithmeticError")
    }
  }
}

export class StorageHasherDecoder {
  constructor(public value: StorageHasher) {}

  hash(data: Uint8Array): Uint8Array {
    if (this.value == "Blake2_128") return blake2AsU8a(data, 128)
    if (this.value == "Blake2_256") return blake2AsU8a(data, 256)
    if (this.value == "Blake2_128Concat") return u8aConcat(blake2AsU8a(data, 128), data)
    if (this.value == "Twox128") return xxhashAsU8a(data, 128)
    if (this.value == "Twox256") return xxhashAsU8a(data, 256)
    if (this.value == "Twox64Concat") return u8aConcat(xxhashAsU8a(data, 64), data)

    // Identity
    return data
  }

  fromHash<K>(decodeKey: (decoder: Decoder) => K, decoder: Decoder): K {
    if (this.value == "Blake2_128Concat") {
      if (decoder.remainingLen() < 16) {
        throw new HashComputationError("Not enough data to compute Blake2_128Concat")
      }
      decoder.advance(16)
      return decodeKey(decoder)
    }

    if (this.value == "Twox64Concat") {
      if (decoder.remainingLen() < 8) {
        throw new HashComputationError("Not enough data to compute Twox64Concat")
      }
      decoder.advance(8)
      return decodeKey(decoder)
    }
    if (this.value == "Identity") {
      return decodeKey(decoder)
    }

    throw new DecodeError(`Decoding not implemented for ${this.value}`)
  }
}
