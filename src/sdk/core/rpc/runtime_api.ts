import { AvailError } from "./../zero_dep/error"
import { FeeDetails, H256, RuntimeDispatchInfo } from "./../metadata"
import { Decoder, Encoder } from "./../scale"
import { u8aToHex } from "@polkadot/util"
import { call as stateCall } from "./state"

export async function runtimeApiRawCall(
  endpoint: string,
  method: string,
  data: string | Uint8Array,
  at?: H256 | string,
): Promise<string | AvailError> {
  return stateCall(endpoint, method, data, at)
}

/// Parameter "tx" is hex encoded transaction.
export async function TransactionPaymentApi_queryInfo(
  endpoint: string,
  tx: string,
  at?: string,
): Promise<RuntimeDispatchInfo | AvailError> {
  try {
    const len = tx.startsWith("0x") ? (tx.length - 2) / 2 : tx.length / 2
    const encodedLen = u8aToHex(Encoder.u32(len))
    tx += encodedLen.slice(2)

    if (at != undefined) {
      const value = await runtimeApiRawCall(endpoint, "TransactionPaymentApi_query_info", tx, at)
      if (value instanceof AvailError) return value

      const decoder = Decoder.from(value)
      if (decoder instanceof AvailError) return decoder

      return RuntimeDispatchInfo.decode(decoder)
    } else {
      const value = await runtimeApiRawCall(endpoint, "TransactionPaymentApi_query_info", tx)
      if (value instanceof AvailError) return value

      const decoder = Decoder.from(value)
      if (decoder instanceof AvailError) return decoder

      return RuntimeDispatchInfo.decode(decoder)
    }
  } catch (e: any) {
    return new AvailError(e instanceof Error ? e.message : String(e))
  }
}

/// Parameter "tx" is hex encoded transaction.
export async function TransactionPaymentApi_queryFeeDetails(
  endpoint: string,
  tx: string,
  at?: string,
): Promise<FeeDetails | AvailError> {
  try {
    const len = tx.startsWith("0x") ? (tx.length - 2) / 2 : tx.length / 2
    const encodedLen = u8aToHex(Encoder.u32(len))
    tx += encodedLen.slice(2)

    if (at != undefined) {
      const value = await runtimeApiRawCall(endpoint, "TransactionPaymentApi_query_fee_details", tx, at)
      if (value instanceof AvailError) return value

      const decoder = Decoder.from(value)
      if (decoder instanceof AvailError) return decoder

      return FeeDetails.decode(decoder)
    } else {
      const value = await runtimeApiRawCall(endpoint, "TransactionPaymentApi_query_fee_details", tx)
      if (value instanceof AvailError) return value

      const decoder = Decoder.from(value)
      if (decoder instanceof AvailError) return decoder

      return FeeDetails.decode(decoder)
    }
  } catch (e: any) {
    return new AvailError(e instanceof Error ? e.message : String(e))
  }
}

export async function TransactionPaymentCallApi_queryCallInfo(
  endpoint: string,
  call: string,
  at?: string,
): Promise<RuntimeDispatchInfo | AvailError> {
  try {
    const len = call.startsWith("0x") ? (call.length - 2) / 2 : call.length / 2
    const encodedLen = u8aToHex(Encoder.u32(len))
    call += encodedLen.slice(2)

    if (at != undefined) {
      const value = await runtimeApiRawCall(endpoint, "TransactionPaymentCallApi_query_call_info", call, at)
      if (value instanceof AvailError) return value

      const decoder = Decoder.from(value)
      if (decoder instanceof AvailError) return decoder

      return RuntimeDispatchInfo.decode(decoder)
    } else {
      const value = await runtimeApiRawCall(endpoint, "TransactionPaymentCallApi_query_call_info", call)
      if (value instanceof AvailError) return value

      const decoder = Decoder.from(value)
      if (decoder instanceof AvailError) return decoder

      return RuntimeDispatchInfo.decode(decoder)
    }
  } catch (e: any) {
    return new AvailError(e instanceof Error ? e.message : String(e))
  }
}

export async function TransactionPaymentCallApi_queryCallFeeDetails(
  endpoint: string,
  call: string,
  at?: string,
): Promise<FeeDetails | AvailError> {
  try {
    const len = call.startsWith("0x") ? (call.length - 2) / 2 : call.length / 2
    const encodedLen = u8aToHex(Encoder.u32(len))
    call += encodedLen.slice(2)

    if (at != undefined) {
      const value = await runtimeApiRawCall(endpoint, "TransactionPaymentCallApi_query_call_fee_details", call, at)
      if (value instanceof AvailError) return value

      const decoder = Decoder.from(value)
      if (decoder instanceof AvailError) return decoder

      return FeeDetails.decode(decoder)
    } else {
      const value = await runtimeApiRawCall(endpoint, "TransactionPaymentCallApi_query_call_fee_details", call)
      if (value instanceof AvailError) return value

      const decoder = Decoder.from(value)
      if (decoder instanceof AvailError) return decoder

      return FeeDetails.decode(decoder)
    }
  } catch (e: any) {
    return new AvailError(e instanceof Error ? e.message : String(e))
  }
}
