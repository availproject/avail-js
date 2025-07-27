import { decodeAddress, encodeAddress } from "@polkadot/util-crypto"
import { BN, hexToU8a, u8aToHex } from "@polkadot/util"
import { Struct } from "@polkadot/types-codec"
import { IExtrinsicEra, IRuntimeVersionBase } from "@polkadot/types/types"
import { KeyringPair } from "@polkadot/keyring/types"
import Decoder from "./decoder"
import Encoder from "./encoder"
import { mergeArrays } from "./utils"
import { GeneralError } from "./error"

// Re-export polkadot types
export { SignedBlock, Header } from "@polkadot/types/interfaces"
export { KeyringPair } from "@polkadot/keyring/types"
export { Keyring } from "@polkadot/api"
export { BN, hexToU8a, u8aToHex } from "@polkadot/util"
export { cryptoWaitReady } from "@polkadot/util-crypto"
export { AvailHeader } from "./../helpers/index"

export * as utils from "./utils"
export * as avail from "./chain_types"
export * as rpc from "./rpc/index"
export * as systemRpc from "./rpc/system"
export * as accounts from "./accounts"
export * from "./error"

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
    return u8aToHex(this.value)
  }

  toHuman(): string {
    return this.toSS58()
  }

  toString(): string {
    return this.toSS58()
  }
}

export class H256 {
  // 32 Bytes
  public value: Uint8Array

  constructor(value: Uint8Array) {
    if (value.length != 32) {
      throw new Error(`Failed to create H256. Input needs to have 32 bytes. Input has ${value.length} bytes`)
    }

    this.value = value
  }

  static decode(decoder: Decoder): H256 | GeneralError {
    const data = decoder.bytes(32)
    if (data instanceof GeneralError) {
      return data
    }

    return new H256(data)
  }

  static fromString(value: string): H256 {
    if (value.startsWith("0x")) {
      value = value.slice(2)
    }

    if (value.length != 64) {
      throw new Error("Failed to create H256. Input needs to have 64 bytes")
    }

    return new H256(hexToU8a(value))
  }

  static default(): H256 {
    return this.fromString("0x0000000000000000000000000000000000000000000000000000000000000000")
  }

  toHuman(): string {
    return this.toHex()
  }

  toString(): string {
    return this.toHex()
  }

  toHex(): string {
    return u8aToHex(this.value)
  }
}

export class DispatchError {
  public other: boolean | null = null
  public cannotLookup: boolean | null = null
  public badOrigin: boolean | null = null
  public module: ModuleError | null = null
  public consumerRemaining: boolean | null = null
  public noProviders: boolean | null = null
  public token: TokenError | null = null
  public arithmetic: ArithmeticError | null = null
  public transactional: TransactionalError | null = null

  constructor() {}

  static decode(decoder: Decoder): DispatchError | GeneralError {
    const variant = decoder.u8()
    if (variant instanceof GeneralError) {
      return variant
    }

    const value = new DispatchError()
    switch (variant) {
      case 0:
        value.other = true
        return value
      case 1:
        value.cannotLookup = true
        return value
      case 2:
        value.badOrigin = true
        return value
      case 3:
        const module = ModuleError.decode(decoder)
        if (module instanceof GeneralError) {
          return module
        }
        value.module = module
        return value
      case 4:
        value.consumerRemaining = true
        return value
      case 5:
        value.noProviders = true
        return value
      case 6:
        throw new Error("TODO")
      case 7:
        value.token = new TokenError(decoder)
        return value
      case 8:
        value.arithmetic = new ArithmeticError(decoder)
        return value
      case 9:
        value.transactional = new TransactionalError(decoder)
        return value
      case 10:
        throw new Error("TODO")
      case 11:
        throw new Error("TODO")
      case 12:
        throw new Error("TODO")
      case 13:
        throw new Error("TODO")
      default:
        return new GeneralError("Unknown DispatchError")
    }
  }

