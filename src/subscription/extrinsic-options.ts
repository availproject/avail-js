import type { AllowedExtrinsic, SignatureFilter } from "../core/rpc/custom"

export type ExtrinsicFilterOptions =
  | "All"
  | { TxHash: string[] }
  | { TxIndex: number[] }
  | { Pallet: number[] }
  | { PalletCall: [number, number][] }

export function toAllowList(filter?: ExtrinsicFilterOptions): AllowedExtrinsic[] | null {
  if (filter == null || filter === "All") return null
  if ("TxHash" in filter) return filter.TxHash.map((h) => ({ TxHash: h }))
  if ("TxIndex" in filter) return filter.TxIndex.map((i) => ({ TxIndex: i }))
  if ("Pallet" in filter) return filter.Pallet.map((p) => ({ Pallet: p }))
  if ("PalletCall" in filter) return filter.PalletCall.map((pc) => ({ PalletCall: pc }))
  return null
}
