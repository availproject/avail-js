import type { AllowedExtrinsic, SignatureFilter } from "../core/rpc/custom"

export type ExtrinsicFilterOptions =
  | "All"
  | { TxHash: string[] }
  | { TxIndex: number[] }
  | { Pallet: number[] }
  | { PalletCall: [number, number][] }

export type ExtrinsicOptions = {
  filter?: ExtrinsicFilterOptions
  ss58Address?: string
  appId?: number
  nonce?: number
}

export function toAllowList(filter?: ExtrinsicFilterOptions): AllowedExtrinsic[] | null {
  if (filter == null || filter === "All") return null
  if ("TxHash" in filter) return filter.TxHash.map((h) => ({ TxHash: h }))
  if ("TxIndex" in filter) return filter.TxIndex.map((i) => ({ TxIndex: i }))
  if ("Pallet" in filter) return filter.Pallet.map((p) => ({ Pallet: p }))
  if ("PalletCall" in filter) return filter.PalletCall.map((pc) => ({ PalletCall: pc }))
  return null
}

export function toSignatureFilter(opts: ExtrinsicOptions): SignatureFilter {
  return {
    ss58_address: opts.ss58Address,
    app_id: opts.appId,
    nonce: opts.nonce,
  }
}
