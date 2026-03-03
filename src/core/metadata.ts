import {
  BN,
  IExtrinsicEra,
  IRuntimeVersionBase,
  Struct,
  encodeAddress,
  decodeAddress,
  KeyringPair,
  u8aConcat,
  u8aToHex,
  blake2AsU8a,
  xxhashAsU8a,
  AuthoritySignature,
} from "./polkadot"
import { ValidationError, DecodeError, EnumDecodeError, HashComputationError } from "../errors/sdk-error"
import { hexDecode, mergeArrays } from "./utils"
import { Encoder } from "./scale/encoder"
import { Decoder } from "./scale/decoder"
import { ArrayU8L20, ArrayU8L32, ArrayU8L64, ArrayU8L65, U32, U128, U64, CompactU32 } from "./scale/types"
import { AvailHeader } from "./header"
import { AccountLike, BlockAt } from "../types"

export type HashNumber = { Hash: string } | { Number: number }

export function toHashNumber(value: BlockAt): HashNumber {
  if (typeof value === "string") {
    return { Hash: value }
  }

  if (value instanceof H256) {
    return { Hash: value.toString() }
  }

  return { Number: value }
}

export interface SignatureOptions {
  nonce?: number
  tip?: BN
  app_id?: number
  mortality?: Mortality
}

export interface RefinedSignatureOptions {
  era: IExtrinsicEra
  nonce: number
  tip: BN
  app_id: number
  mortality: Mortality
  blockHash: Uint8Array | string
  runtimeVersion: IRuntimeVersionBase
  genesisHash: Uint8Array | string
}

export interface Mortality {
  blockHash: H256
  blockHeight: number
  period: number
}

export interface BlockInfo {
  hash: H256
  height: number
}

export interface TxRef {
  hash: H256
  index: number
}

export class AccountId {
  value: Uint8Array // 32 Bytes

  constructor(value: Uint8Array) {
    if (value.length != 32)
      throw new ValidationError(
        `Failed to create AccountId. Input needs to have 32 bytes. Input has ${value.length} bytes`,
      )

    this.value = value
  }

  static decode(decoder: Decoder): AccountId {
    const data = decoder.any1(ArrayU8L32)

    return new AccountId(data)
  }

  static encode(value: AccountId): Uint8Array {
    return value.encode()
  }

  encode(): Uint8Array {
    return this.value
  }

  static from(value: AccountId | KeyringPair | string): AccountId {
    if (value instanceof AccountId) return value
    if (typeof value !== "string") return new AccountId(decodeAddress(value.address))

    return new AccountId(decodeAddress(value))
  }

  toSS58(): string {
    return encodeAddress(this.value)
  }

  toHex(): string {
    return u8aToHex(this.value)
  }

  toString(): string {
    return this.toSS58()
  }

  toMultiAddress(): MultiAddress {
    return new MultiAddress({ Id: this })
  }
}

export class H256 {
  value: Uint8Array // 32 Bytes

  constructor(value: Uint8Array) {
    if (value.length != 32)
      throw new ValidationError(`Failed to create H256. Input needs to have 32 bytes. Input has ${value.length} bytes`)

    this.value = value
  }

  static decode(decoder: Decoder): H256 {
    const data = decoder.any1(ArrayU8L32)

    return new H256(data)
  }

  encode(): Uint8Array {
    return this.value
  }

  static from(value: H256 | Uint8Array | string): H256 {
    if (value instanceof H256) return value

    if (typeof value == "string") {
      if (value.startsWith("0x")) {
        value = value.slice(2)
      }

      if (value.length != 64) {
        throw new ValidationError("Failed to create H256. Input needs to have 64 bytes")
      }

      const decoded = hexDecode(value)

      value = decoded
    }

    return new H256(value)
  }

  static default(): H256 {
    return this.from("0x0000000000000000000000000000000000000000000000000000000000000000")
  }

  toString(): string {
    return this.toHex()
  }

  toHex(): string {
    return u8aToHex(this.value)
  }
}

export class AuthorityId {
  constructor(public value: Uint8Array /* [u8; 32] */) {}
  static decode(decoder: Decoder): AuthorityId {
    const result = decoder.any1(ArrayU8L32)

    return new AuthorityId(result)
  }

  encode(): Uint8Array {
    return this.value
  }
}

export class AuthorityList {
  constructor(public value: [AuthorityId, BN /* u64 */][]) {}

