import ClientError from "../error"
import { ICall, IHeaderAndEncodable } from "../interface"
import { GenericExtrinsic } from "../types/polkadot"
import { Decoder } from "../types/scale"
import { Hex } from "../utils"
import { SubmittableTransaction } from "./submittable"

export type TransactionCallLike = GenericExtrinsic | Uint8Array | SubmittableTransaction | string | IHeaderAndEncodable

/// TODO
export class EncodedTransactionCall {
  constructor(public value: Uint8Array) {}

  static from(value: TransactionCallLike): EncodedTransactionCall {
    if (typeof value === "string") {
      const array = Hex.decode(value)
      if (array instanceof ClientError) throw array
      value = array
    } else if (value instanceof GenericExtrinsic) {
      value = value.method.toU8a()
    } else if (value instanceof SubmittableTransaction) {
      value = value.call.method.toU8a()
    } else if ("palletId" in value) {
      value = ICall.encode(value)
    }

    return new EncodedTransactionCall(value)
  }

  static decode(value: Decoder | string | Uint8Array): EncodedTransactionCall | ClientError {
    const decoder = Decoder.from(value)
    if (decoder instanceof ClientError) return decoder

    const data = decoder.remainingBytes()
    return new EncodedTransactionCall(data)
  }

  static encode(value: EncodedTransactionCall): Uint8Array {
    return value.encode()
  }

  encode(): Uint8Array {
    return this.value
  }
}
