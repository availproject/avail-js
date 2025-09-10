import { ClientError } from "../../error"
import { H256 } from "../../types/metadata"
import { toHashNumber } from "../../utils"
import { call } from "../utils"

export async function fetchExtrinsics(
  endpoint: string,
  blockId: H256 | string | number,
  options?: Options,
): Promise<ExtrinsicInfo[] | ClientError> {
  const filter: Filter = {
    transaction: options?.filter,
    signature: {
      app_id: options?.appId,
      nonce: options?.nonce,
      ss58_address: options?.ss58Address,
    },
  }
  const optionsParams: RpcOptions = { filter: filter, encode_selector: options?.encodeAs }

  const params = [toHashNumber(blockId), optionsParams]
  const res = await call(endpoint, "system_fetchExtrinsicsV1", params)
  if (res instanceof ClientError) return res
  if (res == null) return new ClientError("Failed to fetch extrinsics")

  const rpcExtrinsics = res as ExtrinsicInformation[]
  const extrinsics: ExtrinsicInfo[] = []
  for (const rpcExt of rpcExtrinsics) {
    const txHash = H256.from(rpcExt.tx_hash)
    if (txHash instanceof ClientError) return txHash

    extrinsics.push({
      txHash,
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
  txHash: H256
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
  filter?: TransactionFilterOptions
  ss58Address?: string
  appId?: number
  nonce?: number
  encodeAs?: EncodeSelector
}

interface RpcOptions {
  filter?: Filter
  encode_selector?: EncodeSelector
}

interface Filter {
  transaction?: TransactionFilterOptions
  signature?: SignatureFilterOptions
}

interface SignatureFilterOptions {
  ss58_address?: string
  app_id?: number
  nonce?: number
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
