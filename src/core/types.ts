import { Struct } from "@polkadot/types-codec"
import { IExtrinsicEra, IRuntimeVersionBase } from "@polkadot/types/types"
import {
  GeneralError,
  KeyringPair,
  BN,
  Decoder,
  Encoder,
  Hex,
  Utils,
  decodeAddress,
  encodeAddress,
  Nothing,
  U128,
  U32,
} from "./index"

export type BlockState = "Included" | "Finalized" | "Discarded" | "DoesNotExist"
export type HashNumber = { Hash: string } | { Number: number }
export type BlockId = HashNumber

export interface SignatureOptions {
  nonce?: number
  tip?: BN
  app_id?: number
  mortality?: Mortality
}

export interface RefinedOptions {
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

export type BlockLocation = {
  hash: H256
  height: number
}

export type TransactionLocation = {
  hash: H256
  index: number
}

export interface AccountInfo extends Struct {
  nonce: BN
  consumers: BN
  providers: BN
  sufficients: BN
  data: AccountData
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

  static decode(decoder: Decoder): AccountData | GeneralError {
    const free = decoder.u128()
    if (free instanceof GeneralError) {
      return free
    }

    const reserved = decoder.u128()
    if (reserved instanceof GeneralError) {
      return reserved
    }

    const frozen = decoder.u128()
    if (frozen instanceof GeneralError) {
      return frozen
    }

    const flags = decoder.u128()
    if (flags instanceof GeneralError) {
      return flags
    }

    return new AccountData(free, reserved, frozen, flags)
  }
}

export class AccountId {
  public value: Uint8Array // 32 Bytes

  constructor(value: Uint8Array) {
    if (value.length != 32) {
      throw new Error(`Failed to create AccountId. Input needs to have 32 bytes. Input has ${value.length} bytes`)
    }

    this.value = value
  }

  encode(): Uint8Array {
    return this.value
  }

  static decode(decoder: Decoder): AccountId | GeneralError {
    const data = decoder.bytes(32)
    if (data instanceof GeneralError) {
      return data
    }
    return new AccountId(data)
  }

  static fromSS58(value: string): AccountId {
    return new AccountId(decodeAddress(value))
  }

  static fromKeyringPair(value: KeyringPair): AccountId {
    return AccountId.fromSS58(value.address)
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
    const address = new MultiAddress()
    address.id = this
    return address
  }
}

export class H256 {
  public value: Uint8Array // 32 Bytes

  constructor(value: Uint8Array) {
    if (value.length != 32) {
      throw new Error(`Failed to create H256. Input needs to have 32 bytes. Input has ${value.length} bytes`)
    }

    this.value = value
  }

  encode(): Uint8Array {
    return this.value
  }

  static decode(decoder: Decoder): H256 | GeneralError {
    const data = decoder.bytes(32)
    if (data instanceof GeneralError) {
      return data
    }

    return new H256(data)
  }

  static fromHex(value: string): H256 | GeneralError {
    if (value.startsWith("0x")) {
      value = value.slice(2)
    }

    if (value.length != 64) {
      return new GeneralError("Failed to create H256. Input needs to have 64 bytes")
    }

    const decoded = Hex.decode(value)
    if (decoded instanceof GeneralError) {
      return decoded
    }

    return new H256(decoded)
  }

  static fromHexUnsafe(value: string): H256 {
    const hex = H256.fromHex(value)
    if (hex instanceof GeneralError) {
      throw Error(hex.value)
    }

    return hex
  }

  static default(): H256 {
    return this.fromHexUnsafe("0x0000000000000000000000000000000000000000000000000000000000000000")
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
    switch (this.value) {
      case "Other":
        return Encoder.u8(0)
      case "CannotLookup":
        return Encoder.u8(1)
      case "BadOrigin":
        return Encoder.u8(2)
      case "ConsumerRemaining":
        return Encoder.u8(4)
      case "NoProviders":
        return Encoder.u8(5)
      case "TooManyConsumers":
        return Encoder.u8(6)
      case "Exhausted":
        return Encoder.u8(10)
      case "Corruption":
        return Encoder.u8(11)
      case "Unavailable":
        return Encoder.u8(12)
      case "RootNotAllowed":
        return Encoder.u8(13)
    }

    if ("Module" in this.value) return Encoder.enum(3, this.value.Module)
    if ("Token" in this.value) return Encoder.enum(7, this.value.Token)
    if ("Arithmetic" in this.value) return Encoder.enum(8, this.value.Arithmetic)
    if ("Transactional" in this.value) return Encoder.enum(9, this.value.Transactional)

    throw new Error("Failed to encode DispatchError. Unknown variant")
  }

