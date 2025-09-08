import { Decoder, Encoder } from "."
import { BN } from "./../polkadot"
import { ClientError } from "./../../error"
import { IEncodable, IDecodable } from "./../../interface"

// Dynamic Array
export class VecU8 {
  constructor(public value: Uint8Array) {}

  static decode(decoder: Decoder): Uint8Array | ClientError {
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

  static decode(decoder: Decoder): Uint8Array | ClientError {
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

  static decode(decoder: Decoder): Uint8Array | ClientError {
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

  static decode(decoder: Decoder): Uint8Array | ClientError {
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

  static decode(decoder: Decoder): Uint8Array | ClientError {
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
  static decode<T>(as: IDecodable<T>, decoder: Decoder): T[] | ClientError {
    return decoder.vec(as)
  }

  static encode<T>(list: (T & IEncodable)[]): Uint8Array {
    return Encoder.vec(list)
  }
}

export class Bool {
  constructor(public value: boolean) {}

  static decode(decoder: Decoder): boolean | ClientError {
    const byte = decoder.u8()
    if (byte instanceof ClientError) return byte
    if (byte == 0) return false
    if (byte == 1) return true

    return new ClientError("Invalid boolean value.")
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

  static decode(decoder: Decoder): number | ClientError {
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

  static decode(decoder: Decoder): number | ClientError {
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

  static decode(decoder: Decoder): number | ClientError {
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

  static decode(decoder: Decoder): number | ClientError {
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

  static decode(decoder: Decoder): number | ClientError {
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

  static decode(decoder: Decoder): number | ClientError {
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

  static decode(decoder: Decoder): BN | ClientError {
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

  static decode(decoder: Decoder): BN | ClientError {
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

  static decode(decoder: Decoder): BN | ClientError {
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

  static decode(decoder: Decoder): BN | ClientError {
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
  static decode<T>(as: IDecodable<T>, decoder: Decoder): T | null | ClientError {
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
