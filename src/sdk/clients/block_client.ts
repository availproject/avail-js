import { ClientError } from "../error"
import { DecodedTransaction } from "../transaction"
import { H256, SignedBlock } from "../types"
import { HashLike, HashNumber, TransactionSigned } from "../types/metadata"
import { Client } from "./main_client"
import { IHeaderAndDecodable } from "../interface"
import {
  EncodeSelector,
  TransactionFilterOptions,
  TransactionSignature,
  Options,
  ExtrinsicInfo,
} from "../rpc/system/fetch_extrinsics"

export interface BlockTransaction {
  txHash: string
  txIndex: number
  palletId: number
  variantId: number
  signature: TransactionSignature | null
  data: string
}

export class BlockClient {
  constructor(private client: Client) {}

  async transaction(
    blockId: HashLike | number,
    transactionId: HashLike | number,
    encodeAs?: EncodeSelector | null,
    retryOnError: boolean = true,
  ): Promise<ExtrinsicInfo | null | ClientError> {
    let txFilter: TransactionFilterOptions = "All"
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
    as: IHeaderAndDecodable<T>,
    blockId: HashLike | number,
    transactionId: HashLike | number,
    retryOnError: boolean = true,
  ): Promise<[T, TransactionSigned | null, ExtrinsicInfo] | null | ClientError> {
    let txFilter: TransactionFilterOptions = "All"
    if (transactionId instanceof H256 || typeof transactionId === "string") {
      txFilter = { TxHash: [transactionId.toString()] }
    } else {
      txFilter = { TxIndex: [transactionId] }
    }

    const txs = await this.transactions(blockId, { transactionFilter: txFilter, encodeAs: "Extrinsic" }, retryOnError)
    if (txs instanceof ClientError) return txs
    if (txs.length == 0) return null

    const info = txs[0]
    if (info.data == null) {
      return new ClientError("Fetch extrinsics endpoint returned an extrinsic with no data.")
    }

    const decoded = DecodedTransaction.decode(as, info.data)
    if (decoded instanceof ClientError) return decoded
    if (decoded == null) return null

    info.data = null
    return [decoded.call, decoded.signature, info]
  }

  async transactions(
    blockId: HashLike | number,
    options?: Options,
    retryOnError: boolean = true,
  ): Promise<ExtrinsicInfo[] | ClientError> {
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