  static decode(decoder: Decoder): DispatchError | GeneralError {
    const variant = decoder.u8()
    if (variant instanceof GeneralError) return variant

    switch (variant) {
      case 0:
        return new DispatchError("Other")
      case 1:
        return new DispatchError("CannotLookup")
      case 2:
        return new DispatchError("BadOrigin")
      case 3: {
        const module = ModuleError.decode(decoder)
        if (module instanceof GeneralError) return module

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
        if (token instanceof GeneralError) return token

        return new DispatchError({ Token: token })
      }

      case 8: {
        const arithmetic = ArithmeticError.decode(decoder)
        if (arithmetic instanceof GeneralError) return arithmetic

        return new DispatchError({ Arithmetic: arithmetic })
      }

      case 9: {
        const transactional = TransactionalError.decode(decoder)
        if (transactional instanceof GeneralError) return transactional

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
        return new GeneralError("Unknown DispatchError")
    }
  }
}

export class ModuleError {
  constructor(
    public index: number, // u8
    public error: Uint8Array, // 4 bytes
  ) {}

  encode(): Uint8Array {
    return Utils.mergeArrays([Encoder.u8(this.index), this.error])
  }

  static decode(decoder: Decoder): ModuleError | GeneralError {
    const index = decoder.u8()
    if (index instanceof GeneralError) return index

    const error = decoder.bytes(4)
    if (error instanceof GeneralError) return error

    return new ModuleError(index, error)
  }
}

export class TokenError {
  public underflow: boolean | null = null
  public overflow: boolean | null = null
  public belowMinimum: boolean | null = null
  public cannotCreate: boolean | null = null
  public unknownAsset: boolean | null = null
  public frozen: boolean | null = null
  public unsupported: boolean | null = null
  public cannotCreateHold: boolean | null = null
  public notExpendable: boolean | null = null
  public blocked: boolean | null = null
  constructor() {}

  encode(): Uint8Array {
    if (this.underflow != null) return Encoder.u8(0)
    if (this.overflow != null) return Encoder.u8(1)
    if (this.belowMinimum != null) return Encoder.u8(2)
    if (this.cannotCreate != null) return Encoder.u8(3)
    if (this.unknownAsset != null) return Encoder.u8(4)
    if (this.frozen != null) return Encoder.u8(5)
    if (this.unsupported != null) return Encoder.u8(6)
    if (this.cannotCreateHold != null) return Encoder.u8(7)
    if (this.notExpendable != null) return Encoder.u8(8)
    if (this.blocked != null) return Encoder.u8(9)

    throw new Error("Failed to encode TokenError. No variant was set")
  }

  static decode(decoder: Decoder): TokenError | GeneralError {
    const variant = decoder.u8()
    if (variant instanceof GeneralError) return variant

    const value = new TokenError()
    switch (variant) {
      case 0:
        value.underflow = true
        return value
      case 1:
        value.overflow = true
        return value
      case 2:
        value.belowMinimum = true
        return value
      case 3:
        value.cannotCreate = true
        return value
      case 4:
        value.unknownAsset = true
        return value
      case 5:
        value.frozen = true
        return value
      case 6:
        value.unsupported = true
        return value
      case 7:
        value.cannotCreateHold = true
        return value
      case 8:
        value.notExpendable = true
        return value
      case 9:
        value.blocked = true
        return value
      default:
        return new GeneralError("Unknown TokenError")
    }
  }
}

export class ArithmeticError {
  public underflow: boolean | null = null
  public overflow: boolean | null = null
  public divisionByZero: boolean | null = null
  constructor() {}

