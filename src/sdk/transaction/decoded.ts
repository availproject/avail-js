import { ClientError } from "../error"
import { ICall, IHeaderAndDecodable } from "../interface"
import { TransactionSigned } from "../types/metadata"
import { AlreadyEncoded, Decoder } from "../types/scale"
import { Hex } from "../utils"

export const EXTRINSIC_FORMAT_VERSION: number = 4

export class PartiallyDecodedTransaction {
  signature: TransactionSigned | null = null
  call: Uint8Array

  constructor(signature: TransactionSigned | null, call: Uint8Array) {
    this.signature = signature
    this.call = call
  }

  static decode(value: Decoder | string | Uint8Array): PartiallyDecodedTransaction | ClientError {
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

    let signature: TransactionSigned | null = null
    if (isSigned) {
      const maybeSignature = TransactionSigned.decode(decoder)
      if (maybeSignature instanceof ClientError) return maybeSignature

      signature = maybeSignature
    }

    const call = AlreadyEncoded.decode(decoder)
    return new PartiallyDecodedTransaction(signature, call.value)
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

  toDecodedTransaction<T>(as: IHeaderAndDecodable<T>): DecodedTransaction<T> | ClientError {
    return DecodedTransaction.decode(as, this.call)
  }
}

export class DecodedTransaction<T> {
  signature: TransactionSigned | null = null
  call: T

  constructor(signature: TransactionSigned | null, call: T) {
    this.signature = signature
    this.call = call
  }

  static decode<T>(
    as: IHeaderAndDecodable<T>,
    value: Decoder | string | Uint8Array,
  ): DecodedTransaction<T> | ClientError {
    const decoder = Decoder.from(value)
    if (decoder instanceof ClientError) return decoder

    const opaque = PartiallyDecodedTransaction.decode(decoder)
    if (opaque instanceof ClientError) return opaque

    const call = ICall.decode(as, new Decoder(opaque.call))
    if (call == null) return new ClientError("Failed to decode call")

    return new DecodedTransaction(opaque.signature, call)
  }
}
