import { H256 } from "./../../core/index"
import { Client } from "./main_client";

export class BlockClient {
  private client: Client
  constructor(client: Client) { this.client = client }

  public async blockTransaction(blockId: H256 | string | number, transactionId: H256 | string | number, signatureFilter: SignatureFilterOptions | null, encodeAs: EncodeSelector | null) {
    let blockIdParam: HashNumber;
    if (blockId instanceof H256 || typeof blockId === "string") {
      blockIdParam = { Hash: blockId.toString() }
    } else {
      blockIdParam = { Number: blockId }
    }


    let txFilter: TransactionFilterOptions = "All" satisfies TransactionFilterOptions;
    if (transactionId instanceof H256 || typeof transactionId === "string") {
      txFilter = { TxHash: [transactionId.toString()] }
    } else {
      txFilter = { TxIndex: [transactionId] }
    }

    const options: Options = {
      filter: { transaction: txFilter, signature: signatureFilter },
      encode_selector: encodeAs
    }

    const json = await this.client.api.__rpcCore.provider.send().system.fetchExtrinsicsV1(blockIdParam, options)
    console.log(json)
  }
}

// Request
export type HashNumber = { Hash: string } | { Number: number };
export type Options = {
  filter?: Filter | null;
  encode_selector?: EncodeSelector | null;
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
  | { TxHash: Array<string> }
  | { TxIndex: Array<number> }
  | { Pallet: Array<number> }
  | { PalletCall: Array<[number, number]> };


// Response
export type RpcResponse = {
  jsonrpc: string;
  result: Array<ExtrinsicInformation> | null;
  error: Error | null;
  id: number;
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