  static decode(decoder: Decoder): AuthorityList {
    const length = decoder.u32(true)

    const value = []
    for (let i = 0; i < length; ++i) {
      const res = decoder.any2(AccountId, U64)
      value.push(res)
    }

    return new AuthorityList(value)
  }

  encode(): Uint8Array {
    let encoded = new CompactU32(this.value.length).encode()
    for (let i = 0; i < this.value.length; ++i) {
      encoded = u8aConcat(encoded, this.value[i][0].encode(), new U64(this.value[i][1]).encode())
    }

    return encoded
  }
}

export class AccountData {
  public free: BN
  public reserved: BN
  public frozen: BN
  public flags: BN

  constructor(free: BN, reserved: BN, frozen: BN, flags: BN) {
    this.free = free
    this.reserved = reserved
    this.frozen = frozen
    this.flags = flags
  }

  static decode(decoder: Decoder): AccountData {
    const result = decoder.any4(U128, U128, U128, U128)

    return new AccountData(...result)
  }

  encode(): Uint8Array {
    return Encoder.concat(new U128(this.free), new U128(this.reserved), new U128(this.frozen), new U128(this.flags))
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
  const data = decoder.any1(AccountData)

  return {
    nonce: new BN(nonce),
    consumers: new BN(consumers),
    providers: new BN(providers),
    sufficients: new BN(sufficients),
    data,
  } as AccountInfoStruct
}

export class AccountInfo {
  constructor(
    public nonce: number,
    public consumers: number,
    public providers: number,
    public sufficients: number,
    public data: AccountData,
  ) {}

  static decode(decoder: Decoder): AccountInfo {
    const result = decoder.any5(U32, U32, U32, U32, AccountData)

    return new AccountInfo(...result)
  }

  encode(): Uint8Array {
    return Encoder.concat(
      new U32(this.nonce),
      new U32(this.consumers),
      new U32(this.providers),
      new U32(this.sufficients),
      this.data,
    )
  }
}

export type DispatchErrorValue =
  | "Other"
  | "CannotLookup"
  | "BadOrigin"
  | { Module: ModuleError }
  | "ConsumerRemaining"
  | "NoProviders"
  | "TooManyConsumers"
  | { Token: TokenError }
  | { Arithmetic: ArithmeticError }
  | { Transactional: TransactionalError }
  | "Exhausted"
  | "Corruption"
  | "Unavailable"
  | "RootNotAllowed"
export class DispatchError {
  constructor(public value: DispatchErrorValue) {}

  encode(): Uint8Array {
    if (this.value == "Other") return Encoder.u8(0)
    if (this.value == "CannotLookup") return Encoder.u8(1)
    if (this.value == "BadOrigin") return Encoder.u8(2)
    if (this.value == "ConsumerRemaining") return Encoder.u8(4)
    if (this.value == "NoProviders") return Encoder.u8(5)
    if (this.value == "TooManyConsumers") return Encoder.u8(6)
    if (this.value == "Exhausted") return Encoder.u8(10)
    if (this.value == "Corruption") return Encoder.u8(11)
    if (this.value == "Unavailable") return Encoder.u8(12)
    if (this.value == "RootNotAllowed") return Encoder.u8(13)
    if ("Module" in this.value) return Encoder.enum(3, this.value.Module)
    if ("Token" in this.value) return Encoder.enum(7, this.value.Token)
    if ("Arithmetic" in this.value) return Encoder.enum(8, this.value.Arithmetic)

    // Transactional
    return Encoder.enum(9, this.value.Transactional)
  }

  static decode(decoder: Decoder): DispatchError {
    const variant = decoder.u8()

    switch (variant) {
      case 0:
        return new DispatchError("Other")
      case 1:
        return new DispatchError("CannotLookup")
      case 2:
        return new DispatchError("BadOrigin")
      case 3: {
        const module = ModuleError.decode(decoder)
        return new DispatchError({ Module: module })
      }
      case 4:
        return new DispatchError("ConsumerRemaining")
      case 5:
        return new DispatchError("NoProviders")
      case 6:
        return new DispatchError("TooManyConsumers")
      case 7: {
        const token = TokenError.decode(decoder)
        return new DispatchError({ Token: token })
      }
      case 8: {
        const arithmetic = ArithmeticError.decode(decoder)
        return new DispatchError({ Arithmetic: arithmetic })
      }
      case 9: {
        const transactional = TransactionalError.decode(decoder)
        return new DispatchError({ Transactional: transactional })
      }
      case 10:
        return new DispatchError("Exhausted")
      case 11:
        return new DispatchError("Corruption")
      case 12:
        return new DispatchError("Unavailable")
      case 13:
        return new DispatchError("RootNotAllowed")
      default:
        throw new EnumDecodeError("Unknown DispatchError")
    }
  }
}

export class ModuleError {
  constructor(
    public index: number, // u8
    public error: Uint8Array, // 4 bytes
  ) {}

