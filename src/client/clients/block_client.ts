import { Client } from "./main_client"
import { fetchExtrinsicTypes as Types } from "./../../core/rpc/system"
import {
  DecodedTransaction,
  HasTxDispatchIndex,
  Decodable,
  GeneralError,
  H256,
  HashNumber,
  SignedBlock,
} from "../../core"

export class BlockClient {
  private client: Client
  constructor(client: Client) {
    this.client = client
  }

  public async transaction(
    blockId: H256 | string | number,
    transactionId: H256 | string | number,
    encodeAs?: Types.EncodeSelector | null,
    retryOnError: boolean = true,
  ): Promise<Types.ExtrinsicInformation | null | GeneralError> {
    let txFilter: Types.TransactionFilterOptions = "All"
    if (transactionId instanceof H256 || typeof transactionId === "string") {
      txFilter = { TxHash: [transactionId.toString()] }
    } else {
      txFilter = { TxIndex: [transactionId] }
    }

    const txs = await this.transactions(blockId, { transactionFilter: txFilter, encodeAs: encodeAs }, retryOnError)
    if (txs instanceof GeneralError) return txs
    if (txs.length == 0) return null

    return txs[0]
  }

  public async transactionStatic<T>(
    t: Decodable<T> & HasTxDispatchIndex,
    blockId: H256 | string | number,
    transactionId: H256 | string | number,
    retryOnError: boolean = true,
  ): Promise<[DecodedTransaction<T>, Types.ExtrinsicInformation] | null | GeneralError> {
    let txFilter: Types.TransactionFilterOptions = "All"
    if (transactionId instanceof H256 || typeof transactionId === "string") {
      txFilter = { TxHash: [transactionId.toString()] }
    } else {
      txFilter = { TxIndex: [transactionId] }
    }

    const txs = await this.transactions(blockId, { transactionFilter: txFilter, encodeAs: "Extrinsic" }, retryOnError)
    if (txs instanceof GeneralError) return txs
    if (txs.length == 0) return null

    const info = txs[0]
    if (info.encoded == null) return null

    const decoded = DecodedTransaction.decodeHex(t, info.encoded)
    if (decoded instanceof GeneralError) return decoded
    if (decoded == null) return null

    info.encoded = null
    return [decoded, info]
  }

  public async transactions(
    blockId: H256 | string | number,
    options?: Types.Options,
    retryOnError: boolean = true,
  ): Promise<Types.ExtrinsicInformation[] | GeneralError> {
    let blockIdParam: HashNumber
    if (blockId instanceof H256 || typeof blockId === "string") {
      blockIdParam = { Hash: blockId.toString() }
    } else {
      blockIdParam = { Number: blockId }
    }

    if (options == undefined) {
      options = { encodeAs: "Call" }
    } else if (options.encodeAs == undefined) {
      options.encodeAs = "Call"
    }

    const rpc = this.client.rpc
    return await rpc.system.fetchExtrinsic(blockIdParam, options, retryOnError)
  }

  public async rpcBlock(
    blockHash?: H256 | string,
    retryOnError: boolean = true,
    retryOnNone: boolean = false,
  ): Promise<SignedBlock | null | GeneralError> {
    return await this.client.block(blockHash, retryOnError, retryOnNone)
  }
}
