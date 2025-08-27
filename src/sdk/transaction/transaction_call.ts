import ClientError from "../error"
import { ICall, IHeaderAndEncodable } from "../interface"
import { GenericExtrinsic } from "../types/polkadot"
import { Hex } from "../utils"
import { SubmittableTransaction } from "./submittable"

export type TransactionCallLike = GenericExtrinsic | Uint8Array | SubmittableTransaction | string | IHeaderAndEncodable
export function encodeTransactionCallLike(value: TransactionCallLike): Uint8Array {
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

  return value
}
