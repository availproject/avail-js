import { BN } from "."
import Decoder from "./decoder"
import Encoder from "./encoder"

export class VecU8 {
  public value: Uint8Array
  constructor(value: Uint8Array) {
    this.value = value
  }

  static decode(decoder: Decoder): Uint8Array | null {
    return decoder.arrayU8()
  }

  encode(): Uint8Array {
    return Encoder.arrayU8(this.value)
  }
}

export class U8 {
  public value: number
  constructor(value: number) {
    this.value = value
  }

  static decode(decoder: Decoder): number | null {
    return decoder.u8()
  }

  encode(): Uint8Array {
    return Encoder.u8(this.value, false)
  }
}

export class CompactU8 {
  public value: number
  constructor(value: number) {
    this.value = value
  }

  static decode(decoder: Decoder): number | null {
    return decoder.u8(true)
  }

  encode(): Uint8Array {
    return Encoder.u8(this.value, true)
  }
}

export class U16 {
  public value: number
  constructor(value: number) {
    this.value = value
  }

  static decode(decoder: Decoder): number | null {
    return decoder.u16()
  }

  encode(): Uint8Array {
    return Encoder.u16(this.value, false)
  }
}

export class CompactU16 {
  public value: number
  constructor(value: number) {
    this.value = value
  }

  static decode(decoder: Decoder): number | null {
    return decoder.u16(true)
  }

  encode(): Uint8Array {
    return Encoder.u16(this.value, true)
  }
}

export class U32 {
  public value: number
  constructor(value: number) {
    this.value = value
  }

  static decode(decoder: Decoder): number | null {
    return decoder.u32()
  }

  encode(): Uint8Array {
    return Encoder.u32(this.value, false)
  }
}

export class CompactU32 {
  public value: number
  constructor(value: number) {
    this.value = value
  }

  static decode(decoder: Decoder): number | null {
    return decoder.u32(true)
  }

  encode(): Uint8Array {
    return Encoder.u32(this.value, true)
  }
}

export class U64 {
  public value: BN
  constructor(value: BN) {
    this.value = value
  }

  static decode(decoder: Decoder): BN | null {
    return decoder.u64()
  }

  encode(): Uint8Array {
    return Encoder.u64(this.value, false)
  }
}

export class CompactU64 {
  public value: BN
  constructor(value: BN) {
    this.value = value
  }

  static decode(decoder: Decoder): BN | null {
    return decoder.u64(true)
  }

  encode(): Uint8Array {
    return Encoder.u64(this.value, true)
  }
}

export class U128 {
  public value: BN
  constructor(value: BN) {
    this.value = value
  }

  static decode(decoder: Decoder): BN | null {
    return decoder.u128()
  }

  encode(): Uint8Array {
    return Encoder.u128(this.value, false)
  }
}

export class CompactU128 {
  public value: BN
  constructor(value: BN) {
    this.value = value
  }

  static decode(decoder: Decoder): BN | null {
    return decoder.u128(true)
  }

  encode(): Uint8Array {
    return Encoder.u128(this.value, true)
  }
}
