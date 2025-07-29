import { Client } from "./main_client"
import { fetchExtrinsicV1Types as Types } from "./../../core/rpc/system"
import {
  DecodedTransaction,
  HasTxDispatchIndex,
  Decodable,
  Hex,
  GeneralError,
  H256,
  HashNumber,
  SignedBlock,
} from "../../core/index"

export class BlockClient {
  private client: Client
  constructor(client: Client) {
    this.client = client
  }

  public async transaction(
    blockId: H256 | string | number,
    transactionId: H256 | string | number,
    encodeAs?: Types.EncodeSelector | null,
  ): Promise<Types.ExtrinsicInformation | null | GeneralError> {
    let txFilter: Types.TransactionFilterOptions = "All"
    if (transactionId instanceof H256 || typeof transactionId === "string") {
      txFilter = { TxHash: [transactionId.toString()] }
    } else {
      txFilter = { TxIndex: [transactionId] }
    }

    const txs = await this.transactions(blockId, txFilter, null, encodeAs)
    if (txs instanceof GeneralError) {
      return txs
    }

    if (txs.length == 0) {
      return null
    }

    return txs[0]
  }

  public async transactionWithRetries(
    blockId: H256 | string | number,
    transactionId: H256 | string | number,
    encodeAs?: Types.EncodeSelector | null,
  ): Promise<Types.ExtrinsicInformation | null | GeneralError> {
    let txFilter: Types.TransactionFilterOptions = "All"
    if (transactionId instanceof H256 || typeof transactionId === "string") {
      txFilter = { TxHash: [transactionId.toString()] }
    } else {
      txFilter = { TxIndex: [transactionId] }
    }

    const txs = await this.transactionsWithRetries(blockId, txFilter, null, encodeAs)
    if (txs instanceof GeneralError) {
      return txs
    }

    if (txs.length == 0) {
      return null
    }

    return txs[0]
  }

  public async transactionStatic<T>(
    t: Decodable<T> & HasTxDispatchIndex,
    blockId: H256 | string | number,
    transactionId: H256 | string | number,
  ): Promise<[DecodedTransaction<T>, Types.ExtrinsicInformation] | null | GeneralError> {
    let txFilter: Types.TransactionFilterOptions = "All"
    if (transactionId instanceof H256 || typeof transactionId === "string") {
      txFilter = { TxHash: [transactionId.toString()] }
    } else {
      txFilter = { TxIndex: [transactionId] }
    }

    const txs = await this.transactions(blockId, txFilter, null, "Extrinsic")
    if (txs instanceof GeneralError) {
      return txs
    }

    if (txs.length == 0) {
      return null
    }

    const info = txs[0]
    if (info.encoded == null) {
      return null
    }

    const decoded = DecodedTransaction.decodeHex(t, info.encoded)
    if (decoded instanceof GeneralError) {
      return decoded
    }
    if (decoded == null) {
      return null
    }

    info.encoded = null
    return [decoded, info]
  }

  public async transactionStaticWithRetries<T>(
    t: { decodeCall(value: Uint8Array): T | null },
    blockId: H256 | string | number,
    transactionId: H256 | string | number,
  ): Promise<[T, Types.ExtrinsicInformation] | null | GeneralError> {
    let txFilter: Types.TransactionFilterOptions = "All"
    if (transactionId instanceof H256 || typeof transactionId === "string") {
      txFilter = { TxHash: [transactionId.toString()] }
    } else {
      txFilter = { TxIndex: [transactionId] }
    }

    const txs = await this.transactionsWithRetries(blockId, txFilter, null, "Call")
    if (txs instanceof GeneralError) {
      return txs
    }

    if (txs.length == 0) {
      return null
    }

    const info = txs[0]
    if (info.encoded == null) {
      return null
    }

    const hexDecoded = Hex.decode(info.encoded)
    if (hexDecoded instanceof GeneralError) {
      return hexDecoded
    }
    const decoded = t.decodeCall(hexDecoded)
    if (decoded == null) {
      return null
    }

    info.encoded = null
    return [decoded, info]
  }

  public async transactions(
    blockId: H256 | string | number,
    transactionFilter?: Types.TransactionFilterOptions | null,
    signatureFilter?: Types.SignatureFilterOptions | null,
    encodeAs?: Types.EncodeSelector | null,
  ): Promise<Types.ExtrinsicInformation[] | GeneralError> {
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

  public async transactionsWithRetries(
    blockId: H256 | string | number,
    transactionFilter?: Types.TransactionFilterOptions | null,
    signatureFilter?: Types.SignatureFilterOptions | null,
    encodeAs?: Types.EncodeSelector | null,
  ): Promise<Types.ExtrinsicInformation[] | GeneralError> {
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
    return await rpc.systemFetchExtrinsicV1WithRetries(blockIdParam, transactionFilter, signatureFilter, encode)
  }

  public async rpcBlock(blockHash?: H256 | string): Promise<SignedBlock | null | GeneralError> {
    return await this.client.block(blockHash)
  }

  public async rpcBlockWithRetries(blockHash?: H256 | string): Promise<SignedBlock | null | GeneralError> {
    return await this.client.blockWithRetries(blockHash)
  }
}
