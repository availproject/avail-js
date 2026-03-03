import { AccountId, AccountInfo as AccountInfoModel, H256 as H256Model } from "../core/metadata"
import {
  type AccountData,
  type GrandpaJustification,
  type PerDispatchClassWeight,
  type AccountInfo,
  type AccountInfoStruct,
  type BlockInfo,
  type FeeDetails,
  type SignatureOptions,
  type H256,
  type RuntimeDispatchInfo,
} from "../core/metadata"
import type { AvailHeader } from "../core/header"
import type { SignedBlock, PolkadotExtrinsic } from "../core/polkadot"
import type { KeyringPair } from "../core/polkadot"
import { u8aToHex } from "../core/polkadot"
import type {
  ChainInfo,
  ExtrinsicInfo,
  PhaseEvents,
  AllowedExtrinsic,
  SignatureFilter,
  DataFormat,
  AllowedEvents,
} from "../core/rpc/custom"
import type { BlockLength as KateBlockLength } from "../core/rpc/kate"
import type { RpcResponse } from "../core/rpc/raw"
import { avail, rpc } from "../core"
import { StorageValue } from "../core/storage"
import type { Client } from "../client/client"
import { SubmittableTransaction, type ExtrinsicLike } from "../submission/submittable"
import type { SubmittedTransaction } from "../submission/submitted"
import { AccountLike, accountLikeToAddress, BlockAt, blockAtToHashOrNumber, HashLike, RetryPolicy } from "../types"
import { executeWithRetry } from "../internal/retry/execute"
import { normalizeThrown } from "../internal/result/unwrap"
import { NotFoundError } from "../errors/sdk-error"
import { ErrorOperation } from "../errors/operations"
import { blockAtToHash, blockAtToHeight } from "./helper"

type GRawScalar = string
type GProof = string

export type GDataProof = [GRawScalar, GProof]
export type GRow = GRawScalar[]
export type GMultiProof = [GRawScalar[], GProof]

export interface GCellBlock {
  startX: number
  startY: number
  endX: number
  endY: number
}

export interface TxDataRoots {
  dataRoot: string
  blobRoot: string
  bridgeRoot: string
}

export interface DataProof {
  roots: TxDataRoots
  proof: string[]
  numberOfLeaves: number
  leafIndex: number
  leaf: string
}

export interface AddressedMessage {
  message: unknown
  from: string
  to: string
  originDomain: number
  destinationDomain: number
  id: number
}

export interface ProofResponse {
  dataProof: DataProof
  message?: AddressedMessage
}

export interface Blob {
  blobHash: string
  data: string
  size: number
}

export interface BlobOwnershipEntry {
  address: string
  babeKey: string
  encodedPeerId: string
  signature: string
}

export interface BlobInfo {
  hash: string
  blockHash: string
  blockNumber: number
  ownership: BlobOwnershipEntry[]
}

export interface EncodedLegacyEvent {
  phase: number | "Finalization" | "Initialization"
  index: number
  palletId: number
  variantId: number
  encodedData: string | null
}

/**
 * Low-level chain RPC helpers with configurable retry behavior.
 */
export class Chain {
  private retryOnError: RetryPolicy = "inherit"
  private retryOnNone: RetryPolicy = "inherit"

  constructor(private readonly client: Client) {}

  /**
   * Sets retry policies for RPC errors and `null` responses.
   */
  retryPolicy(errorPolicy: RetryPolicy, nonePolicy: RetryPolicy): Chain {
    this.retryOnError = errorPolicy
    this.retryOnNone = nonePolicy
    return this
  }

  private inheritedRetryEnabled(): boolean {
    return this.client.retryPolicy() !== "disabled"
  }

  private async withRetry<T>(op: () => Promise<T>): Promise<T> {
    try {
      return await executeWithRetry(
        {
          policy: this.retryOnError,
          inherited: this.inheritedRetryEnabled(),
        },
        op,
      )
    } catch (error) {
      normalizeThrown(error)
    }
  }

  /**
   * Returns block hash for a height, or current head hash when omitted.
   */
  async blockHash(blockHeight?: number): Promise<H256 | null> {
    return this.withRetry(async () => {
      const hash = await this.client.api().rpc.chain.getBlockHash(blockHeight)
      const asHex = hash.toHex()
      if (asHex === "0x") {
        return null
      }
      return H256Model.from(asHex)
    })
  }

