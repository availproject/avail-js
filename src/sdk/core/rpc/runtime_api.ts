import { AvailError } from "../error"
import { FeeDetails, RuntimeDispatchInfo } from "../types/metadata"
import { Decoder, Encoder } from "../types/scale"
import { ApiPromise } from "../types/polkadot"
import { Hex } from "../utils"

/// Parameter "tx" is hex encoded transaction.
export async function TransactionPaymentApi_queryInfo(
  api: ApiPromise,
  tx: string,
  at?: string,
): Promise<RuntimeDispatchInfo | AvailError> {
  try {
    const len = tx.startsWith("0x") ? (tx.length - 2) / 2 : tx.length / 2
    const encodedLen = Hex.encode(Encoder.u32(len))
    tx += encodedLen.slice(2)

    if (at != undefined) {
      const value = await api.rpc.state.call("TransactionPaymentApi_query_info", tx, at)
      return RuntimeDispatchInfo.decode(new Decoder(value))
    } else {
      const value = await api.rpc.state.call("TransactionPaymentApi_query_info", tx)
      return RuntimeDispatchInfo.decode(new Decoder(value))
    }
  } catch (e: any) {
    return new AvailError(e.toString())
  }
}

/// Parameter "tx" is hex encoded transaction.
export async function TransactionPaymentApi_queryFeeDetails(
  api: ApiPromise,
  tx: string,
  at?: string,
): Promise<FeeDetails | AvailError> {
  try {
    const len = tx.startsWith("0x") ? (tx.length - 2) / 2 : tx.length / 2
    const encodedLen = Hex.encode(Encoder.u32(len))
    tx += encodedLen.slice(2)

    if (at != undefined) {
      const value = await api.rpc.state.call("TransactionPaymentApi_query_fee_details", tx, at)
      return FeeDetails.decode(new Decoder(value))
    } else {
      const value = await api.rpc.state.call("TransactionPaymentApi_query_fee_details", tx)
      return FeeDetails.decode(new Decoder(value))
    }
  } catch (e: any) {
    return new AvailError(e.toString())
  }
}

export async function TransactionPaymentCallApi_queryCallInfo(
  api: ApiPromise,
  call: string,
  at?: string,
): Promise<RuntimeDispatchInfo | AvailError> {
  try {
    const len = call.startsWith("0x") ? (call.length - 2) / 2 : call.length / 2
    const encodedLen = Hex.encode(Encoder.u32(len))
    call += encodedLen.slice(2)

    if (at != undefined) {
      const value = await api.rpc.state.call("TransactionPaymentCallApi_query_call_info", call, at)
      return RuntimeDispatchInfo.decode(new Decoder(value))
    } else {
      const value = await api.rpc.state.call("TransactionPaymentCallApi_query_call_info", call)
      return RuntimeDispatchInfo.decode(new Decoder(value))
    }
  } catch (e: any) {
    return new AvailError(e.toString())
  }
}

export async function TransactionPaymentCallApi_queryCallFeeDetails(
  api: ApiPromise,
  call: string,
  at?: string,
): Promise<FeeDetails | AvailError> {
  try {
    const len = call.startsWith("0x") ? (call.length - 2) / 2 : call.length / 2
    const encodedLen = Hex.encode(Encoder.u32(len))
    call += encodedLen.slice(2)

    if (at != undefined) {
      const value = await api.rpc.state.call("TransactionPaymentCallApi_query_call_fee_details", call, at)
      return FeeDetails.decode(new Decoder(value))
    } else {
      const value = await api.rpc.state.call("TransactionPaymentCallApi_query_call_fee_details", call)
      return FeeDetails.decode(new Decoder(value))
    }
  } catch (e: any) {
    return new AvailError(e.toString())
  }
}