  encode(): Uint8Array {
    return mergeArrays([Encoder.u8(this.index), this.error])
  }

  static decode(decoder: Decoder): ModuleError {
    const index = decoder.u8()

    const error = decoder.bytes(4)

    return new ModuleError(index, error)
  }
}

export type TokenErrorValue =
  | "Underflow"
  | "Overflow"
  | "BelowMinimum"
  | "CannotCreate"
  | "UnknownAsset"
  | "Frozen"
  | "Unsupported"
  | "CannotCreateHold"
  | "NotExpendable"
  | "Blocked"
export class TokenError {
  constructor(public value: TokenErrorValue) {}

  encode(): Uint8Array {
    if (this.value == "Underflow") return Encoder.u8(0)
    if (this.value == "Overflow") return Encoder.u8(1)
    if (this.value == "BelowMinimum") return Encoder.u8(2)
    if (this.value == "CannotCreate") return Encoder.u8(3)
    if (this.value == "UnknownAsset") return Encoder.u8(4)
    if (this.value == "Frozen") return Encoder.u8(5)
    if (this.value == "Unsupported") return Encoder.u8(6)
    if (this.value == "CannotCreateHold") return Encoder.u8(7)
    if (this.value == "NotExpendable") return Encoder.u8(8)

    // Blocked
    return Encoder.u8(9)
  }

  static decode(decoder: Decoder): TokenError {
    const variant = decoder.u8()

    switch (variant) {
      case 0:
        return new TokenError("Underflow")
      case 1:
        return new TokenError("Overflow")
      case 2:
        return new TokenError("BelowMinimum")
      case 3:
        return new TokenError("CannotCreate")
      case 4:
        return new TokenError("UnknownAsset")
      case 5:
        return new TokenError("Frozen")
      case 6:
        return new TokenError("Unsupported")
      case 7:
        return new TokenError("CannotCreateHold")
      case 8:
        return new TokenError("NotExpendable")
      case 9:
        return new TokenError("Blocked")
      default:
        throw new EnumDecodeError("Unknown TokenError")
    }
  }
}

export type ArithmeticErrorValue = "Underflow" | "Overflow" | "DivisionByZero"
export class ArithmeticError {
  constructor(public value: ArithmeticErrorValue) {}

  encode(): Uint8Array {
    if (this.value == "Underflow") return Encoder.u8(0)
    if (this.value == "Overflow") return Encoder.u8(1)

    // DivisionByZero
    return Encoder.u8(2)
  }

  static decode(decoder: Decoder): ArithmeticError {
    const variant = decoder.u8()

    switch (variant) {
      case 0:
        return new ArithmeticError("Underflow")
      case 1:
        return new ArithmeticError("Overflow")
      case 2:
        return new ArithmeticError("DivisionByZero")
      default:
        throw new EnumDecodeError("Unknown ArithmeticError")
    }
  }
}

export type TransactionalErrorValue = "LimitReached" | "NoLayer"
export class TransactionalError {
  constructor(public value: TransactionalErrorValue) {}

  static decode(decoder: Decoder): TransactionalError {
    const variant = decoder.u8()

    switch (variant) {
      case 0:
        return new TransactionalError("LimitReached")
      case 1:
        return new TransactionalError("NoLayer")
      default:
        throw new EnumDecodeError("Unknown TransactionalError")
    }
  }

  encode(): Uint8Array {
    if (this.value == "LimitReached") return Encoder.u8(0)

    // NoLayer
    return Encoder.u8(1)
  }
}

export type DispatchResultValue = "Ok" | { Err: DispatchErrorValue }
export class DispatchResult {
  constructor(public value: DispatchResultValue) {}

  static decode(decoder: Decoder): DispatchResult {
    const variant = decoder.u8()

    switch (variant) {
      case 0:
        return new DispatchResult("Ok")
      case 1: {
        const err = DispatchError.decode(decoder)
        return new DispatchResult({ Err: err.value })
      }
      default:
        throw new DecodeError("Failed to decode DispatchResult")
    }
  }

