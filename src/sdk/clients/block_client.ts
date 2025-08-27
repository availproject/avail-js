import ClientError from "../error"
import { IDecodableTransactionCall } from "../interface"
import { DecodedTransaction } from "../transaction"
import { H256, SignedBlock } from "../types"
import { HashLike, HashNumber } from "../types/metadata"
import { Client } from "./main_client"
import { fetchExtrinsicTypes as Types } from "./../rpc/system"

export class BlockClient {
  constructor(private client: Client) {}

  async transaction(
    blockId: HashLike | number,
    transactionId: HashLike | number,
    encodeAs?: Types.EncodeSelector | null,
    retryOnError: boolean = true,
  ): Promise<Types.ExtrinsicInformation | null | ClientError> {
    let txFilter: Types.TransactionFilterOptions = "All"
    if (transactionId instanceof H256 || typeof transactionId === "string") {
      txFilter = { TxHash: [transactionId.toString()] }
    } else {
      txFilter = { TxIndex: [transactionId] }
    }

    const txs = await this.transactions(blockId, { transactionFilter: txFilter, encodeAs: encodeAs }, retryOnError)
    if (txs instanceof ClientError) return txs
    if (txs.length == 0) return null

    return txs[0]
  }

  async transactionStatic<T>(
    as: IDecodableTransactionCall<T>,
    blockId: HashLike | number,
    transactionId: HashLike | number,
    retryOnError: boolean = true,
  ): Promise<[DecodedTransaction<T>, Types.ExtrinsicInformation] | null | ClientError> {
    let txFilter: Types.TransactionFilterOptions = "All"
    if (transactionId instanceof H256 || typeof transactionId === "string") {
      txFilter = { TxHash: [transactionId.toString()] }
    } else {
      txFilter = { TxIndex: [transactionId] }
    }

    const txs = await this.transactions(blockId, { transactionFilter: txFilter, encodeAs: "Extrinsic" }, retryOnError)
    if (txs instanceof ClientError) return txs
    if (txs.length == 0) return null

    const info = txs[0]
    if (info.encoded == null) return null

    const decoded = DecodedTransaction.decode(as, info.encoded)
    if (decoded instanceof ClientError) return decoded
    if (decoded == null) return null

    info.encoded = null
    return [decoded, info]
  }

  async transactions(
    blockId: HashLike | number,
    options?: Types.Options,
    retryOnError: boolean = true,
  ): Promise<Types.ExtrinsicInformation[] | ClientError> {
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

  async rpcBlock(
    blockHash?: HashLike,
    retryOnError: boolean = true,
    retryOnNone: boolean = false,
  ): Promise<SignedBlock | null | ClientError> {
    return await this.client.block(blockHash, retryOnError, retryOnNone)
  }
}
