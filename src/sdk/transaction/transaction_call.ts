import ClientError from "../error"
import { u8aConcat } from "../types/polkadot"
import { Decoder, Encoder } from "../types/scale"

export class GenericTransactionCall {
  PALLET_ID: number
  VARIANT_ID: number
  data: Uint8Array // Data is already SCALE encoded

  constructor(palletId: number, callId: number, data: Uint8Array) {
    this.PALLET_ID = palletId
    this.VARIANT_ID = callId
    this.data = data
  }

  static decode(value: Decoder | string | Uint8Array): GenericTransactionCall | ClientError {
    const decoder = Decoder.from(value)
    if (decoder instanceof ClientError) return decoder

    const palletId = decoder.u8()
    if (palletId instanceof ClientError) return palletId

    const callId = decoder.u8()
    if (callId instanceof ClientError) return callId

    const data = decoder.remainingBytes()
    return new GenericTransactionCall(palletId, callId, data)
  }

  static encode(value: GenericTransactionCall): Uint8Array {
    return value.encode()
  }

  encode(): Uint8Array {
    return u8aConcat(Encoder.u8(this.PALLET_ID), Encoder.u8(this.VARIANT_ID), this.data)
  }
}