  encode(): Uint8Array {
    if (this.value == "Ok") return Encoder.u8(0)

    return u8aConcat(Encoder.u8(1), Encoder.any1(new DispatchError(this.value.Err)))
  }
}

export class Weight {
  public refTime: BN // Compact
  public proofSize: BN // Compact

  constructor(refTime: BN, proofSize: BN) {
    this.refTime = refTime
    this.proofSize = proofSize
  }

  static decode(decoder: Decoder): Weight {
    const refTime = decoder.u64(true)

    const proofSize = decoder.u64(true)

    return new Weight(refTime, proofSize)
  }

  encode(): Uint8Array {
    return mergeArrays([Encoder.u64(this.refTime, true), Encoder.u64(this.proofSize, true)])
  }
}

export class PerDispatchClassWeight {
  constructor(
    public normal: Weight,
    public operational: Weight,
    public mandatory: Weight,
  ) {}

  static decode(decoder: Decoder): PerDispatchClassWeight {
    const result = decoder.any3(Weight, Weight, Weight)

    return new PerDispatchClassWeight(...result)
  }

  encode(): Uint8Array {
    return u8aConcat(this.normal.encode(), this.operational.encode(), this.mandatory.encode())
  }
}

export type DispatchClassValue = "Normal" | "Operational" | "Mandatory"
export class DispatchClass {
  constructor(public value: DispatchClassValue) {}

  encode(): Uint8Array {
    switch (this.value) {
      case "Normal":
        return Encoder.u8(0)
      case "Operational":
        return Encoder.u8(1)
      case "Mandatory":
        return Encoder.u8(2)
    }
  }

  static decode(decoder: Decoder): DispatchClass {
    const variant = decoder.u8()

    switch (variant) {
      case 0:
        return new DispatchClass("Normal")
      case 1:
        return new DispatchClass("Operational")
      case 2:
        return new DispatchClass("Mandatory")
      default:
        throw new EnumDecodeError("Unknown DispatchClass")
    }
  }
}

export class RuntimeDispatchInfo {
  public weight: Weight
  public c: DispatchClass
  public partialFee: BN
  constructor(weight: Weight, c: DispatchClass, partialFee: BN) {
    this.weight = weight
    this.c = c
    this.partialFee = partialFee
  }

  static decode(decoder: Decoder): RuntimeDispatchInfo {
    const weight = Weight.decode(decoder)

    const c = DispatchClass.decode(decoder)

    const partialFee = decoder.u128()

    return new RuntimeDispatchInfo(weight, c, partialFee)
  }
}

export class InclusionFee {
  public baseFee: BN
  public lenFee: BN
  public adjustedWeightFee: BN
  constructor(baseFee: BN, lenFee: BN, adjustedWeightFee: BN) {
    this.baseFee = baseFee
    this.lenFee = lenFee
    this.adjustedWeightFee = adjustedWeightFee
  }

  static decode(decoder: Decoder): InclusionFee {
    const baseFee = decoder.u128()
    const lenFee = decoder.u128()
    const adjustedWeightFee = decoder.u128()

    return new InclusionFee(baseFee, lenFee, adjustedWeightFee)
  }
}

export class FeeDetails {
  public inclusionFee: InclusionFee | null = null
  constructor(inclusionFee: InclusionFee | null) {
    this.inclusionFee = inclusionFee
  }

  static decode(decoder: Decoder): FeeDetails {
    const inclusionFee = decoder.option(InclusionFee)

    return new FeeDetails(inclusionFee)
  }

  public finalFee(): BN | null {
    const fee = this.inclusionFee
    if (fee == null) return null

    return fee.lenFee.add(fee.baseFee).add(fee.adjustedWeightFee)
  }
}

export type PaysValue = "Yes" | "No"
export class Pays {
  constructor(public value: PaysValue) {}

  encode(): Uint8Array {
    switch (this.value) {
      case "Yes":
        return Encoder.u8(0)
      case "No":
        return Encoder.u8(0)
    }
  }

  static decode(decoder: Decoder): Pays {
    const variant = decoder.u8()

    switch (variant) {
      case 0:
        return new Pays("Yes")
      case 1:
        return new Pays("No")
      default:
        throw new DecodeError("Failed to decode Pays")
    }
  }
}

export class DispatchInfo {
  public weight: Weight
  public c: DispatchClass
  public pays: Pays
  public feeModifier: DispatchFeeModifier
  constructor(weight: Weight, c: DispatchClass, pays: Pays, feeModifier: DispatchFeeModifier) {
    this.weight = weight
    this.c = c
    this.pays = pays
    this.feeModifier = feeModifier
  }