  /*   toString(): string {
      switch (this.variantIndex) {
        case 0:
          return "Other"
        case 1:
          return "CannotLookup"
        case 2:
          return "BadOrigin"
        case 3:
          return `Module. Index: ${this.module?.index}`
        case 4:
          return "ConsumerRemaining"
        case 5:
          return "NoProviders"
        case 6:
          return "TooManyConsumers"
        case 7:
          return `Token. ${this.token?.toString()}`
        case 8:
          return `Arithmetic. ${this.arithmetic?.toString()}`
        case 9:
          return `Transactional. ${this.transactional?.toString()}`
        case 10:
          return "Exhausted"
        case 11:
          return "Corruption"
        case 12:
          return "Unavailable"
        case 13:
          return "RootNotAllowed"
        default:
          throw new Error("Unknown DispatchError")
      }
    } */
}

export class ModuleError {
  constructor(
    public index: number,
    public error: Uint8Array,
  ) {
    this.index = index
    this.error = error
  }

  static decode(decoder: Decoder): ModuleError | GeneralError {
    const index = decoder.u8()
    if (index instanceof GeneralError) {
      return index
    }

    const error = decoder.bytes(4)
    if (error instanceof GeneralError) {
      return error
    }

    return new ModuleError(index, error)
  }
}

export class TokenError {
  public variantIndex: number
  constructor(decoder: Decoder) {
    this.variantIndex = decoder.u8()
  }

  toString(): string {
    switch (this.variantIndex) {
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
        throw new Error("Unknown TokenError")
    }
  }
}

export class ArithmeticError {
  public underflow: boolean | null = null
  public overflow: boolean | null = null
  public divisionByZero: boolean | null = null
  constructor() {}

  static decode(decoder: Decoder): ArithmeticError | GeneralError {
    const variant = decoder.u8()
    if (variant instanceof GeneralError) {
      return variant
    }

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
        throw new Error("Unknown ArithmeticError")
    }
  }

  /*   toString(): string {
      switch (this.variantIndex) {
        case 0:
          return "Underflow"
        case 1:
          return "Overflow"
        case 2:
          return "DivisionByZero"
        default:
          throw new Error("Unknown ArithmeticError")
      }
    } */
}

export class TransactionalError {
  public limitReached: boolean | null = null
  public noLayer: boolean | null = null
  constructor() {}

  static decode(decoder: Decoder): TransactionalError | GeneralError {
    const variant = decoder.u8()
    if (variant instanceof GeneralError) {
      return variant
    }

    const value = new TransactionalError()
    switch (variant) {
      case 0:
        value.limitReached = true
        return value
      case 1:
        value.noLayer = true
        return value
      default:
        throw new Error("Unknown TransactionalError")
    }
  }

  /*   toString(): string {
      switch (this.variantIndex) {
        case 0:
          return "LimitReached"
        case 1:
          return "NoLayer"
        default:
          throw new Error("Unknown TransactionalError")
      }
    } */
}

export class DispatchResult {
  public ok: boolean | null = null
  public err: DispatchError | null = null
  constructor() {}

  static decode(decoder: Decoder): DispatchResult | GeneralError {
    const variant = decoder.u8()
    if (variant instanceof GeneralError) {
      return variant
    }

    const value = new DispatchResult()
    switch (variant) {
      case 0:
        value.ok = true
        return value
      case 1:
        const err = DispatchError.decode(decoder)
        if (err instanceof GeneralError) {
          return err
        }
        value.err = err
        return value
      default:
        throw new Error("Unknown DispatchResult")
    }
  }

  /*   toString(): string {
      switch (this.variantIndex) {
        case 0:
          return "Ok"
        case 1:
          return `Err: ${this.err?.toString()}`
        default:
          throw new Error("Unknown DispatchResult")
      }
    } */
}

export class Weight {
  public refTime: BN
  public proofSize: BN

  constructor(decoder: Decoder) {
    this.refTime = decoder.u64(true)
    this.proofSize = decoder.u64(true)
  }
}

