import { AvailError } from "./error"
import { ExtrinsicSignature } from "./metadata"
import { ICall, IHeaderAndDecodable } from "./interface"
import { Decoder } from "./scale/decoder"

export const EXTRINSIC_FORMAT_VERSION: number = 4

export class EncodedExtrinsic {
  signature: ExtrinsicSignature | null = null
  call: Uint8Array

  constructor(signature: ExtrinsicSignature | null, call: Uint8Array) {
    this.signature = signature
    this.call = call
  }

  static decode(value: Decoder | string | Uint8Array): EncodedExtrinsic {
    const decoder = Decoder.from(value)

    const expectedLength = decoder.u32(true)
    const actualLength = decoder.remainingLen()

    if (expectedLength != actualLength)
      throw new AvailError("Malformed transaction. Expected length and Actual length mismatch")

    const firstByte = decoder.byte()

    const isSigned = (firstByte & 0b1000_0000) != 0
    const version = firstByte & 0b0111_1111
    if (version != EXTRINSIC_FORMAT_VERSION)
      throw new AvailError("Transaction has not the correct version. Decoding failed")

    let signature: ExtrinsicSignature | null = null
    if (isSigned) {
      const maybeSignature = ExtrinsicSignature.decode(decoder)

      signature = maybeSignature
    }

    const call = decoder.consumeRemainingBytes()
    return new EncodedExtrinsic(signature, call)
  }

  palletId(): number {
    return this.call[0]
  }

  variantId(): number {
    return this.call[1]
  }

  toCall<T>(as: IHeaderAndDecodable<T>): T | null {
    return ICall.decode(as, this.call)
  }

  toExtrinsic<T>(as: IHeaderAndDecodable<T>): Extrinsic<T> {
    return Extrinsic.decode(as, this.call)
  }

  toSigned<T>(as: IHeaderAndDecodable<T>): SignedExtrinsic<T> {
    return SignedExtrinsic.decode(as, this.call)
  }
}

export class Extrinsic<T> {
  signature: ExtrinsicSignature | null = null
  call: T

  constructor(signature: ExtrinsicSignature | null, call: T) {
    this.signature = signature
    this.call = call
  }

  static decode<T>(as: IHeaderAndDecodable<T>, value: Decoder | string | Uint8Array): Extrinsic<T> {
    const decoder = Decoder.from(value)

    const opaque = EncodedExtrinsic.decode(decoder)

    const call = ICall.decode(as, new Decoder(opaque.call), true)

    return new Extrinsic(opaque.signature, call)
  }
}

export class SignedExtrinsic<T> {
  signature: ExtrinsicSignature
  call: T

  constructor(signature: ExtrinsicSignature, call: T) {
    this.signature = signature
    this.call = call
  }

  static decode<T>(as: IHeaderAndDecodable<T>, value: Decoder | string | Uint8Array): SignedExtrinsic<T> {
    const decoder = Decoder.from(value)

    const opaque = EncodedExtrinsic.decode(decoder)

    if (opaque.signature == null) {
      throw new AvailError("Extrinsic was no signed")
    }

    const call = ICall.decode(as, new Decoder(opaque.call), true)

    return new SignedExtrinsic(opaque.signature, call)
  }
}