  /**
   * Returns block header for hash/height, or current head header when omitted.
   */
  async blockHeader(at?: BlockAt): Promise<AvailHeader | null> {
    return this.withRetry(async () => {
      let header
      if (at == undefined) {
        header = await this.client.api().rpc.chain.getHeader()
      } else {
        const hast = await blockAtToHash(this, at)
        if (hast == null) {
          return null
        }

        header = await this.client.api().rpc.chain.getHeader(hast.toHex())
      }
      if (header == null) {
        return null
      }

      return header as unknown as AvailHeader
    })
  }

  async legacyBlock(at?: BlockAt): Promise<SignedBlock | null> {
    if (at != undefined) {
      const hash = await blockAtToHash(this, at)
      if (hash == null) {
        return null
      }
      at = hash
    }

    return this.withRetry(async () => {
      return await this.client.api().rpc.chain.getBlock(at?.toString())
    })
  }

  async blockMetadata(at?: H256): Promise<Uint8Array | null> {
    return this.stateGetMetadata(at)
  }

  async blockNonce(accountId: AccountLike, at: BlockAt): Promise<number> {
    const info = await this.accountInfo(accountId, at)
    return info.nonce
  }

  async accountNonce(accountId: AccountLike): Promise<number> {
    const address = accountLikeToAddress(accountId)
    return this.withRetry(async () => {
      const nonce = await this.client.api().rpc.system.accountNextIndex(address)
      return nonce.toNumber()
    })
  }

  async accountBalance(accountId: AccountLike, at: BlockAt): Promise<AccountData> {
    const info = await this.accountInfo(accountId, at)
    return info.data
  }

  async accountInfo(accountId: AccountLike, at: BlockAt): Promise<AccountInfo> {
    const address = accountLikeToAddress(accountId)
    const blockHash = await blockAtToHash(this, at)
    if (blockHash == null) {
      throw new NotFoundError("Could not resolve block hash for accountInfo query", {
        operation: ErrorOperation.ChainAccountInfo,
        details: { accountId: address, at: at.toString() },
      })
    }

    return this.withRetry(async () => {
      const apiAt = await this.client.api().at(blockHash.toHex())
      const struct = await apiAt.query.system.account<AccountInfoStruct>(address)
      return new AccountInfoModel(
        struct.nonce.toNumber(),
        struct.consumers.toNumber(),
        struct.providers.toNumber(),
        struct.sufficients.toNumber(),
        struct.data,
      )
    })
  }

  async blockHeight(at: HashLike): Promise<number | null> {
    return this.withRetry(async () => await rpc.custom.blockNumber(this.client.endpoint(), at))
  }

  async blockInfoFrom(at: BlockAt): Promise<BlockInfo> {
    if (typeof at === "number") {
      const hash = await this.blockHash(at)
      if (hash == null) {
        throw new NotFoundError("No block hash found for height", {
          operation: ErrorOperation.ChainBlockInfoFrom,
          details: { height: at },
        })
      }
      return { hash, height: at }
    }

    const hash = typeof at === "string" ? H256Model.from(at) : at
    const height = await this.blockHeight(hash)
    if (height == null) {
      throw new NotFoundError("No block height found for hash", {
        operation: ErrorOperation.ChainBlockInfoFrom,
        details: { hash: hash.toString() },
      })
    }

    return { hash, height }
  }

  async blockAuthor(at: BlockAt): Promise<AccountId> {
    const info = await this.blockInfoFrom(at)
    return this.withRetry(async () => {
      const header = await this.client.api().derive.chain.getHeader(info.hash.toString())
      if (header.author == null) {
        throw new NotFoundError("Failed to find block author", {
          operation: ErrorOperation.ChainBlockAuthor,
          details: { blockHash: info.hash.toString() },
        })
      }
      return new AccountId(header.author.toU8a())
    })
  }

  async blockEventCount(at: BlockAt): Promise<number> {
    const info = await this.blockInfoFrom(at)
    return this.withRetry(async () => {
      const value = await StorageValue.fetch(avail.system.storage.EventCount, this.client.endpoint(), info.hash)
      const count = value
      if (count == null) {
        throw new NotFoundError("Failed to find EventCount storage", {
          operation: ErrorOperation.ChainBlockEventCount,
          details: { blockHash: info.hash.toString() },
        })
      }
      return count
    })
  }