export class DispatchClass {
  public variantIndex: number
  constructor(decoder: Decoder) {
    this.variantIndex = decoder.u8()

    switch (this.variantIndex) {
      case 0:
      case 1:
      case 2:
        break
      default:
        throw new Error("Unknown DispatchClass")
    }
  }

  toString(): string {
    switch (this.variantIndex) {
      case 0:
        return "Normal"
      case 1:
        return "Operational"
      case 2:
        return "Mandatory"
      default:
        throw new Error("Unknown DispatchClass")
    }
  }
}

export class RuntimeDispatchInfo {
  public weight: Weight
  public class: DispatchClass
  public partialFee: BN
  constructor(decoder: Decoder) {
    this.weight = new Weight(decoder)
    this.class = new DispatchClass(decoder)
    this.partialFee = decoder.u128()
  }
}

export class InclusionFee {
  public baseFee: BN
  public lenFee: BN
  public adjustedWeightFee: BN
  constructor(decoder: Decoder) {
    this.baseFee = decoder.u128()
    this.lenFee = decoder.u128()
    this.adjustedWeightFee = decoder.u128()
  }
}

export class FeeDetails {
  public inclusionFee: InclusionFee | null
  constructor(decoder: Decoder) {
    this.inclusionFee = null

    const isValueThere = decoder.u8()
    if (isValueThere == 1) {
      this.inclusionFee = new InclusionFee(decoder)
    }
  }
}

export class Pays {
  public variantIndex: number
  constructor(decoder: Decoder) {
    this.variantIndex = decoder.u8()

    switch (this.variantIndex) {
      case 0:
      case 1:
        break
      default:
        throw new Error("Unknown Pays")
    }
  }

  toString(): string {
    switch (this.variantIndex) {
      case 0:
        return "Yes"
      case 1:
        return "No"
      default:
        throw new Error("Unknown Pays")
    }
  }
}

export class DispatchInfo {
  public weight: Weight
  public class: DispatchClass
  public pays: Pays
  public feeModifier: DispatchFeeModifier
  constructor(decoder: Decoder) {
    this.weight = new Weight(decoder)
    this.class = new DispatchClass(decoder)
    this.pays = new Pays(decoder)
    this.feeModifier = new DispatchFeeModifier(decoder)
  }
}

export class DispatchFeeModifier {
  public weightMaximumFee: BN | null
  public weightFeeDivider: number | null
  public weightFeeMultiplier: number | null
  constructor(decoder: Decoder) {
    this.weightMaximumFee = null
    this.weightFeeDivider = null
    this.weightFeeMultiplier = null

    const isPresent1 = decoder.u8()
    if (isPresent1 == 1) {
      this.weightMaximumFee = decoder.u128()
    }
    const isPresent2 = decoder.u8()
    if (isPresent2 == 1) {
      this.weightFeeDivider = decoder.u32()
    }
    const isPresent3 = decoder.u8()
    if (isPresent3 == 1) {
      this.weightFeeMultiplier = decoder.u32()
    }
  }
}

export class PerDispatchClassU32 {
  public normal: number
  public operational: number
  public mandatory: number
  constructor(decoder: Decoder) {
    this.normal = decoder.u32()
    this.operational = decoder.u32()
    this.mandatory = decoder.u32()
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

  static fromHex(keys: string): SessionKeys {
    if (keys.startsWith("0x")) {
      keys = keys.slice(2, undefined)
    }
    const babe = H256.fromString(keys.slice(0, 64))
    const grandpa = H256.fromString(keys.slice(64, 128))
    const imOnline = H256.fromString(keys.slice(128, 192))
    const authorityDiscovery = H256.fromString(keys.slice(192, 256))

    return new SessionKeys(babe, grandpa, imOnline, authorityDiscovery)
  }
}

export class ProxyType {
  public variantIndex: number
  constructor(decoder: Decoder) {
    this.variantIndex = decoder.u8()

    switch (this.variantIndex) {
      case 0:
      case 1:
      case 2:
      case 3:
      case 4:
      case 5:
        break
      default:
        throw new Error("Unknown ProxyType")
    }
  }

