import { ClientError } from "./error"
import { DecodedTransaction } from "./transaction"
import { H256 } from "./types"
import { BlockRef } from "./types/metadata"
import { Client } from "./clients/main_client"
import { IHeaderAndDecodable } from "./interface"
import { EncodeSelector, Options, ExtrinsicInfo } from "./rpc/system/fetch_extrinsics"
import { Block, Transaction } from "./block"

export class Blocks {
  start: number
  end: number
  ext: BExt
  tx: BTx

  constructor(client: Client, start: number, end: number) {
    this.start = start
    this.end = end
    this.ext = new BExt(client, this)
    this.tx = new BTx(this.ext)
  }
}

export interface BlockExtrinsicInfoSingle {
  ref: BlockRef
  extrinsic: ExtrinsicInfo
}

export interface BlockExtrinsicInfo {
  ref: BlockRef
  extrinsics: ExtrinsicInfo[]
}

export interface BlockTransactionSingle<T> {
  ref: BlockRef
  transaction: Transaction<T>
}

export interface BlockTransaction<T> {
  ref: BlockRef
  transactions: Transaction<T>[]
}

class BTx {
  constructor(private bExt: BExt) {}

  async get<T>(
    as: IHeaderAndDecodable<T>,
    txHash: H256 | string,
    retryOnError: boolean = true,
  ): Promise<BlockTransactionSingle<T> | null | ClientError> {
    const opts: Options = {}
    opts.transactionFilter = { TxHash: [txHash.toString()] }
    opts.encodeAs = "Extrinsic"

    const bxi = await this.bExt.first(opts, retryOnError)
    if (bxi instanceof ClientError) return bxi
    if (bxi === null) return null

    const info = bxi.extrinsic
    if (info.data == null) return new ClientError("Fetch extrinsics endpoint returned an extrinsic with no data.")

    const decoded = DecodedTransaction.decode(as, info.data)
    if (decoded instanceof ClientError) return decoded

    const transaction = {
      call: decoded.call,
      signed: decoded.signature,
      txHash: info.txHash,
      txIndex: info.txIndex,
      palletId: info.palletId,
      variantId: info.variantId,
      ss58Address: info.signature ? info.signature.ss58_address : null,
    }

    return { ref: bxi.ref, transaction }
  }

  async first<T>(
    as: IHeaderAndDecodable<T>,
    opts?: Options,
    retryOnError: boolean = true,
  ): Promise<BlockTransactionSingle<T> | null | ClientError> {
    opts = opts === undefined ? {} : opts
    opts.transactionFilter = { PalletCall: [[as.palletId(), as.variantId()]] }
    opts.encodeAs = "Extrinsic"

    const bxi = await this.bExt.first(opts, retryOnError)
    if (bxi instanceof ClientError) return bxi
    if (bxi === null) return null

    const info = bxi.extrinsic
    if (info.data == null) return new ClientError("Fetch extrinsics endpoint returned an extrinsic with no data.")

    const decoded = DecodedTransaction.decode(as, info.data)
    if (decoded instanceof ClientError) return decoded

    const transaction = {
      call: decoded.call,
      signed: decoded.signature,
      txHash: info.txHash,
      txIndex: info.txIndex,
      palletId: info.palletId,
      variantId: info.variantId,
      ss58Address: info.signature ? info.signature.ss58_address : null,
    }

    return { ref: bxi.ref, transaction }
  }

  async last<T>(
    as: IHeaderAndDecodable<T>,
    opts?: Options,
    retryOnError: boolean = true,
  ): Promise<BlockTransactionSingle<T> | null | ClientError> {
    opts = opts === undefined ? {} : opts
    opts.transactionFilter = { PalletCall: [[as.palletId(), as.variantId()]] }
    opts.encodeAs = "Extrinsic"

    const bxi = await this.bExt.last(opts, retryOnError)
    if (bxi instanceof ClientError) return bxi
    if (bxi === null) return null

    const info = bxi.extrinsic
    if (info.data == null) return new ClientError("Fetch extrinsics endpoint returned an extrinsic with no data.")

    const decoded = DecodedTransaction.decode(as, info.data)
    if (decoded instanceof ClientError) return decoded

    const transaction = {
      call: decoded.call,
      signed: decoded.signature,
      txHash: info.txHash,
      txIndex: info.txIndex,
      palletId: info.palletId,
      variantId: info.variantId,
      ss58Address: info.signature ? info.signature.ss58_address : null,
    }

    return { ref: bxi.ref, transaction }
  }