  encode(): Uint8Array {
    return mergeArrays([
      Encoder.any1(this.weight),
      Encoder.any1(this.c),
      Encoder.any1(this.pays),
      Encoder.any1(this.feeModifier),
    ])
  }

  static decode(decoder: Decoder): DispatchInfo {
    const weight = decoder.any1(Weight)

    const c = decoder.any1(DispatchClass)

    const pays = decoder.any1(Pays)

    const feeModifier = decoder.any1(DispatchFeeModifier)

    return new DispatchInfo(weight, c, pays, feeModifier)
  }
}

export class DispatchFeeModifier {
  public weightMaximumFee: BN | null = null // u128
  public weightFeeDivider: number | null = null // u32
  public weightFeeMultiplier: number | null = null // u32
  constructor(weightMaximumFee: BN | null, weightFeeDivider: number | null, weightFeeMultiplier: number | null) {
    this.weightMaximumFee = weightMaximumFee
    this.weightFeeDivider = weightFeeDivider
    this.weightFeeMultiplier = weightFeeMultiplier
  }

  encode(): Uint8Array {
    const weightMaximumFee = Encoder.option(this.weightMaximumFee ? new U128(this.weightMaximumFee) : null)
    const weightFeeDivider = Encoder.option(this.weightFeeDivider ? new U32(this.weightFeeDivider) : null)
    const weightFeeMultiplier = Encoder.option(this.weightFeeMultiplier ? new U32(this.weightFeeMultiplier) : null)
    return mergeArrays([weightMaximumFee, weightFeeDivider, weightFeeMultiplier])
  }

  static decode(decoder: Decoder): DispatchFeeModifier {
    const weightMaximumFee = decoder.option(U128)

    const weightFeeDivider = decoder.option(U32)

    const weightFeeMultiplier = decoder.option(U32)

    return new DispatchFeeModifier(weightMaximumFee, weightFeeDivider, weightFeeMultiplier)
  }
}

export class PerDispatchClassU32 {
  public normal: number
  public operational: number
  public mandatory: number
  constructor(normal: number, operational: number, mandatory: number) {
    this.normal = normal
    this.operational = operational
    this.mandatory = mandatory
  }

  static decode(decoder: Decoder): PerDispatchClassU32 {
    const normal = decoder.u32()

    const operational = decoder.u32()

    const mandatory = decoder.u32()

    return new PerDispatchClassU32(normal, operational, mandatory)
  }
}

export class SessionKeys {
  constructor(
    public babe: H256,
    public grandpa: H256,
    public imOnline: H256,
    public authorityDiscovery: H256,
  ) {}

  static from(keys: string): SessionKeys {
    if (keys.startsWith("0x")) {
      keys = keys.slice(2, undefined)
    }
    if (keys.length != 256) throw new DecodeError("Rotate Keys does not have enough bytes to decode")

    const babe = H256.from(keys.slice(0, 64))

    const grandpa = H256.from(keys.slice(64, 128))

    const imOnline = H256.from(keys.slice(128, 192))

    const authorityDiscovery = H256.from(keys.slice(192, 256))

    return new SessionKeys(babe, grandpa, imOnline, authorityDiscovery)
  }

  toHex(): string {
    let value = "0x"
    value += this.babe.toHex().slice(2)
    value += this.grandpa.toHex().slice(2)
    value += this.imOnline.toHex().slice(2)
    value += this.authorityDiscovery.toHex().slice(2)
    return value
  }
}

export class ExtrinsicSignature {
  constructor(
    public address: MultiAddressValue,
    public signature: MultiSignatureValue,
    public extra: SignedExtra,
  ) {}

  static decode(decoder: Decoder): ExtrinsicSignature {
    const result = decoder.any3(MultiAddress, MultiSignature, SignedExtra)

    return new ExtrinsicSignature(...result)
  }
}

export type EraValue = "Immortal" | { Mortal: [number, number] }
export class Era {
  constructor(public value: EraValue) {}

