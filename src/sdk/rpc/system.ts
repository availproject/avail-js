import ClientError from "../error"
import { H256 } from "../types"
import { HashNumber } from "../types/metadata"
import { RpcError, call, Json } from "./utils"

/// Cannot Throw
export async function getBlockNumber(endpoint: string, blockHash: H256 | string): Promise<number | null | ClientError> {
  return await call(endpoint, "system_getBlockNumber", [blockHash.toString()])
}

/// Cannot Throw
export async function latestBlockInfo(
  endpoint: string,
  useBestBlock?: boolean,
): Promise<types.BlockInfo | ClientError> {
  const params = useBestBlock == undefined ? undefined : [useBestBlock]
  const res = await call(endpoint, "system_latestBlockInfo", params)
  if (res instanceof ClientError) return res

  const hash = Json.parseString(res.hash)
  if (hash instanceof ClientError) return hash

  const height = Json.parseNumber(res.height)
  if (height instanceof ClientError) return height

  const h256 = H256.from(hash)
  if (h256 instanceof ClientError) return h256

  return { hash: h256, height }
}

export async function fetchExtrinsics(
  endpoint: string,
  blockId: HashNumber,
  options?: fetchExtrinsicTypes.Options,
): Promise<fetchExtrinsicTypes.ExtrinsicInformation[] | ClientError> {
  const filter: fetchExtrinsicTypes.Filter = {
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

export async function fetchEvents(
  endpoint: string,
  blockHash: H256 | string,
  options?: fetchEventsTypes.Options | null,
): Promise<fetchEventsTypes.GroupedRuntimeEvents[] | ClientError> {
  const params = [blockHash.toString(), options]
  const res = await call(endpoint, "system_fetchEventsV1", params)
  if (res instanceof ClientError) return res
  if (res == null) return new ClientError("Failed to fetch events")

  return res
}

export namespace types {
  export interface BlockInfo {
    hash: H256
    height: number
  }
}

export namespace fetchEventsTypes {
  export interface Options {
    filter?: Filter | null
    enable_encoding?: boolean | null
    enable_decoding?: boolean | null
  }
  export type Filter = "All" | "OnlyExtrinsics" | "OnlyNonExtrinsics" | { Only: number[] }

  export interface RpcResponse {
    result: GroupedRuntimeEvents[] | null
    error: RpcError | null
  }

  export interface GroupedRuntimeEvents {
    phase: Phase
    events: RuntimeEvent[]
  }

  export interface RuntimeEvent {
    index: number
    // (Pallet Id, Variant Id)
    emitted_index: [number, number]
    encoded: string | null
    decoded: string | null
  }

  export type Phase = { ApplyExtrinsic: number } | "Finalization" | "Initialization"
}

export namespace fetchExtrinsicTypes {
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
}
