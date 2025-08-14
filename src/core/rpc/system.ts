import { callRaw, RpcError, call, Json } from "./utils"
import { GeneralError, H256, HashNumber } from "./../index"

/// Cannot Throw
export async function getBlockNumber(
  endpoint: string,
  blockHash: H256 | string,
): Promise<number | null | GeneralError> {
  return await call(endpoint, "system_getBlockNumber", [blockHash.toString()])
}

/// Cannot Throw
export async function latestBlockInfo(
  endpoint: string,
  useBestBlock?: boolean,
): Promise<types.BlockInfo | GeneralError> {
  const params = useBestBlock == undefined ? undefined : [useBestBlock]
  const res = await call(endpoint, "system_latestBlockInfo", params)
  if (res instanceof GeneralError) return res

  const hash = Json.parseString(res.hash)
  if (hash instanceof GeneralError) return hash

  const height = Json.parseNumber(res.height)
  if (height instanceof GeneralError) return height

  const h256 = H256.fromHex(hash)
  if (h256 instanceof GeneralError) return h256

  return { hash: h256, height }
}

export async function fetchExtrinsics(
  endpoint: string,
  blockId: HashNumber,
  options?: fetchExtrinsicTypes.Options,
): Promise<fetchExtrinsicTypes.ExtrinsicInformation[] | GeneralError> {
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
  if (res instanceof GeneralError) return res
  if (res == null) return new GeneralError("Failed to fetch extrinsics")

  return res
}

export async function fetchEvents(
  endpoint: string,
  blockHash: H256 | string,
  options?: fetchEventsTypes.Options | null,
): Promise<fetchEventsTypes.GroupedRuntimeEvents[] | GeneralError> {
  const params = [blockHash.toString(), options]
  const res = await call(endpoint, "system_fetchEventsV1", params)
  if (res instanceof GeneralError) return res
  if (res == null) return new GeneralError("Failed to fetch events")

  return res
}

export namespace types {
  export type BlockInfo = { hash: H256; height: number }
}

export namespace fetchEventsTypes {
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

export namespace fetchExtrinsicTypes {
  export type Options = {
    transactionFilter?: TransactionFilterOptions | null
    ss58Address?: string | null
    appId?: number | null
    nonce?: number | null
    encodeAs?: EncodeSelector | null
  }

  export type RpcOptions = {
    filter?: Filter | null
    encode_selector?: EncodeSelector | null
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
