import { BN, GeneralError } from "."
import Decoder from "./decoder"
import Encoder from "./encoder"

// Dynamic Array
export class VecU8 {
  constructor(public value: Uint8Array) {}

  static decode(decoder: Decoder): Uint8Array | GeneralError {
    return decoder.vecU8()
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

  static decode(decoder: Decoder): Uint8Array | GeneralError {
    return decoder.bytes(this.length)
  }

  encode(): Uint8Array {
    return this.value
  }
}

export class U8 {
  constructor(public value: number) {}

  static decode(decoder: Decoder): number | GeneralError {
    return decoder.u8()
  }

  encode(): Uint8Array {
    return Encoder.u8(this.value, false)
  }
}

export class CompactU8 {
  constructor(public value: number) {}

  static decode(decoder: Decoder): number | GeneralError {
    return decoder.u8(true)
  }

  encode(): Uint8Array {
    return Encoder.u8(this.value, true)
  }
}

export class U16 {
  constructor(public value: number) {}

  static decode(decoder: Decoder): number | GeneralError {
    return decoder.u16()
  }

  encode(): Uint8Array {
    return Encoder.u16(this.value, false)
  }
}

export class CompactU16 {
  constructor(public value: number) {}

  static decode(decoder: Decoder): number | GeneralError {
    return decoder.u16(true)
  }

  encode(): Uint8Array {
    return Encoder.u16(this.value, true)
  }
}

export class U32 {
  constructor(public value: number) {}

  static decode(decoder: Decoder): number | GeneralError {
    return decoder.u32()
  }

  encode(): Uint8Array {
    return Encoder.u32(this.value, false)
  }
}

export class CompactU32 {
  constructor(public value: number) {}

  static decode(decoder: Decoder): number | GeneralError {
    return decoder.u32(true)
  }

  encode(): Uint8Array {
    return Encoder.u32(this.value, true)
  }
}

export class U64 {
  constructor(public value: BN) {}

  static decode(decoder: Decoder): BN | GeneralError {
    return decoder.u64()
  }

  encode(): Uint8Array {
    return Encoder.u64(this.value, false)
  }
}

export class CompactU64 {
  constructor(public value: BN) {}

  static decode(decoder: Decoder): BN | GeneralError {
    return decoder.u64(true)
  }

  encode(): Uint8Array {
    return Encoder.u64(this.value, true)
  }
}

export class U128 {
  constructor(public value: BN) {}

  static decode(decoder: Decoder): BN | GeneralError {
    return decoder.u128()
  }

  encode(): Uint8Array {
    return Encoder.u128(this.value, false)
  }
}

export class CompactU128 {
  constructor(public value: BN) {}

  static decode(decoder: Decoder): BN | GeneralError {
    return decoder.u128(true)
  }

  encode(): Uint8Array {
    return Encoder.u128(this.value, true)
  }
}
