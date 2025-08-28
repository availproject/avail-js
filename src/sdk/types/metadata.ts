import {
  BN,
  IExtrinsicEra,
  IRuntimeVersionBase,
  Struct,
  encodeAddress,
  decodeAddress,
  KeyringPair,
  u8aConcat,
} from "./polkadot"
import { ClientError } from "../error"
import { Hex, mergeArrays } from "../utils"
import { U32, U128, U64, CompactU32, Encoder, Decoder } from "./scale"

export type BlockState = "Included" | "Finalized" | "Discarded" | "DoesNotExist"
export type HashNumber = { Hash: string } | { Number: number }
export type BlockId = HashNumber
export type HashLike = H256 | string

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

export interface BlockRef {
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
      throw new Error(`Failed to create AccountId. Input needs to have 32 bytes. Input has ${value.length} bytes`)

    this.value = value
  }

  static decode(decoder: Decoder): AccountId | ClientError {
    const data = decoder.bytes(32)
    if (data instanceof ClientError) return data

    return new AccountId(data)
  }

  static encode(value: AccountId): Uint8Array {
    return value.encode()
  }

  encode(): Uint8Array {
    return this.value
  }

  static from(value: string | KeyringPair): AccountId {
    if (typeof value !== "string") {
      value = value.address
    }

    return new AccountId(decodeAddress(value))
  }

  toSS58(): string {
    return encodeAddress(this.value)
  }

  toHex(): string {
    return Hex.encode(this.value)
  }

  toHuman(): string {
    return this.toSS58()
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
      throw new Error(`Failed to create H256. Input needs to have 32 bytes. Input has ${value.length} bytes`)

    this.value = value
  }

  encode(): Uint8Array {
    return this.value
  }

  static decode(decoder: Decoder): H256 | ClientError {
    const data = decoder.bytes(32)
    if (data instanceof ClientError) return data

    return new H256(data)
  }

  static from(value: string): H256 | ClientError {
    if (value.startsWith("0x")) {
      value = value.slice(2)
    }

    if (value.length != 64) return new ClientError("Failed to create H256. Input needs to have 64 bytes")

    const decoded = Hex.decode(value)
    if (decoded instanceof ClientError) return decoded

    return new H256(decoded)
  }

  // Can Throw
  static fromUnsafe(value: string): H256 {
    const hex = H256.from(value)
    if (hex instanceof ClientError) throw hex

    return hex
  }

  static default(): H256 {
    return this.fromUnsafe("0x0000000000000000000000000000000000000000000000000000000000000000")
  }

  toHuman(): string {
    return this.toHex()
  }

  toString(): string {
    return this.toHex()
  }

  toHex(): string {
    return Hex.encode(this.value)
  }
}

export class AuthorityId {
  constructor(public value: Uint8Array /* [u8; 32] */) {}
  static decode(decoder: Decoder): AuthorityId | ClientError {
    const result = decoder.bytes(32)
    if (result instanceof ClientError) return result

    return new AuthorityId(result)
  }

  encode(): Uint8Array {
    return this.value
  }
}

export class AuthorityList {
  constructor(public value: [AuthorityId, BN /* u64 */][]) {}

