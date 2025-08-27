import ClientError from "../error"
import { IEncodableTransactionCall } from "../interface"
import { GenericExtrinsic, u8aConcat } from "../types/polkadot"
import { Decoder, Encoder } from "../types/scale"
import { Hex } from "../utils"
import { SubmittableTransaction } from "./submittable"

export class GenericTransactionCall {
  PALLET_ID: number
  VARIANT_ID: number
  data: Uint8Array // Data is already SCALE encoded

  constructor(palletId: number, variantId: number, data: Uint8Array) {
    this.PALLET_ID = palletId
    this.VARIANT_ID = variantId
    this.data = data
  }

  static decode(value: Decoder | string | Uint8Array): GenericTransactionCall | ClientError {
    const decoder = Decoder.from(value)
    if (decoder instanceof ClientError) return decoder

    const palletId = decoder.u8()
    if (palletId instanceof ClientError) return palletId

    const variantId = decoder.u8()
    if (variantId instanceof ClientError) return variantId

    const data = decoder.remainingBytes()
    return new GenericTransactionCall(palletId, variantId, data)
  }

  static encode(value: GenericTransactionCall): Uint8Array {
    return value.encode()
  }

  encode(): Uint8Array {
    return u8aConcat(Encoder.u8(this.PALLET_ID), Encoder.u8(this.VARIANT_ID), this.data)
  }

  static from(value: IEncodableTransactionCall | GenericExtrinsic | Uint8Array): GenericTransactionCall {
    if ("PALLET_ID" in value) {
      return new GenericTransactionCall(value.PALLET_ID, value.VARIANT_ID, value.encode())
    }

    let decoder
    if ("method" in value) {
      decoder = new Decoder(value.method.toU8a())
    } else {
      decoder = new Decoder(value)
    }

    const palletId = decoder.u8()
    if (palletId instanceof ClientError) throw palletId
    const variantId = decoder.u8()
    if (variantId instanceof ClientError) throw variantId
    const data = decoder.remainingBytes()
    if (data instanceof ClientError) throw data

    return new GenericTransactionCall(palletId, variantId, data)
  }
}

export type TransactionCallLike =
  | GenericExtrinsic
  | Uint8Array
  | SubmittableTransaction
  | GenericTransactionCall
  | string

/// TODO
export class EncodedTransactionCall {
  constructor(public value: Uint8Array) {}

  static from(
    value: GenericExtrinsic | Uint8Array | SubmittableTransaction | GenericTransactionCall | string,
  ): EncodedTransactionCall {
    if (typeof value === "string") {
      const array = Hex.decode(value)
      if (array instanceof ClientError) throw array
      value = array
    } else if (value instanceof GenericExtrinsic) {
      value = value.method.toU8a()
    } else if (value instanceof SubmittableTransaction) {
      value = value.call.method.toU8a()
    } else if (value instanceof GenericTransactionCall) {
      value = value.encode()
    }

    return new EncodedTransactionCall(value)
  }

  static decode(value: Decoder | string | Uint8Array): EncodedTransactionCall | ClientError {
    const decoder = Decoder.from(value)
    if (decoder instanceof ClientError) return decoder

    const data = decoder.remainingBytes()
    return new EncodedTransactionCall(data)
  }

  static encode(value: GenericTransactionCall): Uint8Array {
    return value.encode()
  }

  encode(): Uint8Array {
    return this.value
  }
}