  async all<T>(
    as: IHeaderAndDecodable<T>,
    opts?: Options,
    retryOnError: boolean = true,
  ): Promise<BlockTransaction<T>[] | ClientError> {
    opts = opts === undefined ? {} : opts
    opts.transactionFilter = { PalletCall: [[as.palletId(), as.variantId()]] }
    opts.encodeAs = "Extrinsic"

    const bxis = await this.bExt.all(opts, retryOnError)
    if (bxis instanceof ClientError) return bxis

    const result: BlockTransaction<T>[] = []
    for (const bxi of bxis) {
      const transactions: Transaction<T>[] = []
      for (const info of bxi.extrinsics) {
        if (info.data == null) return new ClientError("Fetch extrinsics endpoint returned an extrinsic with no data.")

        const decoded = DecodedTransaction.decode(as, info.data)
        if (decoded instanceof ClientError) return decoded

        transactions.push({
          call: decoded.call,
          signed: decoded.signature,
          txHash: info.txHash,
          txIndex: info.txIndex,
          palletId: info.palletId,
          variantId: info.variantId,
          ss58Address: info.signature ? info.signature.ss58_address : null,
        })
      }
      result.push({ ref: bxi.ref, transactions })
    }

    return result
  }
}

class BExt {
  constructor(
    private client: Client,
    private blocks: Blocks,
  ) {}

  async get(
    txHash: H256 | string,
    encodeAs?: EncodeSelector,
    retryOnError: boolean = true,
  ): Promise<BlockExtrinsicInfoSingle | null | ClientError> {
    let txFilter = { TxHash: [txHash.toString()] }
    return await this.first({ transactionFilter: txFilter, encodeAs: encodeAs }, retryOnError)
  }

  async first(options?: Options, retryOnError: boolean = true): Promise<BlockExtrinsicInfoSingle | null | ClientError> {
    for (let pos = this.blocks.start; pos <= this.blocks.end; ++pos) {
      const blockHash = await this.client.blockHash(pos)
      if (blockHash instanceof ClientError) return blockHash
      if (blockHash === null) return new ClientError("No block hash found")

      const blockRef: BlockRef = { hash: blockHash, height: pos }
      const extrinsic = await new Block(this.client, blockRef.hash).ext.first(options, retryOnError)
      if (extrinsic instanceof ClientError) return extrinsic
      if (extrinsic === null) continue

      return { ref: blockRef, extrinsic }
    }

    return null
  }

  async last(options?: Options, retryOnError: boolean = true): Promise<BlockExtrinsicInfoSingle | null | ClientError> {
    for (let pos = this.blocks.end; pos >= this.blocks.start; --pos) {
      const blockHash = await this.client.blockHash(pos)
      if (blockHash instanceof ClientError) return blockHash
      if (blockHash === null) return new ClientError("No block hash found")

      const blockRef: BlockRef = { hash: blockHash, height: pos }
      const extrinsic = await new Block(this.client, blockRef.hash).ext.last(options, retryOnError)
      if (extrinsic instanceof ClientError) return extrinsic
      if (extrinsic === null) continue

      return { ref: blockRef, extrinsic }
    }

    return null
  }

  async all(options?: Options, retryOnError: boolean = true): Promise<BlockExtrinsicInfo[] | ClientError> {
    const result: BlockExtrinsicInfo[] = []
    for (let pos = this.blocks.start; pos <= this.blocks.end; ++pos) {
      const blockHash = await this.client.blockHash(pos)
      if (blockHash instanceof ClientError) return blockHash
      if (blockHash === null) return new ClientError("No block hash found")

      const blockRef: BlockRef = { hash: blockHash, height: pos }
      const extrinsics = await new Block(this.client, blockRef.hash).ext.all(options, retryOnError)
      if (extrinsics instanceof ClientError) return extrinsics
      if (extrinsics.length == 0) continue

      result.push({ ref: blockRef, extrinsics })
    }

    return result
  }
}
