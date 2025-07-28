import { BN, GeneralError } from "."
import { Decodable, Encodable } from "./decoded_encoded"
import Decoder from "./decoder"
import Encoder from "./encoder"

export class Nothing {
  constructor() {}

  static decode(_decoder: Decoder): Nothing | GeneralError {
    return new Nothing()
  }

  encode(): Uint8Array {
    return new Uint8Array()
  }
}

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

export class Option<S> {
  constructor(public value: (Encodable & Decodable<S>) | null) {}

  static decode<S extends Decodable<S>>(decoder: Decoder): S | null | GeneralError {
    return decoder.option({} as S)
  }

  encode(): Uint8Array {
    return Encoder.option(this.value)
  }
}

// export class Result<S extends Encodable, F extends Encodable> {
//   value: [S | null, F | null]
//   constructor(value: [S | null, F | null]) {
//     this.value = value
//   }

//     static createSuccess<S, F>(value: Encodable & Decodable<S>): Result<S, F> {
//       return new Result([value, null])
//     }

//     static createFailure<S, F>(value: Encodable & Decodable<F>): Result<S, F> {
//       return new Result([null, value])
//     }

//     static decode<S extends Decodable<S>, F extends Decodable<F>>(decoder: Decoder): [S | null, F | null] | GeneralError {
//       return decoder.result({} as S, {} as F)
//     }

//   encode(): Uint8Array {
//     if (this.value[0] != null) {
//       return Encoder.result(this.value[0], true)
//     }
//     if (this.value[1] != null) {
//       return Encoder.result(this.value[1], false)
//     }

//     throw new Error("No value was set for Result.")
//   }
// }