  encode(): Uint8Array {
    if (this.underflow != null) return Encoder.u8(0)
    if (this.overflow != null) return Encoder.u8(1)
    if (this.divisionByZero != null) return Encoder.u8(2)

    throw new Error("Failed to encode ArithmeticError. No variant was set")
  }

  static decode(decoder: Decoder): ArithmeticError | GeneralError {
    const variant = decoder.u8()
    if (variant instanceof GeneralError) return variant

    const value = new ArithmeticError()
    switch (variant) {
      case 0:
        value.underflow = true
        return value
      case 1:
        value.overflow = true
        return value
      case 2:
        value.divisionByZero = true
        return value
      default:
        return new GeneralError("Unknown ArithmeticError")
    }
  }
}

export class TransactionalError {
  public limitReached: boolean | null = null
  public noLayer: boolean | null = null
  constructor() {}

  encode(): Uint8Array {
    if (this.limitReached != null) return Encoder.u8(0)
    if (this.noLayer != null) return Encoder.u8(1)

    throw new Error("Failed to encode TransactionalError. No variant was set")
  }

  static decode(decoder: Decoder): TransactionalError | GeneralError {
    const variant = decoder.u8()
    if (variant instanceof GeneralError) return variant

    const value = new TransactionalError()
    switch (variant) {
      case 0:
        value.limitReached = true
        return value
      case 1:
        value.noLayer = true
        return value
      default:
        return new GeneralError("Unknown TransactionalError")
    }
  }
}

export class DispatchResult {
  public ok: Nothing | null = null
  public err: DispatchError | null = null
  constructor() {}

  encode(): Uint8Array {
    if (this.ok != null) return Encoder.u8(0)
    if (this.err != null) return Utils.mergeArrays([Encoder.u8(1), Encoder.any(this.err)])

    throw new Error("Failed to encode DispatchResult. No variant was set")
  }

  static decode(decoder: Decoder): DispatchResult | GeneralError {
    const variant = decoder.u8()
    if (variant instanceof GeneralError) return variant

    const value = new DispatchResult()
    switch (variant) {
      case 0:
        value.ok = new Nothing()
        return value
      case 1: {
        const err = DispatchError.decode(decoder)
        if (err instanceof GeneralError) return err

        value.err = err
        return value
      }

      default:
        return new GeneralError("Failed to decode DispatchResult")
    }
  }
}

export class Weight {
  public refTime: BN // Compact
  public proofSize: BN // Compact

  constructor(refTime: BN, proofSize: BN) {
    this.refTime = refTime
    this.proofSize = proofSize
  }

  encode(): Uint8Array {
    return Utils.mergeArrays([Encoder.u64(this.refTime, true), Encoder.u64(this.proofSize, true)])
  }

  static decode(decoder: Decoder): Weight | GeneralError {
    const refTime = decoder.u64(true)
    if (refTime instanceof GeneralError) {
      return refTime
    }
    const proofSize = decoder.u64(true)
    if (proofSize instanceof GeneralError) {
      return proofSize
    }
    return new Weight(refTime, proofSize)
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
        return Encoder.u8(0)
      case "Mandatory":
        return Encoder.u8(0)
    }

    throw new Error("Failed to encode DispatchClass.")
  }

