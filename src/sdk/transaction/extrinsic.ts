import { ClientError } from "../error"
import { ICall, IHeaderAndDecodable } from "../interface"
import { ExtrinsicSigned } from "../types/metadata"
import { AlreadyEncoded, Decoder } from "../types/scale"

export const EXTRINSIC_FORMAT_VERSION: number = 4

export class RawExtrinsic {
  signature: ExtrinsicSigned | null = null
  call: Uint8Array

  constructor(signature: ExtrinsicSigned | null, call: Uint8Array) {
    this.signature = signature
    this.call = call
  }

  static decode(value: Decoder | string | Uint8Array): RawExtrinsic | ClientError {
    const decoder = Decoder.from(value)
    if (decoder instanceof ClientError) return decoder

    const expectedLength = decoder.u32(true)
    const actualLength = decoder.remainingLen()

    if (expectedLength != actualLength)
      return new ClientError("Malformed transaction. Expected length and Actual length mismatch")

    const firstByte = decoder.byte()
    if (firstByte instanceof ClientError) return firstByte

    const isSigned = (firstByte & 0b1000_0000) != 0
    const version = firstByte & 0b0111_1111
    if (version != EXTRINSIC_FORMAT_VERSION)
      return new ClientError("Transaction has not the correct version. Decoding failed")

    let signature: ExtrinsicSigned | null = null
    if (isSigned) {
      const maybeSignature = ExtrinsicSigned.decode(decoder)
      if (maybeSignature instanceof ClientError) return maybeSignature

      signature = maybeSignature
    }

    const call = AlreadyEncoded.decode(decoder)
    return new RawExtrinsic(signature, call.value)
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

  toExtrinsic<T>(as: IHeaderAndDecodable<T>): Extrinsic<T> | ClientError {
    return Extrinsic.decode(as, this.call)
  }
}

export class Extrinsic<T> {
  signature: ExtrinsicSigned | null = null
  call: T

  constructor(signature: ExtrinsicSigned | null, call: T) {
    this.signature = signature
    this.call = call
  }

  static decode<T>(as: IHeaderAndDecodable<T>, value: Decoder | string | Uint8Array): Extrinsic<T> | ClientError {
    const decoder = Decoder.from(value)
    if (decoder instanceof ClientError) return decoder

    const opaque = RawExtrinsic.decode(decoder)
    if (opaque instanceof ClientError) return opaque

    const call = ICall.decode(as, new Decoder(opaque.call), true)
    if (call instanceof ClientError) return call

    return new Extrinsic(opaque.signature, call)
  }
}

export class SignedExtrinsic<T> {
  signature: ExtrinsicSigned
  call: T

  constructor(signature: ExtrinsicSigned, call: T) {
    this.signature = signature
    this.call = call
  }

  static decode<T>(as: IHeaderAndDecodable<T>, value: Decoder | string | Uint8Array): SignedExtrinsic<T> | ClientError {
    const decoder = Decoder.from(value)
    if (decoder instanceof ClientError) return decoder

    const opaque = RawExtrinsic.decode(decoder)
    if (opaque instanceof ClientError) return opaque

    if (opaque.signature == null) {
      return new ClientError("Extrinsic was no signed")
    }

    const call = ICall.decode(as, new Decoder(opaque.call), true)
    if (call instanceof ClientError) return call

    return new SignedExtrinsic(opaque.signature, call)
  }
}
