import { callRaw, RpcError } from "./index"
import { HashNumber } from "./../index"
import { H256 } from "../../sdk"

export async function fetchExtrinsicV1(
  endpoint: string,
  blockId: HashNumber,
  options?: fetchExtrinsicV1Types.Options | null,
): Promise<fetchExtrinsicV1Types.RpcResponse> {
  const params = [blockId, options]
  const res = await callRaw(endpoint, "system_fetchExtrinsicsV1", params)
  return {
    result: res.result,
    error: res.error,
  }
}

export async function fetchEventsV1(
  endpoint: string,
  blockHash: H256 | string,
  options?: fetchEventsV1Types.Options | null,
): Promise<fetchEventsV1Types.RpcResponse> {
  const params = [blockHash.toString(), options]
  const res = await callRaw(endpoint, "system_fetchEventsV1", params)
  return {
    result: res.result,
    error: res.error,
  }
}

export namespace fetchEventsV1Types {
  export type Options = {
    filter?: Filter | null
    enable_encoding?: boolean | null
    enable_decoding?: boolean | null
  }
  export type Filter = "All" | "OnlyExtrinsics" | "OnlyNonExtrinsics" | { Only: number[] }

  export type RpcResponse = {
    result: GroupedRuntimeEvents[] | null
    error: RpcError | null
  }

  export type GroupedRuntimeEvents = {
    phase: Phase
    events: RuntimeEvent[]
  }

  export type RuntimeEvent = {
    index: number
    // (Pallet Id, Variant Id)
    emitted_index: [number, number]
    encoded: string | null
    decoded: string | null
  }

  export type Phase = { ApplyExtrinsic: number } | "Finalization" | "Initialization"
}

export namespace fetchExtrinsicV1Types {
  export type Options = {
    filter?: Filter | null
    encodeAs?: EncodeSelector | null
  }
  export type Filter = {
    transaction?: TransactionFilterOptions | null
    signature?: SignatureFilterOptions | null
  }

  export type EncodeSelector = "None" | "Call" | "Extrinsic"
  export type SignatureFilterOptions = {
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
  export type RpcResponse = {
    result: ExtrinsicInformation[] | null
    error: RpcError | null
  }

  export type ExtrinsicInformation = {
    // Hex and SCALE encoded without "0x"
    encoded: string | null
    tx_hash: string
    tx_index: number
    pallet_id: number
    call_id: number
    signature: TransactionSignature | null
  }

  export type TransactionSignature = {
    ss58_address: string | null
    nonce: number
    app_id: number
    mortality: [bigint, bigint] | null
  }
}