  async blockWeight(at: BlockAt): Promise<PerDispatchClassWeight> {
    const info = await this.blockInfoFrom(at)
    return this.withRetry(async () => {
      const value = await StorageValue.fetch(avail.system.storage.BlockWeight, this.client.endpoint(), info.hash)
      const weight = value
      if (weight == null) {
        throw new NotFoundError("Failed to find BlockWeight storage", {
          operation: ErrorOperation.ChainBlockWeight,
          details: { blockHash: info.hash.toString() },
        })
      }
      return weight
    })
  }

  async info(): Promise<ChainInfo> {
    return this.withRetry(async () => await rpc.custom.chainInfo(this.client.endpoint()))
  }

  buildExtrinsicFromCall(call: ExtrinsicLike): SubmittableTransaction {
    return SubmittableTransaction.from(this.client, call)
  }

  async submit(tx: string | PolkadotExtrinsic | Uint8Array): Promise<H256> {
    return this.withRetry(async () => {
      const result = await this.client.api().rpc.author.submitExtrinsic(tx)
      return H256Model.from(result.toHex())
    })
  }

  async signAndSubmitPayload(
    signer: KeyringPair,
    payload: string | Uint8Array,
    options?: SignatureOptions,
  ): Promise<SubmittedTransaction> {
    return this.buildExtrinsicFromCall(payload).submitSigned(signer, options)
  }

  async signAndSubmitCall(
    signer: KeyringPair,
    call: ExtrinsicLike,
    options?: SignatureOptions,
  ): Promise<SubmittedTransaction> {
    return this.buildExtrinsicFromCall(call).submitSigned(signer, options)
  }

  async stateCall(method: string, data: string | Uint8Array, at?: HashLike): Promise<string> {
    return this.withRetry(async () => await rpc.state.call(this.client.endpoint(), method, data, at))
  }

  async stateGetMetadata(at?: H256): Promise<Uint8Array | null> {
    return this.withRetry(async () => await rpc.state.getMetadata(this.client.endpoint(), at))
  }

  async stateGetStorage(key: string, at?: H256): Promise<Uint8Array | null> {
    return this.withRetry(async () => await rpc.state.getStorage(this.client.endpoint(), key, at))
  }

  async stateGetKeysPaged(prefix: string | null, count: number, startKey: string | null, at?: H256): Promise<string[]> {
    return this.withRetry(async () => await rpc.state.getKeysPaged(this.client.endpoint(), prefix, count, startKey, at))
  }

  async rpcRawCall(method: string, params?: unknown): Promise<RpcResponse> {
    return this.withRetry(async () => await rpc.raw.rpcRawCall(this.client.endpoint(), method, params))
  }

  async runtimeApiRawCall(method: string, data: string | Uint8Array, at?: HashLike): Promise<string> {
    return this.withRetry(async () => await rpc.runtimeApi.runtimeApiRawCall(this.client.endpoint(), method, data, at))
  }

  async blockJustification(at: BlockAt): Promise<GrandpaJustification | null> {
    const height = await blockAtToHeight(this, at)
    if (height == null) {
      throw new NotFoundError("No block hash found for height", {
        operation: ErrorOperation.ChainBlockInfoFrom,
        details: { height: at },
      })
    }
    return await rpc.grandpa.blockJustificationJson(this.client.endpoint(), height)
  }

  async transactionPaymentQueryInfo(tx: string, at?: string): Promise<RuntimeDispatchInfo> {
    return this.withRetry(
      async () => await rpc.runtimeApi.TransactionPaymentApi_queryInfo(this.client.endpoint(), tx, at),
    )
  }

  async transactionPaymentQueryFeeDetails(tx: string, at?: string): Promise<FeeDetails> {
    return this.withRetry(
      async () => await rpc.runtimeApi.TransactionPaymentApi_queryFeeDetails(this.client.endpoint(), tx, at),
    )
  }

  async transactionPaymentQueryCallInfo(call: string, at?: string): Promise<RuntimeDispatchInfo> {
    return this.withRetry(
      async () => await rpc.runtimeApi.TransactionPaymentCallApi_queryCallInfo(this.client.endpoint(), call, at),
    )
  }