  static decode(decoder: Decoder): Era {
    const first = decoder.u8()

    if (first == 0) {
      return new Era("Immortal")
    }

    const nextByte = decoder.byte()

    const encoded = first + (nextByte << 8)
    const period = 2 << encoded % (1 << 4)
    const quantizeFactorTmp = period >> 12
    const quantizeFactor = quantizeFactorTmp > 1 ? quantizeFactorTmp : 1
    const phase = (encoded >> 4) * quantizeFactor
    if (period >= 4 && phase < period) {
      return new Era({ Mortal: [period, phase] })
    }

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

export class SignedExtra {
  era: Era
  nonce: number // Compact<u32>
  tip: BN // Compact<u128>
  appId: number //  Compact<u32>

  constructor(era: Era, nonce: number, tip: BN, appId: number) {
    this.era = era
    this.nonce = nonce
    this.tip = tip
    this.appId = appId
  }

  static decode(decoder: Decoder): SignedExtra {
    const era = Era.decode(decoder)

    const nonce = decoder.u32(true)

    const tip = decoder.u128(true)

    const appId = decoder.u32(true)

    return new SignedExtra(era, nonce, tip, appId)
  }
}

/// Ed25519 -> [64]byte, Sr25519 -> [64]byte, Ecdsa -> [65]byte
export type MultiSignatureValue = { Ed25519: Uint8Array } | { Sr25519: Uint8Array } | { Ecdsa: Uint8Array }
export class MultiSignature {
  constructor(public value: MultiSignatureValue) {}

  encode(): Uint8Array {
    if ("Ed25519" in this.value) return Encoder.enum(0, this.value.Ed25519)
    if ("Sr25519" in this.value) return Encoder.enum(1, this.value.Sr25519)

    // Ecdsa
    return Encoder.enum(2, this.value.Ecdsa)
  }

  static decode(decoder: Decoder): MultiSignatureValue {
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

  public toString(): string {
    if ("Ed25519" in this.value) return `Ed25519: ${u8aToHex(this.value.Ed25519)}`
    if ("Sr25519" in this.value) return `Sr25519: ${u8aToHex(this.value.Sr25519)}`
    return `Ecdsa: ${u8aToHex(this.value.Ecdsa)}`
  }
}

export type MultiAddressValue =
  | { Id: AccountId }
  | { Index: number } // Compact<u32>
  | { Raw: Uint8Array } // Vec<u8>
  | { Address32: Uint8Array } // [32]byte
  | { Address20: Uint8Array } // [20]byte
export class MultiAddress {
  constructor(public value: MultiAddressValue) {}

  /// Can Throw
  asId(): AccountId {
    if (!("Id" in this.value)) throw new ValidationError("AccountID has no ID.")
    return this.value.Id
  }

  static decode(decoder: Decoder): MultiAddressValue {
    const variant = decoder.u8()

    if (variant == 0) {
      const id = AccountId.decode(decoder)
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

  encode(): Uint8Array {
    if ("Id" in this.value) return Encoder.enum(0, this.value.Id)
    if ("Index" in this.value) return Encoder.enum(1, Encoder.u32(this.value.Index, true))
    if ("Raw" in this.value) return Encoder.enum(2, Encoder.vecU8(this.value.Raw))
    if ("Address32" in this.value) return Encoder.enum(3, this.value.Address32)

    // Address20
    return Encoder.enum(4, this.value.Address20)
  }

  static from(value: AccountLike | MultiAddress | MultiAddressValue): MultiAddressValue {
    if (typeof value == "string") return { Id: AccountId.from(value) }
    if (value instanceof AccountId) return { Id: value }
    if (value instanceof MultiAddress) return value.value
    if (value instanceof AccountId) return { Id: value }

    return value
  }

  toString(): string {
    if ("Id" in this.value) return `${this.value.Id.toSS58()}`
    if ("Index" in this.value) return `${this.value.Index}`
    if ("Raw" in this.value) return `${this.value.Raw}`
    if ("Address32" in this.value) return `${this.value.Address32}`

    return `${this.value.Address20}`
  }
}

export type StorageHasherValue =
  | "Blake2_128"
  | "Blake2_256"
  | "Blake2_128Concat"
  | "Twox128"
  | "Twox256"
  | "Twox64Concat"
  | "Identity"
export class StorageHasher {
  constructor(public value: StorageHasherValue) {}

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

export interface GrandpaJustification {
  round: number
  commit: GrandpaCommit
  votes_ancestries: AvailHeader[]
}

export interface GrandpaCommit {
  target_hash: string
  target_number: number
  precommits: GrandpaSignedPrecommit[]
}

export interface GrandpaSignedPrecommit {
  precommit: GrandpaPrecommit
  signature: AuthoritySignature
  id: AuthorityId
}

export interface GrandpaPrecommit {
  target_hash: string
  target_number: number
}
