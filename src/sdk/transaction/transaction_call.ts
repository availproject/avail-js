import ClientError from "../error"
import { IEncodableTransactionCall } from "../interface"
import { u8aConcat } from "../types/polkadot"
import { Decoder, Encoder } from "../types/scale"

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

  static from(value: IEncodableTransactionCall): GenericTransactionCall {
    return new GenericTransactionCall(value.PALLET_ID, value.VARIANT_ID, value.encode())
  }
}
