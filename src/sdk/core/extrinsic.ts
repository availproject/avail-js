import { AvailError } from "./error"
import { ExtrinsicSignature } from "./types/metadata"
import { ICall, IHeaderAndDecodable } from "./interface/tx_and_events"
import { Decoder } from "./types/scale"

export const EXTRINSIC_FORMAT_VERSION: number = 4

export class RawExtrinsic {
  signature: ExtrinsicSignature | null = null
  call: Uint8Array

  constructor(signature: ExtrinsicSignature | null, call: Uint8Array) {
    this.signature = signature
    this.call = call
  }

  static decode(value: Decoder | string | Uint8Array): RawExtrinsic | AvailError {
    const decoder = Decoder.from(value)
    if (decoder instanceof AvailError) return decoder

    const expectedLength = decoder.u32(true)
    const actualLength = decoder.remainingLen()

    if (expectedLength != actualLength)
      return new AvailError("Malformed transaction. Expected length and Actual length mismatch")

    const firstByte = decoder.byte()
    if (firstByte instanceof AvailError) return firstByte

    const isSigned = (firstByte & 0b1000_0000) != 0
    const version = firstByte & 0b0111_1111
    if (version != EXTRINSIC_FORMAT_VERSION)
      return new AvailError("Transaction has not the correct version. Decoding failed")

    let signature: ExtrinsicSignature | null = null
    if (isSigned) {
      const maybeSignature = ExtrinsicSignature.decode(decoder)
      if (maybeSignature instanceof AvailError) return maybeSignature

      signature = maybeSignature
    }

    const call = decoder.consumeRemainingBytes()
    return new RawExtrinsic(signature, call)
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

  toExtrinsic<T>(as: IHeaderAndDecodable<T>): Extrinsic<T> | AvailError {
    return Extrinsic.decode(as, this.call)
  }
}

export class Extrinsic<T> {
  signature: ExtrinsicSignature | null = null
  call: T

  constructor(signature: ExtrinsicSignature | null, call: T) {
    this.signature = signature
    this.call = call
  }

  static decode<T>(as: IHeaderAndDecodable<T>, value: Decoder | string | Uint8Array): Extrinsic<T> | AvailError {
    const decoder = Decoder.from(value)
    if (decoder instanceof AvailError) return decoder

    const opaque = RawExtrinsic.decode(decoder)
    if (opaque instanceof AvailError) return opaque

    const call = ICall.decode(as, new Decoder(opaque.call), true)
    if (call instanceof AvailError) return call

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

  static decode<T>(as: IHeaderAndDecodable<T>, value: Decoder | string | Uint8Array): SignedExtrinsic<T> | AvailError {
    const decoder = Decoder.from(value)
    if (decoder instanceof AvailError) return decoder

    const opaque = RawExtrinsic.decode(decoder)
    if (opaque instanceof AvailError) return opaque

    if (opaque.signature == null) {
      return new AvailError("Extrinsic was no signed")
    }

    const call = ICall.decode(as, new Decoder(opaque.call), true)
    if (call instanceof AvailError) return call

    return new SignedExtrinsic(opaque.signature, call)
  }
}
