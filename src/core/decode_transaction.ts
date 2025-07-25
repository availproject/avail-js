import { AlreadyEncoded, hexToU8a, TransactionSigned } from "."
import { Decoder } from "./decoder"

export const EXTRINSIC_FORMAT_VERSION: number = 4

export interface Decodable<T> {
  decode(value: Uint8Array): T | null
}
export interface Encodable {
  encode(): Uint8Array
}
export interface HasTxDispatchIndex {
  dispatchIndex(): [number, number]
}

export function decodeHexCall<T>(T: Decodable<T> & HasTxDispatchIndex, value: string): T | null {
  let hex_decoded = hexToU8a(value)
  return decodeCall(T, hex_decoded)
}

export function decodeCall<T>(T: Decodable<T> & HasTxDispatchIndex, value: Uint8Array): T | null {
  if (value.length < 2) {
    return null
  }
  const dispatchIndex = T.dispatchIndex()
  if (dispatchIndex[0] != value[0] || dispatchIndex[1] != value[1]) {
    return null
  }

  return T.decode(value.subarray(2))
}

export function decodeCallData<T>(T: Decodable<T>, value: Uint8Array): T | null {
  return T.decode(value)
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
    const expectedLength = decoder.decodeU32(true)
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

    let call = decodeCall(T, opaque.call)
    if (call == null) {
      return null
    }

    return new DecodedTransaction(opaque.signature, call)
  }
}