  async transactionPaymentQueryCallFeeDetails(call: string, at?: string): Promise<FeeDetails> {
    return this.withRetry(
      async () => await rpc.runtimeApi.TransactionPaymentCallApi_queryCallFeeDetails(this.client.endpoint(), call, at),
    )
  }

  async kateBlockLength(at?: HashLike): Promise<KateBlockLength> {
    return this.withRetry(async () => await rpc.kate.blockLength(this.client.endpoint(), at))
  }

  async kateQueryDataProof(dataIndex: number, at?: HashLike): Promise<ProofResponse> {
    const params = at == null ? [dataIndex] : [dataIndex, at.toString()]
    return this.withRetry(
      async () => (await rpc.raw.rpcCall(this.client.endpoint(), "kate_queryDataProof", params)) as ProofResponse,
    )
  }

  async kateQueryProof(cells: Array<{ row: number; col: number }>, at?: HashLike): Promise<GDataProof[]> {
    const params = at == null ? [cells] : [cells, at.toString()]
    return this.withRetry(
      async () => (await rpc.raw.rpcCall(this.client.endpoint(), "kate_queryProof", params)) as GDataProof[],
    )
  }

  async kateQueryRows(rows: number[], at?: HashLike): Promise<GRow[]> {
    const params = at == null ? [rows] : [rows, at.toString()]
    return this.withRetry(
      async () => (await rpc.raw.rpcCall(this.client.endpoint(), "kate_queryRows", params)) as GRow[],
    )
  }

  async kateQueryMultiProof(
    cells: Array<{ row: number; col: number }>,
    at?: HashLike,
  ): Promise<Array<[GMultiProof, GCellBlock]>> {
    const params = at == null ? [cells] : [cells, at.toString()]
    return this.withRetry(
      async () =>
        (await rpc.raw.rpcCall(this.client.endpoint(), "kate_queryMultiProof", params)) as Array<
          [GMultiProof, GCellBlock]
        >,
    )
  }

  async blobSubmitBlob(metadataSignedTransaction: Uint8Array, blob: Uint8Array): Promise<void> {
    return this.withRetry(async () => {
      await rpc.raw.rpcCall(this.client.endpoint(), "blob_submitBlob", [
        u8aToHex(metadataSignedTransaction),
        u8aToHex(blob),
      ])
    })
  }

  async blobGetBlob(blobHash: HashLike, blockHash?: HashLike): Promise<Blob> {
    const params = [blobHash.toString(), blockHash?.toString() ?? null]
    return this.withRetry(async () => (await rpc.raw.rpcCall(this.client.endpoint(), "blob_getBlob", params)) as Blob)
  }

  async blobGetBlobInfo(blobHash: HashLike): Promise<BlobInfo> {
    return this.withRetry(
      async () =>
        (await rpc.raw.rpcCall(this.client.endpoint(), "blob_getBlobInfo", [blobHash.toString()])) as BlobInfo,
    )
  }

  async blobInclusionProof(blobHash: HashLike, at?: HashLike): Promise<DataProof> {
    const params = at == null ? [blobHash.toString()] : [blobHash.toString(), at.toString()]
    return this.withRetry(
      async () => (await rpc.raw.rpcCall(this.client.endpoint(), "blob_inclusionProof", params)) as DataProof,
    )
  }

  async extrinsics(
    at: BlockAt,
    allowList: AllowedExtrinsic[] | null,
    sigFilter: SignatureFilter,
    dataFormat: DataFormat,
  ): Promise<ExtrinsicInfo[]> {
    return this.withRetry(
      async () => await rpc.custom.fetchExtrinsics(this.client.endpoint(), at, allowList, sigFilter, dataFormat),
    )
  }

  async events(at: BlockAt, allowList: AllowedEvents, fetchData: boolean): Promise<PhaseEvents[]> {
    return this.withRetry(async () => await rpc.custom.fetchEvents(this.client.endpoint(), at, allowList, fetchData))
  }

  async blockTimestamp(at: BlockAt): Promise<number> {
    return this.withRetry(async () => await rpc.custom.blockTimestamp(this.client.endpoint(), at))
  }

  shouldRetryOnError(): boolean {
    if (this.retryOnError === "inherit") {
      return this.client.retryPolicy() !== "disabled"
    }
    return this.retryOnError === "enabled"
  }
}
