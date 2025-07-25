import { H256, HashNumber } from "./../index"
import { Client } from "./main_client"
import { fetchExtrinsicV1Types as Types } from "./../../core/rpc/system"

export class BlockClient {
  private client: Client
  constructor(client: Client) {
    this.client = client
  }

  public async blockTransaction(
    blockId: H256 | string | number,
    transactionId: H256 | string | number,
    signatureFilter?: Types.SignatureFilterOptions | null,
    encodeAs?: Types.EncodeSelector | null,
  ): Promise<Types.ExtrinsicInformation | null> {
    let txFilter: Types.TransactionFilterOptions = "All"
    if (transactionId instanceof H256 || typeof transactionId === "string") {
      txFilter = { TxHash: [transactionId.toString()] }
    } else {
      txFilter = { TxIndex: [transactionId] }
    }

    const txs = await this.blockTransactions(blockId, txFilter, signatureFilter, encodeAs)
    if (txs.length == 0) {
      return null
    }

    return txs[0]
  }

  public async blockTransactions(
    blockId: H256 | string | number,
    transactionFilter?: Types.TransactionFilterOptions | null,
    signatureFilter?: Types.SignatureFilterOptions | null,
    encodeAs?: Types.EncodeSelector | null,
  ): Promise<Types.ExtrinsicInformation[]> {
    let blockIdParam: HashNumber
    if (blockId instanceof H256 || typeof blockId === "string") {
      blockIdParam = { Hash: blockId.toString() }
    } else {
      blockIdParam = { Number: blockId }
    }

    let encode: Types.EncodeSelector
    if (encodeAs == undefined || encodeAs == null) {
      encode = "Call"
    } else {
      encode = encodeAs
    }

    const rpc = this.client.rpcApi()
    return await rpc.systemFetchExtrinsicV1(blockIdParam, transactionFilter, signatureFilter, encode)
  }
}
