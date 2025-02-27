import { FeeDetails, RuntimeDispatchInfo } from "./metadata";
import { Client } from "./client";
import { Decoder } from "./decoder";
import { hexToU8a, u8aToHex } from "@polkadot/util"

/// Parameter "tx" is hex encoded transaction.
export async function TransactionPaymentApi_queryInfo(client: Client, tx: string): Promise<RuntimeDispatchInfo> {
  const len = hexToU8a(tx).length
  const encodedLen = u8aToHex(encodeU32(len))
  tx += encodedLen.slice(2)

  const value = await client.api.rpc.state.call("TransactionPaymentApi_query_info", tx)
  const decoder = new Decoder(value, 0)
  return new RuntimeDispatchInfo(decoder)
}

/// Parameter "tx" is hex encoded transaction.
export async function TransactionPaymentApi_queryFeeDetails(client: Client, tx: string): Promise<FeeDetails> {
  const len = hexToU8a(tx).length
  const encodedLen = u8aToHex(encodeU32(len))
  tx += encodedLen.slice(2)

  const value = await client.api.rpc.state.call("TransactionPaymentApi_query_fee_details", tx)
  const decoder = new Decoder(value, 0)
  return new FeeDetails(decoder)
}

export async function TransactionPaymentCallApi_queryCallInfo(client: Client, call: string): Promise<RuntimeDispatchInfo> {
  const len = hexToU8a(call).length
  const encodedLen = u8aToHex(encodeU32(len))
  call += encodedLen.slice(2)

  const value = await client.api.rpc.state.call("TransactionPaymentCallApi_query_call_info", call)
  const decoder = new Decoder(value, 0)
  return new RuntimeDispatchInfo(decoder)
}

export async function TransactionPaymentCallApi_queryCallFeeDetails(client: Client, call: string): Promise<FeeDetails> {
  const len = hexToU8a(call).length
  const encodedLen = u8aToHex(encodeU32(len))
  call += encodedLen.slice(2)

  const value = await client.api.rpc.state.call("TransactionPaymentCallApi_query_call_fee_details", call)
  const decoder = new Decoder(value, 0)
  return new FeeDetails(decoder)
}

function encodeU32(value: number): Uint8Array {
  if (value < 0 || value > 0xFFFFFFFF) {
    throw new Error("Value out of range for u32");
  }

  // Convert number to 4-byte little-endian Uint8Array
  const buffer = new Uint8Array(4);
  buffer[0] = value & 0xFF;         // Least significant byte
  buffer[1] = (value >> 8) & 0xFF;
  buffer[2] = (value >> 16) & 0xFF;
  buffer[3] = (value >> 24) & 0xFF; // Most significant byte

  return buffer;
}