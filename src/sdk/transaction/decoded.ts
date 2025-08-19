import ClientError from "../error"
import { Decodable, HasTxDispatchIndex, TransactionCallCodec } from "../interface"
import { TransactionSigned } from "../types/metadata"
import { Decoder, Encoder } from "../types/scale"
import { AlreadyEncoded } from "../types/scale/types"
import { Hex, mergeArrays } from "../utils"

export const EXTRINSIC_FORMAT_VERSION: number = 4

export class OpaqueTransaction {
  signature: TransactionSigned | null = null
  call: Uint8Array
  constructor(signature: TransactionSigned | null, call: Uint8Array) {
    this.signature = signature
    this.call = call
  }

  static decodeHex(encoded: string): OpaqueTransaction | ClientError {
    const decoded = Hex.decode(encoded)
    if (decoded instanceof ClientError) return decoded

    return OpaqueTransaction.decodeScale(decoded)
  }

  static decodeScale(encoded: Uint8Array): OpaqueTransaction | ClientError {
    const decoder = new Decoder(encoded, 0)
    return OpaqueTransaction.decode(decoder)
  }

  static decode(decoder: Decoder): OpaqueTransaction | ClientError {
    const expectedLength = decoder.u32(true)
    const actualLength = decoder.remainingLen()

    if (expectedLength != actualLength) {
      return new ClientError("Malformed transaction. Expected length and Actual length mismatch")
    }

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
    return new OpaqueTransaction(signature, call.value)
  }

  public palletIndex(): number {
    return this.call[0]
  }

  public callIndex(): number {
    return this.call[1]
  }

  public toCall<T>(T: Decodable<T> & HasTxDispatchIndex): T | null {
    return TransactionCallCodec.decodeScaleCall(T, this.call)
  }
}

export class DecodedTransaction<T> {
  signature: TransactionSigned | null = null
  call: T
  constructor(signature: TransactionSigned | null, call: T) {
    this.signature = signature
    this.call = call
  }

  static decodeHex<T>(T: Decodable<T> & HasTxDispatchIndex, value: string): DecodedTransaction<T> | ClientError {
    const decoded = Hex.decode(value)
    if (decoded instanceof ClientError) return decoded

    return DecodedTransaction.decodeScale(T, decoded)
  }

  static decodeScale<T>(T: Decodable<T> & HasTxDispatchIndex, value: Uint8Array): DecodedTransaction<T> | ClientError {
    const decoder = new Decoder(value, 0)
    return DecodedTransaction.decode(T, decoder)
  }

  static decode<T>(T: Decodable<T> & HasTxDispatchIndex, decoder: Decoder): DecodedTransaction<T> | ClientError {
    const opaque = OpaqueTransaction.decode(decoder)
    if (opaque instanceof ClientError) return opaque

    const call = TransactionCallCodec.decodeCall(T, new Decoder(opaque.call))
    if (call == null) return new ClientError("Failed to decode call")

    return new DecodedTransaction(opaque.signature, call)
  }
}

export class TransactionCall {
  palletId: number
  callId: number
  data: Uint8Array // Data is already SCALE encoded

  constructor(palletId: number, callId: number, data: Uint8Array) {
    this.palletId = palletId
    this.callId = callId
    this.data = data
  }

  static decodeHex(value: string): TransactionCall | ClientError {
    const hexDecoded = Hex.decode(value)
    if (hexDecoded instanceof ClientError) return hexDecoded
    return TransactionCall.decodeScale(hexDecoded)
  }

  static decodeScale(value: Uint8Array): TransactionCall | ClientError {
    const decoder = new Decoder(value, 0)
    return TransactionCall.decode(decoder)
  }

  static decode(decoder: Decoder): TransactionCall | ClientError {
    const palletId = decoder.u8()
    if (palletId instanceof ClientError) return palletId

    const callId = decoder.u8()
    if (callId instanceof ClientError) return callId

    const data = decoder.remainingBytes()
    return new TransactionCall(palletId, callId, data)
  }

  public encode(): Uint8Array {
    return mergeArrays([Encoder.u8(this.palletId), Encoder.u8(this.callId), this.data])
  }
}

export class TransactionCallDecoded<T> {
  palletId: number
  callId: number
  data: T

  constructor(palletId: number, callId: number, data: T) {
    this.palletId = palletId
    this.callId = callId
    this.data = data
  }
}
