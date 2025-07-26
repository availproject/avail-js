import { AlreadyEncoded, hexToU8a, TransactionSigned } from "."
import Decoder from "./decoder"

export const EXTRINSIC_FORMAT_VERSION: number = 4

export interface Decodable<T> {
  decode(decoder: Decoder): T | null
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
  const readPalletIndex = decoder.readByte()
  const readCallIndex = decoder.readByte()
  if (dispatchIndex[0] != readPalletIndex || dispatchIndex[1] != readCallIndex) {
    return null
  }

  return T.decode(decoder)
}

export function decodeHexCallData<T>(T: Decodable<T>, value: string): T | null {
  return decodeScaleCallData(T, hexToU8a(value))
}

export function decodeScaleCallData<T>(T: Decodable<T>, value: Uint8Array): T | null {
  return decodeCallData(T, new Decoder(value))
}

export function decodeCallData<T>(T: Decodable<T>, decoder: Decoder): T | null {
  return T.decode(decoder)
}

export class OpaqueTransaction {
  public signature: TransactionSigned | null = null
  public call: Uint8Array
  public constructor(signature: TransactionSigned | null, call: Uint8Array) {
    this.signature = signature
    this.call = call
  }

  public static decodeHex(encoded: string): OpaqueTransaction | null {
    const hexDecoded = hexToU8a(encoded)
    return OpaqueTransaction.decode(hexDecoded)
  }

  public static decode(encoded: Uint8Array): OpaqueTransaction | null {
    const decoder = new Decoder(encoded, 0)
    const expectedLength = decoder.u32(true)
    const actualLength = decoder.remainingLen()

    if (expectedLength != actualLength) {
      throw Error("Malformed transaction")
    }

    const firstByte = decoder.readByte()

    const isSigned = (firstByte & 0b1000_0000) != 0
    const version = firstByte & 0b0111_1111
    if (version != EXTRINSIC_FORMAT_VERSION) {
      return null
    }

    let signature = null
    if (isSigned) {
      signature = TransactionSigned.decode(decoder)
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
}

export class DecodedTransaction<T> {
  public signature: TransactionSigned | null = null
  public call: T
  public constructor(signature: TransactionSigned | null, call: T) {
    this.signature = signature
    this.call = call
  }

  public static decodeHex<T>(T: Decodable<T> & HasTxDispatchIndex, value: string): DecodedTransaction<T> | null {
    const hexDecoded = hexToU8a(value)
    return DecodedTransaction.decode(T, hexDecoded)
  }

  public static decode<T>(T: Decodable<T> & HasTxDispatchIndex, value: Uint8Array): DecodedTransaction<T> | null {
    let opaque = OpaqueTransaction.decode(value)
    if (opaque == null) {
      return null
    }

    let call = decodeCall(T, new Decoder(opaque.call))
    if (call == null) {
      return null
    }

    return new DecodedTransaction(opaque.signature, call)
  }
}
