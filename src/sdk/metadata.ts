import { BN } from "./."
import { Decoder } from "./decoder"
import { decodeAddress, encodeAddress } from "@polkadot/util-crypto"
import { hexToU8a, u8aToHex } from "@polkadot/util"

export class AccountData {
  public free: BN
  public reserved: BN
  public frozen: BN
  public flags: BN

  constructor(decoder: Decoder) {
    this.free = decoder.decodeU128()
    this.reserved = decoder.decodeU128()
    this.frozen = decoder.decodeU128()
    this.flags = decoder.decodeU128()
  }
}

export class AccountId {
  // 32 Bytes
  public value: Uint8Array

  constructor(value: Uint8Array) {
    if (value.length != 32) {
      throw new Error(`Failed to create AccountId. Input needs to have 32 bytes. Input has ${value.length} bytes`)
    }


    this.value = value
  }

  static decode(decoder: Decoder): AccountId {
    const data = decoder.bytes(32)
    return new AccountId(data)
  }

  static fromSS58(value: string): AccountId {
    return new AccountId(decodeAddress(value))
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

  static decode(decoder: Decoder): H256 {
    const data = decoder.bytes(32)
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
  public variantIndex: number
  public module: ModuleError | undefined
  public token: TokenError | undefined
  public arithmetic: ArithmeticError | undefined
  public transactional: TransactionalError | undefined

  constructor(decoder: Decoder) {
    this.variantIndex = decoder.decodeU8()

    switch (this.variantIndex) {
      case 0:
      case 1:
      case 2:
        break
      case 3:
        this.module = new ModuleError(decoder)
        break;
      case 4:
      case 5:
      case 6:
        break
      case 7:
        this.token = new TokenError(decoder)
        break;
      case 8:
        this.arithmetic = new ArithmeticError(decoder)
        break;
      case 9:
        this.transactional = new TransactionalError(decoder)
        break;
      case 10:
      case 11:
      case 12:
      case 13:
        break;
      default:
        throw new Error("Unknown DispatchError")
    }
  }

  toString(): string {
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
  }
}

export class ModuleError {
  public index: number
  public error: Uint8Array
  constructor(decoder: Decoder) {
    this.index = decoder.decodeU8()
    this.error = decoder.bytes(4)
  }
}

export class TokenError {
  public variantIndex: number
  constructor(decoder: Decoder) {
    this.variantIndex = decoder.decodeU8()
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
  public variantIndex: number
  constructor(decoder: Decoder) {
    this.variantIndex = decoder.decodeU8()
  }

  toString(): string {
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
  }
}

export class TransactionalError {
  public variantIndex: number
  constructor(decoder: Decoder) {
    this.variantIndex = decoder.decodeU8()
  }

  toString(): string {
    switch (this.variantIndex) {
      case 0:
        return "LimitReached"
      case 1:
        return "NoLayer"
      default:
        throw new Error("Unknown TransactionalError")
    }
  }
}

export class DispatchResult {
  public variantIndex: number
  public err: DispatchError | undefined
  constructor(decoder: Decoder) {
    this.variantIndex = decoder.decodeU8()
    switch (this.variantIndex) {
      case 0:
        break;
      case 1:
        this.err = new DispatchError(decoder)
        break;
      default:
        throw new Error("Unknown DispatchResult")
    }
  }

  toString(): string {
    switch (this.variantIndex) {
      case 0:
        return "Ok"
      case 1:
        return `Err: ${this.err?.toString()}`
      default:
        throw new Error("Unknown DispatchResult")
    }
  }
}


export class Weight {
  public refTime: BN
  public proofSize: BN

  constructor(decoder: Decoder) {
    this.refTime = decoder.decodeU64(true)
    this.proofSize = decoder.decodeU64(true)
  }
}

export class DispatchClass {
  public variantIndex: number
  constructor(decoder: Decoder) {
    this.variantIndex = decoder.decodeU8()

    switch (this.variantIndex) {
      case 0:
      case 1:
      case 2:
        break;
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
    this.partialFee = decoder.decodeU128()
  }
}

export class InclusionFee {
  public baseFee: BN
  public lenFee: BN
  public adjustedWeightFee: BN
  constructor(decoder: Decoder) {
    this.baseFee = decoder.decodeU128()
    this.lenFee = decoder.decodeU128()
    this.adjustedWeightFee = decoder.decodeU128()
  }
}

export class FeeDetails {
  public inclusionFee: InclusionFee | null
  constructor(decoder: Decoder) {
    this.inclusionFee = null

    const isValueThere = decoder.decodeU8()
    if (isValueThere == 1) {
      this.inclusionFee = new InclusionFee(decoder)
    }
  }
}

export class Pays {
  public variantIndex: number
  constructor(decoder: Decoder) {
    this.variantIndex = decoder.decodeU8()

    switch (this.variantIndex) {
      case 0:
      case 1:
        break;
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

    const isPresent1 = decoder.decodeU8()
    if (isPresent1 == 1) {
      this.weightMaximumFee = decoder.decodeU128()
    }
    const isPresent2 = decoder.decodeU8()
    if (isPresent2 == 1) {
      this.weightFeeDivider = decoder.decodeU32()
    }
    const isPresent3 = decoder.decodeU8()
    if (isPresent3 == 1) {
      this.weightFeeMultiplier = decoder.decodeU32()
    }
  }
}

export class PerDispatchClassU32 {
  public normal: number
  public operational: number
  public mandatory: number
  constructor(decoder: Decoder) {
    this.normal = decoder.decodeU32()
    this.operational = decoder.decodeU32()
    this.mandatory = decoder.decodeU32()
  }
}

export class SessionKeys {
  constructor(public babe: H256, public grandpa: H256, public imOnline: H256, public authorityDiscovery: H256) { }
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
    this.variantIndex = decoder.decodeU8()

    switch (this.variantIndex) {
      case 0:
      case 1:
      case 2:
      case 3:
      case 4:
      case 5:
        break;
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
  constructor(public height: number, public index: number) { }
  static decode(decoder: Decoder): TimepointBlocknumber {
    return new TimepointBlocknumber(decoder.decodeU32(), decoder.decodeU32())
  }
}