  static decode(decoder: Decoder): AuthorityList | ClientError {
    const length = decoder.u32(true)
    if (length instanceof ClientError) return length

    const value = []
    for (let i = 0; i < length; ++i) {
      const res = decoder.any2(AccountId, U64)
      if (res instanceof ClientError) return res
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

  static decode(decoder: Decoder): AccountData | ClientError {
    const result = decoder.any4(U128, U128, U128, U128)
    if (result instanceof ClientError) return result

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

export const decodeAccountInfoStruct = (decoder: Decoder): AccountInfoStruct | ClientError => {
  const nonce = decoder.u32()
  if (nonce instanceof ClientError) return nonce
  const consumers = decoder.u32()
  if (consumers instanceof ClientError) return consumers
  const providers = decoder.u32()
  if (providers instanceof ClientError) return providers
  const sufficients = decoder.u32()
  if (sufficients instanceof ClientError) return sufficients
  const data = decoder.any1(AccountData)
  if (data instanceof ClientError) return data

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

  static decode(decoder: Decoder): AccountInfo | ClientError {
    const result = decoder.any5(U32, U32, U32, U32, AccountData)
    if (result instanceof ClientError) return result

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

  static decode(decoder: Decoder): DispatchError | ClientError {
    const variant = decoder.u8()
    if (variant instanceof ClientError) return variant

    switch (variant) {
      case 0:
        return new DispatchError("Other")
      case 1:
        return new DispatchError("CannotLookup")
      case 2:
        return new DispatchError("BadOrigin")
      case 3: {
        const module = ModuleError.decode(decoder)
        if (module instanceof ClientError) return module
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
        if (token instanceof ClientError) return token
        return new DispatchError({ Token: token })
      }
      case 8: {
        const arithmetic = ArithmeticError.decode(decoder)
        if (arithmetic instanceof ClientError) return arithmetic
        return new DispatchError({ Arithmetic: arithmetic })
      }
      case 9: {
        const transactional = TransactionalError.decode(decoder)
        if (transactional instanceof ClientError) return transactional
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
        return new ClientError("Unknown DispatchError")
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

  static decode(decoder: Decoder): ModuleError | ClientError {
    const index = decoder.u8()
    if (index instanceof ClientError) return index

    const error = decoder.bytes(4)
    if (error instanceof ClientError) return error

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

  static decode(decoder: Decoder): TokenError | ClientError {
    const variant = decoder.u8()
    if (variant instanceof ClientError) return variant

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
        return new ClientError("Unknown TokenError")
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

  static decode(decoder: Decoder): ArithmeticError | ClientError {
    const variant = decoder.u8()
    if (variant instanceof ClientError) return variant

    switch (variant) {
      case 0:
        return new ArithmeticError("Underflow")
      case 1:
        return new ArithmeticError("Overflow")
      case 2:
        return new ArithmeticError("DivisionByZero")
      default:
        return new ClientError("Unknown ArithmeticError")
    }
  }
}

export type TransactionalErrorValue = "LimitReached" | "NoLayer"
export class TransactionalError {
  constructor(public value: TransactionalErrorValue) {}

  static decode(decoder: Decoder): TransactionalError | ClientError {
    const variant = decoder.u8()
    if (variant instanceof ClientError) return variant

    switch (variant) {
      case 0:
        return new TransactionalError("LimitReached")
      case 1:
        return new TransactionalError("NoLayer")
      default:
        return new ClientError("Unknown TransactionalError")
    }
  }

  encode(): Uint8Array {
    if (this.value == "LimitReached") return Encoder.u8(0)

    // NoLayer
    return Encoder.u8(1)
  }
}

export type DispatchResultValue = "Ok" | { Err: DispatchError }
export class DispatchResult {
  constructor(public value: DispatchResultValue) {}

  static decode(decoder: Decoder): DispatchResult | ClientError {
    const variant = decoder.u8()
    if (variant instanceof ClientError) return variant

    switch (variant) {
      case 0:
        return new DispatchResult("Ok")
      case 1: {
        const err = DispatchError.decode(decoder)
        if (err instanceof ClientError) return err
        return new DispatchResult({ Err: err })
      }
      default:
        return new ClientError("Failed to decode DispatchResult")
    }
  }

  encode(): Uint8Array {
    if (this.value == "Ok") return Encoder.u8(0)

    return u8aConcat(Encoder.u8(1), Encoder.any1(this.value.Err))
  }
}

export class Weight {
  public refTime: BN // Compact
  public proofSize: BN // Compact

  constructor(refTime: BN, proofSize: BN) {
    this.refTime = refTime
    this.proofSize = proofSize
  }

  static decode(decoder: Decoder): Weight | ClientError {
    const refTime = decoder.u64(true)
    if (refTime instanceof ClientError) return refTime

    const proofSize = decoder.u64(true)
    if (proofSize instanceof ClientError) return proofSize

    return new Weight(refTime, proofSize)
  }

  encode(): Uint8Array {
    return mergeArrays([Encoder.u64(this.refTime, true), Encoder.u64(this.proofSize, true)])
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

  static decode(decoder: Decoder): DispatchClass | ClientError {
    const variant = decoder.u8()
    if (variant instanceof ClientError) return variant

    switch (variant) {
      case 0:
        return new DispatchClass("Normal")
      case 1:
        return new DispatchClass("Operational")
      case 2:
        return new DispatchClass("Mandatory")
      default:
        return new ClientError("Unknown DispatchClass")
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

  static decode(decoder: Decoder): RuntimeDispatchInfo | ClientError {
    const weight = Weight.decode(decoder)
    if (weight instanceof ClientError) return weight

    const c = DispatchClass.decode(decoder)
    if (c instanceof ClientError) return c

    const partialFee = decoder.u128()
    if (partialFee instanceof ClientError) return partialFee

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

  static decode(decoder: Decoder): InclusionFee | ClientError {
    const baseFee = decoder.u128()
    if (baseFee instanceof ClientError) {
      return baseFee
    }
    const lenFee = decoder.u128()
    if (lenFee instanceof ClientError) {
      return lenFee
    }
    const adjustedWeightFee = decoder.u128()
    if (adjustedWeightFee instanceof ClientError) {
      return adjustedWeightFee
    }

    return new InclusionFee(baseFee, lenFee, adjustedWeightFee)
  }
}

export class FeeDetails {
  public inclusionFee: InclusionFee | null = null
  constructor(inclusionFee: InclusionFee | null) {
    this.inclusionFee = inclusionFee
  }

  static decode(decoder: Decoder): FeeDetails | ClientError {
    const inclusionFee = decoder.option(InclusionFee)
    if (inclusionFee instanceof ClientError) return inclusionFee

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

  static decode(decoder: Decoder): Pays | ClientError {
    const variant = decoder.u8()
    if (variant instanceof ClientError) return variant

    switch (variant) {
      case 0:
        return new Pays("Yes")
      case 1:
        return new Pays("No")
      default:
        return new ClientError("Failed to decode Pays")
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

  static decode(decoder: Decoder): DispatchInfo | ClientError {
    const weight = decoder.any1(Weight)
    if (weight instanceof ClientError) return weight

    const c = decoder.any1(DispatchClass)
    if (c instanceof ClientError) return c

    const pays = decoder.any1(Pays)
    if (pays instanceof ClientError) return pays

    const feeModifier = decoder.any1(DispatchFeeModifier)
    if (feeModifier instanceof ClientError) return feeModifier

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

  static decode(decoder: Decoder): DispatchFeeModifier | ClientError {
    const weightMaximumFee = decoder.option(U128)
    if (weightMaximumFee instanceof ClientError) return weightMaximumFee

    const weightFeeDivider = decoder.option(U32)
    if (weightFeeDivider instanceof ClientError) return weightFeeDivider

    const weightFeeMultiplier = decoder.option(U32)
    if (weightFeeMultiplier instanceof ClientError) return weightFeeMultiplier

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

  static decode(decoder: Decoder): PerDispatchClassU32 | ClientError {
    const normal = decoder.u32()
    if (normal instanceof ClientError) return normal

    const operational = decoder.u32()
    if (operational instanceof ClientError) return operational

    const mandatory = decoder.u32()
    if (mandatory instanceof ClientError) return mandatory

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
  toHex(): string {
    let value = "0x"
    value += this.babe.toHex().slice(2)
    value += this.grandpa.toHex().slice(2)
    value += this.imOnline.toHex().slice(2)
    value += this.authorityDiscovery.toHex().slice(2)
    return value
  }

  static fromHex(keys: string): SessionKeys | ClientError {
    if (keys.startsWith("0x")) {
      keys = keys.slice(2, undefined)
    }
    const babe = H256.from(keys.slice(0, 64))
    if (babe instanceof ClientError) return babe

    const grandpa = H256.from(keys.slice(64, 128))
    if (grandpa instanceof ClientError) return grandpa

    const imOnline = H256.from(keys.slice(128, 192))
    if (imOnline instanceof ClientError) return imOnline

    const authorityDiscovery = H256.from(keys.slice(192, 256))
    if (authorityDiscovery instanceof ClientError) return authorityDiscovery

    return new SessionKeys(babe, grandpa, imOnline, authorityDiscovery)
  }
}

/* export class TimepointBlocknumber {
  constructor(
    public height: number,
    public index: number,
  ) {}

  static decode(decoder: Decoder): TimepointBlocknumber | ClientError {
    const height = decoder.u32()
    if (height instanceof ClientError) return height

    const index = decoder.u32()
    if (index instanceof ClientError) return index

    return new TimepointBlocknumber(height, index)
  }
} */

export class TransactionSigned {
  public address: MultiAddress
  public signature: MultiSignature
  public txExtra: TransactionExtra

  constructor(address: MultiAddress, signature: MultiSignature, txExtra: TransactionExtra) {
    this.address = address
    this.signature = signature
    this.txExtra = txExtra
  }

  static decode(decoder: Decoder): TransactionSigned | ClientError {
    const address = MultiAddress.decode(decoder)
    if (address instanceof ClientError) return address

    const signature = MultiSignature.decode(decoder)
    if (signature instanceof ClientError) return signature

    const txExtra = TransactionExtra.decode(decoder)
    if (txExtra instanceof ClientError) return txExtra

    return new TransactionSigned(address, signature, txExtra)
  }
}

export type EraValue = "Immortal" | { Mortal: [number, number] }
export class Era {
  constructor(public value: EraValue) {}

  static decode(decoder: Decoder): Era | ClientError {
    const first = decoder.u8()
    if (first instanceof ClientError) return first

    if (first == 0) {
      return new Era("Immortal")
    }

    const nextByte = decoder.byte()
    if (nextByte instanceof ClientError) return nextByte

    const encoded = first + (nextByte << 8)
    const period = 2 << encoded % (1 << 4)
    const quantizeFactorTmp = period >> 12
    const quantizeFactor = quantizeFactorTmp > 1 ? quantizeFactorTmp : 1
    const phase = (encoded >> 4) * quantizeFactor
    if (period >= 4 && phase < period) {
      return new Era({ Mortal: [period, phase] })
    }

    return new ClientError("Invalid period and phase")
  }

  isImmortal(): boolean {
    return this.value == "Immortal"
  }

  asMortal(): [number, number] {
    if (this.value == "Immortal") throw new Error("Era is not Mortal")

    return this.value.Mortal
  }

  isMortal(): boolean {
    return !this.isImmortal()
  }
}

export class TransactionExtra {
  public era: Era
  public nonce: number // Compact<u32>
  public tip: BN // Compact<u128>
  public appId: number //  Compact<u32>

  constructor(era: Era, nonce: number, tip: BN, appId: number) {
    this.era = era
    this.nonce = nonce
    this.tip = tip
    this.appId = appId
  }

  static decode(decoder: Decoder): TransactionExtra | ClientError {
    const era = Era.decode(decoder)
    if (era instanceof ClientError) return era

    const nonce = decoder.u32(true)
    if (nonce instanceof ClientError) return nonce

    const tip = decoder.u128(true)
    if (tip instanceof ClientError) return tip

    const appId = decoder.u32(true)
    if (appId instanceof ClientError) return appId

    return new TransactionExtra(era, nonce, tip, appId)
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

  static decode(decoder: Decoder): MultiSignature | ClientError {
    const variant = decoder.u8()
    if (variant instanceof ClientError) return variant

    switch (variant) {
      case 0: {
        const ed25519 = decoder.bytes(64)
        if (ed25519 instanceof ClientError) return ed25519
        return new MultiSignature({ Ed25519: ed25519 })
      }
      case 1: {
        const sr25519 = decoder.bytes(64)
        if (sr25519 instanceof ClientError) return sr25519
        return new MultiSignature({ Sr25519: sr25519 })
      }
      case 2: {
        const ecdsa = decoder.bytes(65)
        if (ecdsa instanceof ClientError) return ecdsa
        return new MultiSignature({ Ecdsa: ecdsa })
      }
      default:
        return new ClientError("Unknown MultiSignature")
    }
  }

  public toString(): string {
    if ("Ed25519" in this.value) return `Ed25519: ${Hex.encode(this.value.Ed25519)}`
    if ("Sr25519" in this.value) return `Sr25519: ${Hex.encode(this.value.Sr25519)}`
    return `Ecdsa: ${Hex.encode(this.value.Ecdsa)}`
  }
}

/// Index -> u32, Raw -> []byte, Address32 -> [32]byte, Address20 -> [20]byte
export type MultiAddressValue =
  | { Id: AccountId }
  | { Index: number }
  | { Raw: Uint8Array }
  | { Address32: Uint8Array }
  | { Address20: Uint8Array }
export class MultiAddress {
  constructor(public value: MultiAddressValue) {}

  encode(): Uint8Array {
    if ("Id" in this.value) return Encoder.enum(0, this.value.Id)
    if ("Index" in this.value) return Encoder.enum(1, Encoder.u32(this.value.Index))
    if ("Raw" in this.value) return Encoder.enum(2, Encoder.vecU8(this.value.Raw))
    if ("Address32" in this.value) return Encoder.enum(3, this.value.Address32)

    // Address20
    return Encoder.enum(4, this.value.Address20)
  }

  /// Can Throw
  asId(): AccountId {
    if (!("Id" in this.value)) throw new Error("AccountID has no ID.")
    return this.value.Id
  }

  static decode(decoder: Decoder): MultiAddress | ClientError {
    const variantIndex = decoder.u8()
    switch (variantIndex) {
      case 0: {
        const id = AccountId.decode(decoder)
        if (id instanceof ClientError) return id
        return new MultiAddress({ Id: id })
      }
      case 1: {
        const index = decoder.u32()
        if (index instanceof ClientError) return index
        return new MultiAddress({ Index: index })
      }
      case 2: {
        const raw = decoder.vecU8()
        if (raw instanceof ClientError) return raw
        return new MultiAddress({ Raw: raw })
      }
      case 3: {
        const address32 = decoder.bytes(32)
        if (address32 instanceof ClientError) return address32
        return new MultiAddress({ Address32: address32 })
      }
      case 4: {
        const address20 = decoder.bytes(20)
        if (address20 instanceof ClientError) return address20
        return new MultiAddress({ Address20: address20 })
      }
      default:
        return new ClientError("Unknown MultiAddress. Cannot Decode")
    }
  }

  static from(value: AccountId): MultiAddress {
    return new MultiAddress({ Id: value })
  }

  toString(): string {
    if ("Id" in this.value) return `Id: ${this.value.Id.toSS58()}`
    if ("Index" in this.value) return `Index: ${this.value.Index}`
    if ("Raw" in this.value) return `Raw: ${this.value.Raw}`
    if ("Address32" in this.value) return `Address32: ${this.value.Address32}`

    return `Address20: ${this.value.Address20}`
  }
}
