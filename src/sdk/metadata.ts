import { BN } from "../.."
import { Decoder, uint8ArrayToHex } from "./decoder"
import { decodeAddress, encodeAddress } from "@polkadot/util-crypto"
import { hexToU8a } from "@polkadot/util"

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
  public value: Uint8Array

  constructor(value: Uint8Array) {
    if (value.length != 32) {
      throw new Error("Failed to create AccountId. Input needs to have 32 bytes")
    }


    this.value = value
  }

  static fromSS58(value: string): AccountId {
    return new AccountId(decodeAddress(value))
  }

  toSS58(): string {
    return encodeAddress(this.value)
  }

  toHex(): string {
    return uint8ArrayToHex(this.value)
  }

  toHuman(): string {
    return this.toSS58()
  }

  toString(): string {
    return this.toSS58()
  }
}

export class H256 {
  public value: Uint8Array

  constructor(value: Uint8Array) {
    this.value = value
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
    return uint8ArrayToHex(this.value)
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