  static decode(decoder: Decoder): DispatchClass | GeneralError {
    const variant = decoder.u8()
    if (variant instanceof GeneralError) return variant

    switch (variant) {
      case 0:
        return new DispatchClass("Normal")
      case 1:
        return new DispatchClass("Operational")
      case 2:
        return new DispatchClass("Mandatory")
      default:
        return new GeneralError("Unknown DispatchClass")
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

  static decode(decoder: Decoder): RuntimeDispatchInfo | GeneralError {
    const weight = Weight.decode(decoder)
    if (weight instanceof GeneralError) {
      return weight
    }
    const c = DispatchClass.decode(decoder)
    if (c instanceof GeneralError) {
      return c
    }
    const partialFee = decoder.u128()
    if (partialFee instanceof GeneralError) {
      return partialFee
    }

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

  static decode(decoder: Decoder): InclusionFee | GeneralError {
    const baseFee = decoder.u128()
    if (baseFee instanceof GeneralError) {
      return baseFee
    }
    const lenFee = decoder.u128()
    if (lenFee instanceof GeneralError) {
      return lenFee
    }
    const adjustedWeightFee = decoder.u128()
    if (adjustedWeightFee instanceof GeneralError) {
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

  static decode(decoder: Decoder): FeeDetails | GeneralError {
    const inclusionFee = decoder.option(InclusionFee)
    if (inclusionFee instanceof GeneralError) return inclusionFee

    return new FeeDetails(inclusionFee)
  }

  public finalFee(): BN | null {
    const fee = this.inclusionFee
    if (fee == null) {
      return null
    }

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

    throw new Error("Failed to encode Pays.")
  }

  static decode(decoder: Decoder): Pays | GeneralError {
    const variant = decoder.u8()
    if (variant instanceof GeneralError) return variant

    switch (variant) {
      case 0:
        return new Pays("Yes")
      case 1:
        return new Pays("No")
      default:
        return new GeneralError("Failed to decode Pays")
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
    return Utils.mergeArrays([
      Encoder.any(this.weight),
      Encoder.any(this.c),
      Encoder.any(this.pays),
      Encoder.any(this.feeModifier),
    ])
  }

  static decode(decoder: Decoder): DispatchInfo | GeneralError {
    const weight = decoder.any(Weight)
    if (weight instanceof GeneralError) {
      return weight
    }
    const c = decoder.any(DispatchClass)
    if (c instanceof GeneralError) {
      return c
    }
    const pays = decoder.any(Pays)
    if (pays instanceof GeneralError) {
      return pays
    }
    const feeModifier = decoder.any(DispatchFeeModifier)
    if (feeModifier instanceof GeneralError) {
      return feeModifier
    }

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
    return Utils.mergeArrays([weightMaximumFee, weightFeeDivider, weightFeeMultiplier])
  }

  static decode(decoder: Decoder): DispatchFeeModifier | GeneralError {
    const weightMaximumFee = decoder.option(U128)
    if (weightMaximumFee instanceof GeneralError) return weightMaximumFee

    const weightFeeDivider = decoder.option(U32)
    if (weightFeeDivider instanceof GeneralError) return weightFeeDivider

    const weightFeeMultiplier = decoder.option(U32)
    if (weightFeeMultiplier instanceof GeneralError) return weightFeeMultiplier

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

  static decode(decoder: Decoder): PerDispatchClassU32 | GeneralError {
    const normal = decoder.u32()
    if (normal instanceof GeneralError) {
      return normal
    }
    const operational = decoder.u32()
    if (operational instanceof GeneralError) {
      return operational
    }
    const mandatory = decoder.u32()
    if (mandatory instanceof GeneralError) {
      return mandatory
    }

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

  static fromHex(keys: string): SessionKeys | GeneralError {
    if (keys.startsWith("0x")) {
      keys = keys.slice(2, undefined)
    }
    const babe = H256.fromHex(keys.slice(0, 64))
    if (babe instanceof GeneralError) {
      return babe
    }
    const grandpa = H256.fromHex(keys.slice(64, 128))
    if (grandpa instanceof GeneralError) {
      return grandpa
    }
    const imOnline = H256.fromHex(keys.slice(128, 192))
    if (imOnline instanceof GeneralError) {
      return imOnline
    }
    const authorityDiscovery = H256.fromHex(keys.slice(192, 256))
    if (authorityDiscovery instanceof GeneralError) {
      return authorityDiscovery
    }

    return new SessionKeys(babe, grandpa, imOnline, authorityDiscovery)
  }
}

export class ProxyType {
  public any: boolean | null = null
  public nonTransfer: boolean | null = null
  public governance: boolean | null = null
  public staking: boolean | null = null
  public identityJudgement: boolean | null = null
  public nominationPools: boolean | null = null
  constructor() {}

  encode(): Uint8Array {
    if (this.any != null) return Encoder.u8(0)
    if (this.nonTransfer != null) return Encoder.u8(1)
    if (this.governance != null) return Encoder.u8(2)
    if (this.staking != null) return Encoder.u8(3)
    if (this.identityJudgement != null) return Encoder.u8(4)
    if (this.nominationPools != null) return Encoder.u8(5)

    throw Error("Failed to encode ProxyType. No variant was set")
  }

  static decode(decoder: Decoder): ProxyType | GeneralError {
    const variant = decoder.u8()
    if (variant instanceof GeneralError) {
      return variant
    }

    const value = new ProxyType()
    switch (variant) {
      case 0:
        value.any = true
        return value
      case 1:
        value.nonTransfer = true
        return value
      case 2:
        value.governance = true
        return value
      case 3:
        value.staking = true
        return value
      case 4:
        value.identityJudgement = true
        return value
      case 5:
        value.nominationPools = true
        return value
      default:
        return new GeneralError("Unknown ProxyType")
    }
  }
}

export class TimepointBlocknumber {
  constructor(
    public height: number,
    public index: number,
  ) {}

  static decode(decoder: Decoder): TimepointBlocknumber | GeneralError {
    const height = decoder.u32()
    if (height instanceof GeneralError) {
      return height
    }
    const index = decoder.u32()
    if (index instanceof GeneralError) {
      return index
    }

    return new TimepointBlocknumber(height, index)
  }
}

export class TransactionSigned {
  public address: MultiAddress
  public signature: MultiSignature
  public txExtra: TransactionExtra

  public constructor(address: MultiAddress, signature: MultiSignature, txExtra: TransactionExtra) {
    this.address = address
    this.signature = signature
    this.txExtra = txExtra
  }

  public static decode(decoder: Decoder): TransactionSigned | GeneralError {
    const address = MultiAddress.decode(decoder)
    if (address instanceof GeneralError) {
      return address
    }
    const signature = MultiSignature.decode(decoder)
    if (signature instanceof GeneralError) {
      return signature
    }
    const txExtra = TransactionExtra.decode(decoder)
    if (txExtra instanceof GeneralError) {
      return txExtra
    }

    return new TransactionSigned(address, signature, txExtra)
  }
}

export class Era {
  public immortal: boolean | null = null // nothing
  public mortal: [number, number] | null = null // [u64, u64]

  public constructor(immortal: boolean | null, mortal: [number, number] | null) {
    this.immortal = immortal
    this.mortal = mortal
  }

  public static decode(decoder: Decoder): Era | GeneralError {
    const first = decoder.u8()
    if (first instanceof GeneralError) {
      return first
    }

    if (first == 0) {
      return new Era(true, null)
    }

    const nextByte = decoder.byte()
    if (nextByte instanceof GeneralError) {
      return nextByte
    }

    const encoded = first + (nextByte << 8)
    const period = 2 << encoded % (1 << 4)
    const quantizeFactorTmp = period >> 12
    const quantizeFactor = quantizeFactorTmp > 1 ? quantizeFactorTmp : 1
    const phase = (encoded >> 4) * quantizeFactor
    if (period >= 4 && phase < period) {
      return new Era(null, [period, phase])
    } else {
      return new GeneralError("Invalid period and phase")
    }
  }

  public isImmortal(): boolean {
    return this.immortal != null
  }

  public asMortal(): [number, number] {
    return this.mortal!
  }

  public isMortal(): boolean {
    return this.mortal != null
  }
}

export class TransactionExtra {
  public era: Era
  public nonce: number // Compact<u32>
  public tip: BN // Compact<u128>
  public appId: number //  Compact<u32>

  public constructor(era: Era, nonce: number, tip: BN, appId: number) {
    this.era = era
    this.nonce = nonce
    this.tip = tip
    this.appId = appId
  }

  public static decode(decoder: Decoder): TransactionExtra | GeneralError {
    const era = Era.decode(decoder)
    if (era instanceof GeneralError) {
      return era
    }
    const nonce = decoder.u32(true)
    if (nonce instanceof GeneralError) {
      return nonce
    }
    const tip = decoder.u128(true)
    if (tip instanceof GeneralError) {
      return tip
    }
    const appId = decoder.u32(true)
    if (appId instanceof GeneralError) {
      return appId
    }

    return new TransactionExtra(era, nonce, tip, appId)
  }
}

export class MultiSignature {
  public ed25519: Uint8Array | null = null // [64]byte
  public sr25519: Uint8Array | null = null // [64]byte
  public ecdsa: Uint8Array | null = null // [65]byte

  public constructor() {}

  encode(): Uint8Array {
    if (this.ed25519 != null) return Encoder.enum(0, this.ed25519)
    if (this.sr25519 != null) return Encoder.enum(1, this.sr25519)
    if (this.ecdsa != null) return Encoder.enum(2, this.ecdsa)

    throw new Error("Failed to encode MultiSignature. No variant was set")
  }

  public static decode(decoder: Decoder): MultiSignature | GeneralError {
    const variant = decoder.u8()
    if (variant instanceof GeneralError) {
      return variant
    }

    const value = new MultiSignature()
    switch (variant) {
      case 0: {
        const ed25519 = decoder.bytes(64)
        if (ed25519 instanceof GeneralError) return ed25519

        value.ed25519 = ed25519
        return value
      }

      case 1: {
        const sr25519 = decoder.bytes(64)
        if (sr25519 instanceof GeneralError) return sr25519

        value.sr25519 = sr25519
        return value
      }

      case 2: {
        const ecdsa = decoder.bytes(65)
        if (ecdsa instanceof GeneralError) return ecdsa

        value.ecdsa = ecdsa
        return value
      }

      default:
        return new GeneralError("Unknown MultiSignature")
    }
  }

  public toString(): string {
    if (this.ed25519 != null) {
      return `Ed25519: ${Hex.encode(this.ed25519)}`
    }

    if (this.sr25519 != null) {
      return `Sr25519: ${Hex.encode(this.sr25519)}`
    }

    if (this.ecdsa != null) {
      return `Ecdsa: ${Hex.encode(this.ecdsa)}`
    }

    throw new Error("Unknown MultiSignature. Cannot toString")
  }
}

export class MultiAddress {
  public id: AccountId | null = null // AccountId
  public index: number | null = null // u32
  public raw: Uint8Array | null = null // []byte Vec<u8>
  public address32: Uint8Array | null = null // [32]byte
  public address20: Uint8Array | null = null // [20]byte

  public constructor() {}

  encode(): Uint8Array {
    if (this.id != null) return Encoder.enum(0, this.id)
    if (this.index != null) return Encoder.enum(1, Encoder.u32(this.index))
    if (this.raw != null) return Encoder.enum(2, Encoder.vecU8(this.raw))
    if (this.address32 != null) return Encoder.enum(3, this.address32)
    if (this.address20 != null) return Encoder.enum(4, this.address20)

    throw new Error("Failed to encode MultiAddress. No variant was set")
  }

  static decode(decoder: Decoder): MultiAddress | GeneralError {
    const variantIndex = decoder.u8()

    const value = new MultiAddress()
    switch (variantIndex) {
      case 0: {
        const id = AccountId.decode(decoder)
        if (id instanceof GeneralError) return id

        value.id = id
        return value
      }

      case 1: {
        const index = decoder.u32()
        if (index instanceof GeneralError) return index

        value.index = index
        return value
      }

      case 2: {
        const raw = decoder.vecU8()
        if (raw instanceof GeneralError) return raw

        value.raw = raw
        return value
      }

      case 3: {
        const address32 = decoder.bytes(32)
        if (address32 instanceof GeneralError) return address32

        value.address32 = address32
        return value
      }

      case 4: {
        const address20 = decoder.bytes(20)
        if (address20 instanceof GeneralError) return address20

        value.address20 = address20
        return value
      }

      default:
        return new GeneralError("Unknown MultiAddress. Cannot Decode")
    }
  }

  public toString(): string {
    if (this.id != null) {
      return `Id: ${this.id.toSS58()}`
    }
    if (this.index != null) {
      return `Index: ${this.index}`
    }
    if (this.raw != null) {
      return `Raw: ${this.raw}`
    }
    if (this.address32 != null) {
      return `Address32: ${this.address32}`
    }
    if (this.address20 != null) {
      return `Address20: ${this.address20}`
    }

    throw new Error("Unknown MultiAddress. Cannot toString")
  }
}
