import ClientError from "../../error"
import { HashNumber } from "../../types/metadata"
import { RpcError, call } from "../utils"

export async function fetchExtrinsics(
  endpoint: string,
  blockId: HashNumber,
  options?: Options,
): Promise<ExtrinsicInformation[] | ClientError> {
  const filter: Filter = {
    transaction: options?.transactionFilter,
    signature: {
      app_id: options?.appId,
      nonce: options?.nonce,
      ss58_address: options?.ss58Address,
    },
  }
  const optionsParams = { filter: filter, encode_selector: options?.encodeAs }

  const params = [blockId, optionsParams]
  const res = await call(endpoint, "system_fetchExtrinsicsV1", params)
  if (res instanceof ClientError) return res
  if (res == null) return new ClientError("Failed to fetch extrinsics")

  return res
}

export interface Options {
  transactionFilter?: TransactionFilterOptions | null
  ss58Address?: string | null
  appId?: number | null
  nonce?: number | null
  encodeAs?: EncodeSelector | null
}

export interface RpcOptions {
  filter?: Filter | null
  encode_selector?: EncodeSelector | null
}
export interface Filter {
  transaction?: TransactionFilterOptions | null
  signature?: SignatureFilterOptions | null
}

export type EncodeSelector = "None" | "Call" | "Extrinsic"
export interface SignatureFilterOptions {
  ss58_address?: string | null
  app_id?: number | null
  nonce?: number | null
}
export type TransactionFilterOptions =
  | "All"
  | { TxHash: string[] }
  | { TxIndex: number[] }
  | { Pallet: number[] }
  | { PalletCall: [number, number][] }

// Response
export interface RpcResponse {
  result: ExtrinsicInformation[] | null
  error: RpcError | null
}

export interface ExtrinsicInformation {
  // Hex and SCALE encoded without "0x"
  encoded: string | null
  tx_hash: string
  tx_index: number
  pallet_id: number
  call_id: number
  signature: TransactionSignature | null
}

export interface TransactionSignature {
  ss58_address: string | null
  nonce: number
  app_id: number
  mortality: [bigint, bigint] | null
}
