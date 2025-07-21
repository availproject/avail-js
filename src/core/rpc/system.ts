import { callRaw } from "./index"
import { HashNumber } from "./../index"

export async function fetchExtrinsicV1(endpoint: string, blockId: HashNumber, options: fetchExtrinsicV1Types.Options | null): Promise<fetchExtrinsicV1Types.RpcResponse> {
  const params = [blockId, options];
  const res = await callRaw(endpoint, "system_fetchExtrinsicsV1", params)
  return {
    result: res.result,
    error: res.result,
  }
}

export namespace fetchExtrinsicV1Types {
  export type Options = {
    filter?: Filter | null;
    encodeAs?: EncodeSelector | null;
  };
  export type Filter = {
    transaction?: TransactionFilterOptions | null;
    signature?: SignatureFilterOptions | null;
  };

  export type EncodeSelector = "None" | "Call" | "Extrinsic";
  export type SignatureFilterOptions = {
    ss58_address?: string | null;
    app_id?: number | null;
    nonce?: number | null;
  };
  export type TransactionFilterOptions =
    | "All"
    | { TxHash: string[] }
    | { TxIndex: number[] }
    | { Pallet: number[] }
    | { PalletCall: [number, number][] };

  // Response
  export type RpcResponse = {
    result: ExtrinsicInformation[] | null
    error: Error | null
  };

  export type Error = { code: number; message: string; data: string | null };

  export type ExtrinsicInformation = {
    // Hex and SCALE encoded without "0x"
    encoded: string | null;
    tx_hash: string;
    tx_index: number;
    pallet_id: number;
    call_id: number;
    signature: TransactionSignature | null;
  };

  export type TransactionSignature = {
    ss58_address: string | null;
    nonce: number;
    app_id: number;
    mortality: [bigint, bigint] | null;
  };
}