  toString(): string {
    switch (this.variantIndex) {
      case 0:
        return "Any"
      case 1:
        return "NonTransfer"
      case 2:
        return "Governance"
      case 3:
        return "Staking"
      case 4:
        return "IdentityJudgement"
      case 5:
        return "NominationPools"
      default:
        throw new Error("Unknown ProxyType")
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

export class AlreadyEncoded {
  value: Uint8Array
  public constructor(value: Uint8Array) {
    this.value = value
  }

  public static decode(decoder: Decoder): AlreadyEncoded {
    return new AlreadyEncoded(decoder.remainingBytes())
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

  public static decode(decoder: Decoder): MultiSignature | GeneralError {
    const variant = decoder.u8()
    if (variant instanceof GeneralError) {
      return variant
    }

    const value = new MultiSignature()
    switch (variant) {
      case 0:
        const ed25519 = decoder.bytes(64)
        if (ed25519 instanceof GeneralError) {
          return ed25519
        }
        value.ed25519 = ed25519
        return value
      case 1:
        const sr25519 = decoder.bytes(64)
        if (sr25519 instanceof GeneralError) {
          return sr25519
        }
        value.sr25519 = sr25519
        return value
      case 2:
        const ecdsa = decoder.bytes(65)
        if (ecdsa instanceof GeneralError) {
          return ecdsa
        }
        value.ecdsa = ecdsa
        return value
      default:
        return new GeneralError("Unknown MultiSignature")
    }
  }

  public toString(): string {
    if (this.ed25519 != null) {
      return `Ed25519: ${u8aToHex(this.ed25519)}`
    }

    if (this.sr25519 != null) {
      return `Sr25519: ${u8aToHex(this.sr25519)}`
    }

    if (this.ecdsa != null) {
      return `Ecdsa: ${u8aToHex(this.ecdsa)}`
    }

    throw new Error("Unknown MultiSignature. Cannot toString")
  }
}

export class MultiAddress {
  public id: AccountId | null = null // AccountId
  public index: number | null = null // u32
  public raw: Uint8Array | null = null // []byte
  public address32: Uint8Array | null = null // [32]byte
  public address20: Uint8Array | null = null // [20]byte

  public constructor() {}

  encode(): Uint8Array {
    if (this.id != null) {
      return mergeArrays([Encoder.u8(0), Encoder.any(this.id)])
    }
    if (this.index != null) {
      return mergeArrays([Encoder.u8(1), Encoder.u32(this.index)])
    }
    if (this.raw != null) {
      return mergeArrays([Encoder.u8(2), Encoder.arrayU8(this.raw)])
    }
    if (this.address32 != null) {
      return mergeArrays([Encoder.u8(3), this.address32])
    }
    if (this.address20 != null) {
      return mergeArrays([Encoder.u8(4), this.address20])
    }

    throw new Error("Unknown MultiAddress. Cannot Encode")
  }

  static decode(decoder: Decoder): MultiAddress | GeneralError {
    const variantIndex = decoder.u8()

    const value = new MultiAddress()
    switch (variantIndex) {
      case 0:
        const id = AccountId.decode(decoder)
        if (id instanceof GeneralError) {
          return id
        }
        value.id = id
        return value
      case 1:
        const index = decoder.u32()
        if (index instanceof GeneralError) {
          return index
        }
        value.index = index
        return value
      case 2:
        const raw = decoder.arrayU8()
        if (raw instanceof GeneralError) {
          return raw
        }
        value.raw = raw
        return value
      case 3:
        const address32 = decoder.bytes(32)
        if (address32 instanceof GeneralError) {
          return address32
        }
        value.address32 = address32
        return value
      case 4:
        const address20 = decoder.bytes(20)
        if (address20 instanceof GeneralError) {
          return address20
        }
        value.address20 = address20
        return value
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
