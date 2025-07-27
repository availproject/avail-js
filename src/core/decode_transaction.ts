import { AlreadyEncoded, GeneralError, hexToU8a, TransactionSigned } from "."
import Decoder from "./decoder"

export const EXTRINSIC_FORMAT_VERSION: number = 4

export interface Decodable<T> {
  decode(decoder: Decoder): T | GeneralError
}
export interface Encodable {
  encode(): Uint8Array
}
export interface HasTxDispatchIndex {
  dispatchIndex(): [number, number]
}

export function decodeHexCall<T>(T: Decodable<T> & HasTxDispatchIndex, value: string): T | null {
  return decodeScaleCall(T, hexToU8a(value))
}

export function decodeScaleCall<T>(T: Decodable<T> & HasTxDispatchIndex, value: Uint8Array): T | null {
  return decodeCall(T, new Decoder(value))
}

export function decodeCall<T>(T: Decodable<T> & HasTxDispatchIndex, decoder: Decoder): T | null {
  if (decoder.remainingLen() < 2) {
    return null
  }
  const dispatchIndex = T.dispatchIndex()
  const readPalletIndex = decoder.byte()
  if (readPalletIndex instanceof GeneralError) {
    return null
  }

  const readCallIndex = decoder.byte()
  if (readCallIndex instanceof GeneralError) {
    return null
  }

  if (dispatchIndex[0] != readPalletIndex || dispatchIndex[1] != readCallIndex) {
    return null
  }

  const decoded = T.decode(decoder)
  if (decoded instanceof GeneralError) {
    return null
  }

  return decoded
}

export function decodeHexCallData<T>(T: Decodable<T>, value: string): T | null {
  return decodeScaleCallData(T, hexToU8a(value))
}

export function decodeScaleCallData<T>(T: Decodable<T>, value: Uint8Array): T | null {
  return decodeCallData(T, new Decoder(value))
}

export function decodeCallData<T>(T: Decodable<T>, decoder: Decoder): T | null {
  const decoded = T.decode(decoder)
  if (decoded instanceof GeneralError) {
    return null
  }

  return decoded
}

export class OpaqueTransaction {
  public signature: TransactionSigned | null = null
  public call: Uint8Array
  public constructor(signature: TransactionSigned | null, call: Uint8Array) {
    this.signature = signature
    this.call = call
  }

  public static decodeHex(encoded: string): OpaqueTransaction | GeneralError {
    const hexDecoded = hexToU8a(encoded)
    return OpaqueTransaction.decodeScale(hexDecoded)
  }

  public static decodeScale(encoded: Uint8Array): OpaqueTransaction | GeneralError {
    const decoder = new Decoder(encoded, 0)
    return OpaqueTransaction.decode(decoder)
  }

  public static decode(decoder: Decoder): OpaqueTransaction | GeneralError {
    const expectedLength = decoder.u32(true)
    const actualLength = decoder.remainingLen()

    if (expectedLength != actualLength) {
      return new GeneralError("Malformed transaction. Expected length and Actual length mismatch")
    }

    const firstByte = decoder.byte()
    if (firstByte instanceof GeneralError) {
      return firstByte
    }

    const isSigned = (firstByte & 0b1000_0000) != 0
    const version = firstByte & 0b0111_1111
    if (version != EXTRINSIC_FORMAT_VERSION) {
      return new GeneralError("Transaction has not the correct version. Decoding failed")
    }

    let signature: TransactionSigned | null = null
    if (isSigned) {
      const maybeSignature = TransactionSigned.decode(decoder)
      if (maybeSignature instanceof GeneralError) {
        return maybeSignature
      }
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
    return decodeScaleCall(T, this.call)
  }
}

export class DecodedTransaction<T> {
  public signature: TransactionSigned | null = null
  public call: T
  public constructor(signature: TransactionSigned | null, call: T) {
    this.signature = signature
    this.call = call
  }

  public static decodeHex<T>(
    T: Decodable<T> & HasTxDispatchIndex,
    value: string,
  ): DecodedTransaction<T> | GeneralError {
    const hexDecoded = hexToU8a(value)
    return DecodedTransaction.decodeScale(T, hexDecoded)
  }

  public static decodeScale<T>(
    T: Decodable<T> & HasTxDispatchIndex,
    value: Uint8Array,
  ): DecodedTransaction<T> | GeneralError {
    const decoder = new Decoder(value, 0)
    return DecodedTransaction.decode(T, decoder)
  }

  public static decode<T>(
    T: Decodable<T> & HasTxDispatchIndex,
    decoder: Decoder,
  ): DecodedTransaction<T> | GeneralError {
    let opaque = OpaqueTransaction.decode(decoder)
    if (opaque instanceof GeneralError) {
      return opaque
    }

    let call = decodeCall(T, new Decoder(opaque.call))
    if (call == null) {
      return new GeneralError("Failed to decode call")
    }

    return new DecodedTransaction(opaque.signature, call)
  }
}

export class TransactionCall {
  public palletId: number
  public callId: number
  public data: Uint8Array // Data is already SCALE encoded

  public constructor(palletId: number, callId: number, data: Uint8Array) {
    this.palletId = palletId
    this.callId = callId
    this.data = data
  }

  /*   public static decodeHex(value: string): TransactionCall | null {
      const hexDecoded = hexToU8a(value)
      return TransactionCall.decodeScale(hexDecoded)
    }
  
    public static decodeScale(value: Uint8Array): TransactionCall | null {
      const decoder = new Decoder(value, 0)
      return TransactionCall.decode(decoder)
    }
  
    public static decode(decoder: Decoder): TransactionCall | null {
      const palletId = decoder.u8()
      const callId = decoder.u8()
      const data = decoder.arrayU8()
      return new TransactionCall(palletId, callId, data)
    }
  
    public encode(): Uint8Array {
      return mergeArrays([Encoder.u8(this.palletId), Encoder.u8(this.callId), this.data])
    } */
}

export class TransactionCallDecoded<T> {
  public palletId: number
  public callId: number
  public data: T

  public constructor(palletId: number, callId: number, data: T) {
    this.palletId = palletId
    this.callId = callId
    this.data = data
  }
}
