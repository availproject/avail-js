import { ClientError } from "../../error"
import { H256, HashNumber } from "../../types/metadata"
import { call } from "../utils"

export async function fetchExtrinsics(
  endpoint: string,
  blockId: H256 | string | number,
  options?: Options,
): Promise<ExtrinsicInfo[] | ClientError> {
  const filter: Filter = {
    transaction: options?.transactionFilter,
    signature: {
      app_id: options?.appId,
      nonce: options?.nonce,
      ss58_address: options?.ss58Address,
    },
  }
  const optionsParams: RpcOptions = { filter: filter, encode_selector: options?.encodeAs }

  let id: HashNumber
  if (typeof blockId === "string") {
    id = { Hash: blockId }
  } else if (blockId instanceof H256) {
    id = { Hash: blockId.toString() }
  } else {
    id = { Number: blockId }
  }

  const params = [id, optionsParams]
  const res = await call(endpoint, "system_fetchExtrinsicsV1", params)
  if (res instanceof ClientError) return res
  if (res == null) return new ClientError("Failed to fetch extrinsics")

  const rpcExtrinsics = res as ExtrinsicInformation[]
  const extrinsics: ExtrinsicInfo[] = []
  for (const rpcExt of rpcExtrinsics) {
    extrinsics.push({
      txHash: rpcExt.tx_hash,
      txIndex: rpcExt.tx_index,
      palletId: rpcExt.pallet_id,
      variantId: rpcExt.call_id,
      signature: rpcExt.signature,
      data: rpcExt.encoded,
    })
  }

  return extrinsics
}

export interface ExtrinsicInfo {
  txHash: string
  txIndex: number
  palletId: number
  variantId: number
  signature: TransactionSignature | null
  // Hex and SCALE encoded without "0x"
  data: string | null
}
export type EncodeSelector = "None" | "Call" | "Extrinsic"
export type TransactionFilterOptions =
  | "All"
  | { TxHash: string[] }
  | { TxIndex: number[] }
  | { Pallet: number[] }
  | { PalletCall: [number, number][] }
export interface TransactionSignature {
  ss58_address: string | null
  nonce: number
  app_id: number
  mortality: [bigint, bigint] | null
}
export interface Options {
  transactionFilter?: TransactionFilterOptions | null
  ss58Address?: string | null
  appId?: number | null
  nonce?: number | null
  encodeAs?: EncodeSelector | null
}

interface RpcOptions {
  filter?: Filter | null
  encode_selector?: EncodeSelector | null
}

interface Filter {
  transaction?: TransactionFilterOptions | null
  signature?: SignatureFilterOptions | null
}

interface SignatureFilterOptions {
  ss58_address?: string | null
  app_id?: number | null
  nonce?: number | null
}

interface ExtrinsicInformation {
  // Hex and SCALE encoded without "0x"
  encoded: string | null
  tx_hash: string
  tx_index: number
  pallet_id: number
  call_id: number
  signature: TransactionSignature | null
}
