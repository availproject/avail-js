import {
  BN,
  IExtrinsicEra,
  IRuntimeVersionBase,
  encodeAddress,
  decodeAddress,
  KeyringPair,
  u8aToHex,
  AuthoritySignature,
} from "./polkadot"
import { ValidationError, DecodeError } from "../errors/sdk-error"
import { hexDecode } from "./utils"
import { AvailHeader } from "./header"
import { BlockAt } from "../types"

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

export type EraValue = "Immortal" | { Mortal: [number, number] }
export type Extension = { era: EraValue; nonce: number; tip: BN }
/// Ed25519 -> [64]byte, Sr25519 -> [64]byte, Ecdsa -> [65]byte
export type MultiSignature = { Ed25519: Uint8Array } | { Sr25519: Uint8Array } | { Ecdsa: Uint8Array }
export type MultiAddress =
  | { Id: AccountId }
  | { Index: number } // Compact<u32>
  | { Raw: Uint8Array } // Vec<u8>
  | { Address32: Uint8Array } // [32]byte
  | { Address20: Uint8Array } // [20]byte
export type Weight = { refTime: BN; proofSize: BN }
export type PerDispatchClassWeight = { normal: Weight; operational: Weight; mandatory: Weight }
export type DispatchClass = "Normal" | "Operational" | "Mandatory"
export type RuntimeDispatchInfo = { weight: Weight; c: DispatchClass; partialFee: BN }
export type Pays = "Yes" | "No"
export type DispatchInfo = { weight: Weight; c: DispatchClass; pays: Pays; feeModifier: DispatchFeeModifier }
export type DispatchFeeModifier = {
  weightMaximumFee: BN | null
  weightFeeDivider: number | null
  weightFeeMultiplier: number | null
}
export type DispatchResult = "Ok" | { Err: DispatchError }
export type DispatchError =
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
export type AccountInfo = {
  nonce: number
  consumers: number
  providers: number
  sufficients: number
  data: AccountData
}
export type AccountData = { free: BN; reserved: BN; frozen: BN; flags: BN }
export type AuthorityList = [AccountId, BN][]
export type PerDispatchClassU32 = { normal: number; operational: number; mandatory: number }
export type InclusionFee = { baseFee: BN; lenFee: BN; adjustedWeightFee: BN }
export type FeeDetails = InclusionFee | null
export type ModuleError = { index: number; error: Uint8Array }
export type TransactionalError = "LimitReached" | "NoLayer"
export type TokenError =
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
export type ArithmeticError = "Underflow" | "Overflow" | "DivisionByZero"
export type StorageHasher =
  | "Blake2_128"
  | "Blake2_256"
  | "Blake2_128Concat"
  | "Twox128"
  | "Twox256"
  | "Twox64Concat"
  | "Identity"

export class AccountId {
  value: Uint8Array // 32 Bytes

  constructor(value: Uint8Array) {
    if (value.length != 32)
      throw new ValidationError(
        `Failed to create AccountId. Input needs to have 32 bytes. Input has ${value.length} bytes`,
      )

    this.value = value
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
    return { Id: this }
  }
}

export class H256 {
  value: Uint8Array // 32 Bytes

  constructor(value: Uint8Array) {
    if (value.length != 32)
      throw new ValidationError(`Failed to create H256. Input needs to have 32 bytes. Input has ${value.length} bytes`)

    this.value = value
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
  id: AccountId
}

export interface GrandpaPrecommit {
  target_hash: string
  target_number: number
}
