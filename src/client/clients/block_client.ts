import { H256, HashNumber, SignedBlock, hexToU8a, log } from "./../index"
import { Client } from "./main_client"
import { fetchExtrinsicV1Types as Types } from "./../../core/rpc/system"

export class BlockClient {
  private client: Client
  constructor(client: Client) {
    this.client = client
  }

  public async transaction(
    blockId: H256 | string | number,
    transactionId: H256 | string | number,
    encodeAs?: Types.EncodeSelector | null,
  ): Promise<Types.ExtrinsicInformation | null> {
    let txFilter: Types.TransactionFilterOptions = "All"
    if (transactionId instanceof H256 || typeof transactionId === "string") {
      txFilter = { TxHash: [transactionId.toString()] }
    } else {
      txFilter = { TxIndex: [transactionId] }
    }

    const txs = await this.transactions(blockId, txFilter, null, encodeAs)
    if (txs.length == 0) {
      return null
    }

    return txs[0]
  }

  public async transactionWithRetries(
    blockId: H256 | string | number,
    transactionId: H256 | string | number,
    encodeAs?: Types.EncodeSelector | null,
  ): Promise<Types.ExtrinsicInformation | null> {
    let txFilter: Types.TransactionFilterOptions = "All"
    if (transactionId instanceof H256 || typeof transactionId === "string") {
      txFilter = { TxHash: [transactionId.toString()] }
    } else {
      txFilter = { TxIndex: [transactionId] }
    }

    const txs = await this.transactionsWithRetries(blockId, txFilter, null, encodeAs)
    if (txs.length == 0) {
      return null
    }

    return txs[0]
  }

  public async transactionStatic<T>(
    t: { decodeCall(value: Uint8Array): T | null },
    blockId: H256 | string | number,
    transactionId: H256 | string | number,
  ): Promise<[T, Types.ExtrinsicInformation] | null> {
    let txFilter: Types.TransactionFilterOptions = "All"
    if (transactionId instanceof H256 || typeof transactionId === "string") {
      txFilter = { TxHash: [transactionId.toString()] }
    } else {
      txFilter = { TxIndex: [transactionId] }
    }


    const txs = await this.transactions(blockId, txFilter, null, "Call")
    if (txs.length == 0) {
      return null
    }

    const info = txs[0];
    if (info.encoded == null) {
      return null
    }

    const hexDecoded = hexToU8a(info.encoded)
    const decoded = t.decodeCall(hexDecoded)
    if (decoded == null) {
      return null;
    }

    info.encoded = null
    return [decoded, info]
  }

  public async transactionStaticWithRetries<T>(
    t: { decodeCall(value: Uint8Array): T | null },
    blockId: H256 | string | number,
    transactionId: H256 | string | number,
  ): Promise<[T, Types.ExtrinsicInformation] | null> {
    let txFilter: Types.TransactionFilterOptions = "All"
    if (transactionId instanceof H256 || typeof transactionId === "string") {
      txFilter = { TxHash: [transactionId.toString()] }
    } else {
      txFilter = { TxIndex: [transactionId] }
    }


    const txs = await this.transactionsWithRetries(blockId, txFilter, null, "Call")
    if (txs.length == 0) {
      return null
    }

    const info = txs[0];
    if (info.encoded == null) {
      return null
    }

    const hexDecoded = hexToU8a(info.encoded)
    const decoded = t.decodeCall(hexDecoded)
    if (decoded == null) {
      return null;
    }

    info.encoded = null
    return [decoded, info]
  }

  public async transactions(
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

  public async transactionsWithRetries(
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
    return await rpc.systemFetchExtrinsicV1WithRetries(blockIdParam, transactionFilter, signatureFilter, encode)
  }

  public async rpcBlock(blockHash?: H256 | string): Promise<SignedBlock | null> {
    return await this.client.block(blockHash)
  }

  public async rpcBlockWithRetries(blockHash?: H256 | string): Promise<SignedBlock | null> {
    return await this.client.blockWithRetries(blockHash)
  }
}
