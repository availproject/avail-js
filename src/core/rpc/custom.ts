import { RpcError } from "../../errors/sdk-error"
import { H256, toHashNumber } from "../metadata"
import { rpcCall } from "./raw"

// ── Public types ────────────────────────────────────────────────────

export type DataFormat = "None" | "Call" | "Extrinsic"

export type AllowedExtrinsic =
  | { TxHash: string }
  | { TxIndex: number }
  | { Pallet: number }
  | { PalletCall: [number, number] }

export interface SignatureFilter {
  ss58_address?: string
  app_id?: number
  nonce?: number
}

export type AllowedEvents = "All" | "OnlyExtrinsics" | "OnlyNonExtrinsics" | { Only: number[] }

export interface TransactionSignature {
  accountId: string | null
  nonce: number
}

export interface ExtrinsicInfo {
  data: string
  extHash: H256
  extIndex: number
  palletId: number
  variantId: number
  signature: TransactionSignature | null
}

export type RuntimePhase = number | "Finalization" | "Initialization"

export interface RuntimeEvent {
  index: number
  palletId: number
  variantId: number
  data: string
}

export interface PhaseEvents {
  phase: RuntimePhase
  events: RuntimeEvent[]
}

export interface ChainInfo {
  bestHash: H256
  bestHeight: number
  finalizedHash: H256
  finalizedHeight: number
  genesisHash: H256
}

// ── Internal RPC response types (snake_case from node) ──────────────

interface RpcExtrinsic {
  data: string
  ext_hash: string
  ext_index: number
  pallet_id: number
  variant_id: number
  signature: RpcTransactionSignature | null
}

interface RpcTransactionSignature {
  account_id: string | null
  nonce: number
}

type RpcPhase = { ApplyExtrinsic: number } | "Finalization" | "Initialization"

interface RpcPhaseEvents {
  phase: RpcPhase
  events: RpcRuntimeEvent[]
}

interface RpcRuntimeEvent {
  index: number
  pallet_id: number
  variant_id: number
  data: string
}

interface RpcChainInfo {
  best_hash: string
  best_height: number
  finalized_hash: string
  finalized_height: number
  genesis_hash: string
}

// ── RPC functions ───────────────────────────────────────────────────

export async function blockNumber(endpoint: string, hash: H256 | string): Promise<number | null> {
  return rpcCall(endpoint, "custom_blockNumber", [hash.toString()])
}

export async function chainInfo(endpoint: string): Promise<ChainInfo> {
  const res = await rpcCall(endpoint, "custom_chainInfo", [])
  if (res == null) throw new RpcError("Failed to fetch chain info")

  const info = res as RpcChainInfo
  const bestHash = H256.from(info.best_hash)
  const finalizedHash = H256.from(info.finalized_hash)
  const genesisHash = H256.from(info.genesis_hash)

  return {
    bestHash,
    bestHeight: info.best_height,
    finalizedHash,
    finalizedHeight: info.finalized_height,
    genesisHash,
  }
}

export async function blockTimestamp(endpoint: string, at: H256 | string | number): Promise<number> {
  const res = await rpcCall(endpoint, "custom_blockTimestamp", [toHashNumber(at)])
  if (res == null) throw new RpcError("Failed to fetch block timestamp")
  return res as number
}

export async function fetchExtrinsics(
  endpoint: string,
  at: H256 | string | number,
  allowList: AllowedExtrinsic[] | null,
  sigFilter: SignatureFilter,
  dataFormat: DataFormat,
): Promise<ExtrinsicInfo[]> {
  const params = [toHashNumber(at), allowList, sigFilter, dataFormat]
  const res = await rpcCall(endpoint, "custom_extrinsics", params)
  if (res == null) throw new RpcError("Failed to fetch extrinsics")

  const rpcExtrinsics = res as RpcExtrinsic[]
  const extrinsics: ExtrinsicInfo[] = []
  for (const ext of rpcExtrinsics) {
    const extHash = H256.from(ext.ext_hash)

    let signature: TransactionSignature | null = null
    if (ext.signature != null) {
      signature = {
        accountId: ext.signature.account_id,
        nonce: ext.signature.nonce,
      }
    }

    extrinsics.push({
      data: ext.data,
      extHash,
      extIndex: ext.ext_index,
      palletId: ext.pallet_id,
      variantId: ext.variant_id,
      signature,
    })
  }

  return extrinsics
}

export async function fetchEvents(
  endpoint: string,
  at: H256 | string | number,
  allowList: AllowedEvents,
  fetchData: boolean,
): Promise<PhaseEvents[]> {
  const params = [toHashNumber(at), allowList, fetchData]
  const res = await rpcCall(endpoint, "custom_events", params)
  if (res == null) throw new RpcError("Failed to fetch events")

  const rpcEvents = res as RpcPhaseEvents[]
  const result: PhaseEvents[] = []
  for (const group of rpcEvents) {
    let phase: RuntimePhase
    if (typeof group.phase === "string") {
      phase = group.phase
    } else {
      phase = group.phase.ApplyExtrinsic
    }

    result.push({
      phase,
      events: group.events.map((e) => ({
        index: e.index,
        palletId: e.pallet_id,
        variantId: e.variant_id,
        data: e.data,
      })),
    })
  }

  return result
}
