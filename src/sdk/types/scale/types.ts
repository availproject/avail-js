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

  static encode(value: VecU8): Uint8Array {
    return value.encode()
  }

  encode(): Uint8Array {
    return Encoder.vecU8(this.value)
  }
}

// Fixed Array
export class ArrayU8 {
  constructor(
    public value: Uint8Array,
    public length: number,
  ) {}

  static decode(decoder: Decoder): Uint8Array | ClientError {
    return decoder.bytes(this.length)
  }

  encode(): Uint8Array {
    return this.value
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

  encode(): Uint8Array {
    return Encoder.bool(this.value)
  }
}

export class U8 {
  constructor(public value: number) {}

  static decode(decoder: Decoder): number | ClientError {
    return decoder.u8()
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

  encode(): Uint8Array {
    return Encoder.u8(this.value, true)
  }
}

export class U16 {
  constructor(public value: number) {}

  static decode(decoder: Decoder): number | ClientError {
    return decoder.u16()
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

  encode(): Uint8Array {
    return Encoder.u16(this.value, true)
  }
}

export class U32 {
  constructor(public value: number) {}

  static decode(decoder: Decoder): number | ClientError {
    return decoder.u32()
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

  encode(): Uint8Array {
    return Encoder.u32(this.value, true)
  }
}

export class U64 {
  constructor(public value: BN) {}

  static decode(decoder: Decoder): BN | ClientError {
    return decoder.u64()
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

  encode(): Uint8Array {
    return Encoder.u64(this.value, true)
  }
}

export class U128 {
  constructor(public value: BN) {}

  static decode(decoder: Decoder): BN | ClientError {
    return decoder.u128()
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

  encode(): Uint8Array {
    return Encoder.u128(this.value, true)
  }
}

export class Option<S> {
  constructor(public value: (IEncodable & IDecodable<S>) | null) {}

  static decode<S extends IDecodable<S>>(decoder: Decoder): S | null | ClientError {
    return decoder.option({} as S)
  }

  encode(): Uint8Array {
    return Encoder.option(this.value)
  }
}

export class AlreadyEncoded {
  value: Uint8Array
  constructor(value: Uint8Array) {
    this.value = value
  }

  static decode(decoder: Decoder): AlreadyEncoded {
    return new AlreadyEncoded(decoder.remainingBytes())
  }

  static encode(value: AlreadyEncoded): Uint8Array {
    return value.encode()
  }

  encode(): Uint8Array {
    return this.value
  }
}
