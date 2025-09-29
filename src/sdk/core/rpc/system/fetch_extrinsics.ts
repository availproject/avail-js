import { AvailError } from "../../error"
import { H256 } from "../../types/metadata"
import { toHashNumber } from "../../utils"
import { call } from "../utils"

export async function fetchExtrinsics(
  endpoint: string,
  blockId: H256 | string | number,
  options?: Options,
): Promise<ExtrinsicInfo[] | AvailError> {
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
  if (res instanceof AvailError) return res
  if (res == null) return new AvailError("Failed to fetch extrinsics")

  const rpcExtrinsics = res as ExtrinsicInformation[]
  const extrinsics: ExtrinsicInfo[] = []
  for (const rpcExt of rpcExtrinsics) {
    const txHash = H256.from(rpcExt.tx_hash)
    if (txHash instanceof AvailError) return txHash
    let signerPayload = null
    if (rpcExt.signature != null) {
      const sig = rpcExt.signature
      signerPayload = {
        appId: sig.app_id,
        mortality: sig.mortality,
        nonce: sig.nonce,
        ss58Address: sig.ss58_address,
      } satisfies SignerPayload
    }

    extrinsics.push({
      extHash: txHash,
      extIndex: rpcExt.tx_index,
      palletId: rpcExt.pallet_id,
      variantId: rpcExt.call_id,
      signerPayload: signerPayload,
      data: rpcExt.encoded,
    })
  }

  return extrinsics
}

export interface ExtrinsicInfo {
  extHash: H256
  extIndex: number
  palletId: number
  variantId: number
  signerPayload: SignerPayload | null
  // Hex and SCALE encoded without "0x"
  data: string | null
}

export interface SignerPayload {
  ss58Address: string | null
  nonce: number
  appId: number
  mortality: [bigint, bigint] | null
}

export type EncodeSelector = "None" | "Call" | "Extrinsic"
export type ExtrinsicFilterOptions =
  | "All"
  | { TxHash: string[] }
  | { TxIndex: number[] }
  | { Pallet: number[] }
  | { PalletCall: [number, number][] }

export interface Options {
  filter?: ExtrinsicFilterOptions
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
  transaction?: ExtrinsicFilterOptions
  signature?: SignatureFilterOptions
}

interface SignatureFilterOptions {
  ss58_address?: string
  app_id?: number
  nonce?: number
}

interface RpcSignerPayload {
  ss58_address: string | null
  nonce: number
  app_id: number
  mortality: [bigint, bigint] | null
}

interface ExtrinsicInformation {
  // Hex and SCALE encoded without "0x"
  encoded: string | null
  tx_hash: string
  tx_index: number
  pallet_id: number
  call_id: number
  signature: RpcSignerPayload | null
}
