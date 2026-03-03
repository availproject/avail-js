import { AccountId, AccountInfo as AccountInfoModel, H256 as H256Model } from "../core/metadata"
import {
  type AccountData,
  type GrandpaJustification,
  type PerDispatchClassWeight,
  type AccountInfo,
  type AccountInfoStruct,
  type BlockInfo,
  type BlockState,
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
import { RetryPolicy } from "../types"
import { executeWithRetry } from "../internal/retry/execute"
import {
  normalizeThrown,
  unwrapAvail as unwrapLegacy,
  unwrapAvailNullable as unwrapLegacyNullable,
} from "../internal/result/unwrap"
import { NotFoundError } from "../errors/sdk-error"
import { ErrorOperation } from "../errors/operations"

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
  private retryOnError: RetryPolicy = RetryPolicy.Inherit
  private retryOnNone: RetryPolicy = RetryPolicy.Inherit

  constructor(private readonly client: Client) { }

  /**
   * Sets retry policies for RPC errors and `null` responses.
   */
  retryPolicy(errorPolicy: RetryPolicy, nonePolicy: RetryPolicy): Chain {
    this.retryOnError = errorPolicy
    this.retryOnNone = nonePolicy
    return this
  }

  private inheritedRetryEnabled(): boolean {
    return this.client.retryPolicy() !== RetryPolicy.Disabled
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
      if (blockHeight == null) {
        const header = await this.client.api().rpc.chain.getHeader()
        return unwrapLegacy(H256Model.from(header.hash.toHex()))
      }

      const hash = await this.client.api().rpc.chain.getBlockHash(blockHeight)
      const asHex = hash.toHex()
      if (asHex === "0x") {
        return null
      }

      return unwrapLegacy(H256Model.from(asHex))
    })
  }

  async blockHashByHeight(blockHeight: number): Promise<H256 | null> {
    return this.blockHash(blockHeight)
  }

  /**
   * Returns block header for hash/height, or current head header when omitted.
   */
  async blockHeader(at?: H256 | string | number): Promise<AvailHeader | null> {
    return this.withRetry(async () => {
      let hash: string | undefined
      if (typeof at === "number") {
        const resolved = await this.blockHash(at)
        if (resolved == null) {
          return null
        }
        hash = resolved.toString()
      } else if (at != null) {
        hash = at.toString()
      }

      const header = await this.client.api().rpc.chain.getHeader(hash)
      if (header == null) {
        return null
      }

      return header as unknown as AvailHeader
    })
  }

  async blockHeaderByHash(hash: H256 | string): Promise<AvailHeader | null> {
    return this.blockHeader(hash)
  }

  async blockHeaderByHeight(height: number): Promise<AvailHeader | null> {
    return this.blockHeader(height)
  }

  async signedBlock(at?: H256 | string): Promise<SignedBlock | null> {
    return this.withRetry(async () => {
      const block = await this.client.api().rpc.chain.getBlock(at?.toString())
      return (block ?? null) as SignedBlock | null
    })
  }

  async legacyBlock(at?: H256 | string): Promise<SignedBlock | null> {
    return this.signedBlock(at)
  }

  async blockEventsEncoded(at: H256 | string): Promise<EncodedLegacyEvent[]> {
    return this.withRetry(async () => {
      const grouped = unwrapLegacy(await rpc.custom.fetchEvents(this.client.endpoint(), at, "All", true))

      return grouped.flatMap((entry) =>
        entry.events.map((event) => ({
          phase: entry.phase,
          index: event.index,
          palletId: event.palletId,
          variantId: event.variantId,
          encodedData: event.data,
        })),
      )
    })
  }

  async blockHeight(at: H256 | string): Promise<number | null> {
    return this.withRetry(async () => unwrapLegacyNullable(await rpc.custom.blockNumber(this.client.endpoint(), at)))
  }

  async chainInfo(): Promise<ChainInfo> {
    return this.withRetry(async () => unwrapLegacy(await rpc.custom.chainInfo(this.client.endpoint())))
  }

  async accountNonce(accountId: AccountId | string): Promise<number> {
    const address = typeof accountId === "string" ? accountId : accountId.toSS58()
    return this.withRetry(async () => {
      const nonce = await this.client.api().rpc.system.accountNextIndex(address)
      return nonce.toNumber()
    })
  }

  async accountInfo(accountId: AccountId | string, at: H256 | string | number): Promise<AccountInfo> {
    const address = typeof accountId === "string" ? accountId : accountId.toSS58()
    const blockHash = await this.blockHash(typeof at === "number" ? at : undefined)
    const atHash = typeof at === "number" ? blockHash?.toString() : at.toString()

    if (atHash == null) {
      throw new NotFoundError("Could not resolve block hash for accountInfo query", {
        operation: ErrorOperation.ChainAccountInfo,
        details: { accountId: address, at: at.toString() },
      })
    }

    return this.withRetry(async () => {
      const apiAt = await this.client.api().at(atHash)
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

  async blockNonce(accountId: AccountId | string, at: H256 | string | number): Promise<number> {
    const info = await this.accountInfo(accountId, at)
    return info.nonce
  }

  async accountBalance(accountId: AccountId | string, at: H256 | string | number): Promise<AccountData> {
    const info = await this.accountInfo(accountId, at)
    return info.data
  }

  async blockInfo(useBestBlock = false): Promise<BlockInfo> {
    const info = await this.chainInfo()
    return useBestBlock
      ? { hash: info.bestHash, height: info.bestHeight }
      : { hash: info.finalizedHash, height: info.finalizedHeight }
  }

  async blockInfoFrom(at: H256 | string | number): Promise<BlockInfo> {
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

    const hash = typeof at === "string" ? unwrapLegacy(H256Model.from(at)) : at
    const height = await this.blockHeight(hash)
    if (height == null) {
      throw new NotFoundError("No block height found for hash", {
        operation: ErrorOperation.ChainBlockInfoFrom,
        details: { hash: hash.toString() },
      })
    }

    return { hash, height }
  }

  async blockTimestamp(at: H256 | string | number): Promise<number> {
    return this.withRetry(async () => unwrapLegacy(await rpc.custom.blockTimestamp(this.client.endpoint(), at)))
  }

  async blockAuthor(at: H256 | string | number): Promise<AccountId> {
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

  async blockAuthorByHash(hash: H256 | string): Promise<AccountId> {
    return this.blockAuthor(hash)
  }

  async blockAuthorByHeight(height: number): Promise<AccountId> {
    return this.blockAuthor(height)
  }

  async blockEventCount(at: H256 | string | number): Promise<number> {
    const info = await this.blockInfoFrom(at)
    return this.withRetry(async () => {
      const value = await StorageValue.fetch(avail.system.storage.EventCount, this.client.endpoint(), info.hash)
      const count = unwrapLegacyNullable(value)
      if (count == null) {
        throw new NotFoundError("Failed to find EventCount storage", {
          operation: ErrorOperation.ChainBlockEventCount,
          details: { blockHash: info.hash.toString() },
        })
      }
      return count
    })
  }

  async blockWeight(at: H256 | string | number): Promise<PerDispatchClassWeight> {
    const info = await this.blockInfoFrom(at)
    return this.withRetry(async () => {
      const value = await StorageValue.fetch(avail.system.storage.BlockWeight, this.client.endpoint(), info.hash)
      const weight = unwrapLegacyNullable(value)
      if (weight == null) {
        throw new NotFoundError("Failed to find BlockWeight storage", {
          operation: ErrorOperation.ChainBlockWeight,
          details: { blockHash: info.hash.toString() },
        })
      }
      return weight
    })
  }

  async stateCall(method: string, data: string | Uint8Array, at?: H256 | string): Promise<string> {
    return this.withRetry(async () => unwrapLegacy(await rpc.state.call(this.client.endpoint(), method, data, at)))
  }

  async stateGetMetadata(at?: H256): Promise<Uint8Array | null> {
    return this.withRetry(async () => unwrapLegacyNullable(await rpc.state.getMetadata(this.client.endpoint(), at)))
  }

  async blockMetadata(at?: H256): Promise<Uint8Array | null> {
    return this.stateGetMetadata(at)
  }

  async stateGetStorage(key: string, at?: H256): Promise<Uint8Array | null> {
    return this.withRetry(async () => unwrapLegacyNullable(await rpc.state.getStorage(this.client.endpoint(), key, at)))
  }

  async stateGetKeysPaged(prefix: string | null, count: number, startKey: string | null, at?: H256): Promise<string[]> {
    return this.withRetry(async () =>
      unwrapLegacy(await rpc.state.getKeysPaged(this.client.endpoint(), prefix, count, startKey, at)),
    )
  }

  async rpcRawCall(method: string, params?: unknown): Promise<RpcResponse> {
    return this.withRetry(async () => unwrapLegacy(await rpc.raw.rpcRawCall(this.client.endpoint(), method, params)))
  }

  async runtimeApiRawCall(method: string, data: string | Uint8Array, at?: H256 | string): Promise<string> {
    return this.withRetry(async () =>
      unwrapLegacy(await rpc.runtimeApi.runtimeApiRawCall(this.client.endpoint(), method, data, at)),
    )
  }

  async blockJustification(at: H256 | string | number): Promise<GrandpaJustification | null> {
    const info = await this.blockInfoFrom(at)
    return this.grandpaBlockJustificationJson(info.height)
  }

  async kateBlockLength(at?: H256 | string): Promise<KateBlockLength> {
    return this.withRetry(async () => unwrapLegacy(await rpc.kate.blockLength(this.client.endpoint(), at)))
  }

  async kateQueryDataProof(dataIndex: number, at?: H256 | string): Promise<ProofResponse> {
    const params = at == null ? [dataIndex] : [dataIndex, at.toString()]
    return this.withRetry(
      async () =>
        unwrapLegacy(await rpc.raw.rpcCall(this.client.endpoint(), "kate_queryDataProof", params)) as ProofResponse,
    )
  }

  async kateQueryProof(cells: Array<{ row: number; col: number }>, at?: H256 | string): Promise<GDataProof[]> {
    const params = at == null ? [cells] : [cells, at.toString()]
    return this.withRetry(
      async () =>
        unwrapLegacy(await rpc.raw.rpcCall(this.client.endpoint(), "kate_queryProof", params)) as GDataProof[],
    )
  }

  async kateQueryRows(rows: number[], at?: H256 | string): Promise<GRow[]> {
    const params = at == null ? [rows] : [rows, at.toString()]
    return this.withRetry(
      async () => unwrapLegacy(await rpc.raw.rpcCall(this.client.endpoint(), "kate_queryRows", params)) as GRow[],
    )
  }

  async kateQueryMultiProof(
    cells: Array<{ row: number; col: number }>,
    at?: H256 | string,
  ): Promise<Array<[GMultiProof, GCellBlock]>> {
    const params = at == null ? [cells] : [cells, at.toString()]
    return this.withRetry(
      async () =>
        unwrapLegacy(await rpc.raw.rpcCall(this.client.endpoint(), "kate_queryMultiProof", params)) as Array<
          [GMultiProof, GCellBlock]
        >,
    )
  }

  async blobSubmitBlob(metadataSignedTransaction: Uint8Array, blob: Uint8Array): Promise<void> {
    return this.withRetry(async () => {
      unwrapLegacy(
        await rpc.raw.rpcCall(this.client.endpoint(), "blob_submitBlob", [
          u8aToHex(metadataSignedTransaction),
          u8aToHex(blob),
        ]),
      )
    })
  }

  async blobGetBlob(blobHash: H256 | string, blockHash?: H256 | string): Promise<Blob> {
    const params = [blobHash.toString(), blockHash?.toString() ?? null]
    return this.withRetry(
      async () => unwrapLegacy(await rpc.raw.rpcCall(this.client.endpoint(), "blob_getBlob", params)) as Blob,
    )
  }

  async blobGetBlobInfo(blobHash: H256 | string): Promise<BlobInfo> {
    return this.withRetry(
      async () =>
        unwrapLegacy(
          await rpc.raw.rpcCall(this.client.endpoint(), "blob_getBlobInfo", [blobHash.toString()]),
        ) as BlobInfo,
    )
  }

  async blobInclusionProof(blobHash: H256 | string, at?: H256 | string): Promise<DataProof> {
    const params = at == null ? [blobHash.toString()] : [blobHash.toString(), at.toString()]
    return this.withRetry(
      async () =>
        unwrapLegacy(await rpc.raw.rpcCall(this.client.endpoint(), "blob_inclusionProof", params)) as DataProof,
    )
  }

  async fetchExtrinsics(
    at: H256 | string | number,
    allowList: AllowedExtrinsic[] | null,
    sigFilter: SignatureFilter,
    dataFormat: DataFormat,
  ): Promise<ExtrinsicInfo[]> {
    return this.withRetry(async () =>
      unwrapLegacy(await rpc.custom.fetchExtrinsics(this.client.endpoint(), at, allowList, sigFilter, dataFormat)),
    )
  }

  async fetchEvents(at: H256 | string | number, allowList: AllowedEvents, fetchData: boolean): Promise<PhaseEvents[]> {
    return this.withRetry(async () =>
      unwrapLegacy(await rpc.custom.fetchEvents(this.client.endpoint(), at, allowList, fetchData)),
    )
  }

  async blockState(at: H256 | string | number): Promise<BlockState> {
    const chainInfo = await this.chainInfo()

    let height = 0
    if (typeof at === "number") {
      height = at
    } else {
      const hash = at.toString()
      if (hash === chainInfo.finalizedHash.toString()) return "Finalized"
      if (hash === chainInfo.bestHash.toString()) return "Included"

      const resolvedHeight = await this.blockHeight(hash)
      if (resolvedHeight == null) return "DoesNotExist"

      const canonicalHash = await this.blockHash(resolvedHeight)
      if (canonicalHash == null) return "DoesNotExist"
      if (canonicalHash.toString() !== hash) return "Discarded"

      height = resolvedHeight
    }

    if (height > chainInfo.bestHeight) return "DoesNotExist"
    if (height > chainInfo.finalizedHeight) return "Included"
    return "Finalized"
  }

  async grandpaBlockJustificationJson(height: number) {
    return unwrapLegacyNullable(await rpc.grandpa.blockJustificationJson(this.client.endpoint(), height))
  }

  async submit(tx: string | PolkadotExtrinsic | Uint8Array): Promise<H256> {
    return this.withRetry(async () => {
      const result = await this.client.api().rpc.author.submitExtrinsic(tx)
      return unwrapLegacy(H256Model.from(result.toHex()))
    })
  }

  buildExtrinsicFromCall(call: ExtrinsicLike): SubmittableTransaction {
    return SubmittableTransaction.from(this.client, call)
  }

  async signAndSubmitCall(
    signer: KeyringPair,
    call: ExtrinsicLike,
    options?: SignatureOptions,
  ): Promise<SubmittedTransaction> {
    return this.buildExtrinsicFromCall(call).submitSigned(signer, options)
  }

  async signAndSubmitPayload(
    signer: KeyringPair,
    payload: string | Uint8Array,
    options?: SignatureOptions,
  ): Promise<SubmittedTransaction> {
    return this.buildExtrinsicFromCall(payload).submitSigned(signer, options)
  }

  async transactionPaymentQueryInfo(tx: string, at?: string): Promise<RuntimeDispatchInfo> {
    return this.withRetry(async () =>
      unwrapLegacy(await rpc.runtimeApi.TransactionPaymentApi_queryInfo(this.client.endpoint(), tx, at)),
    )
  }

  async transactionPaymentQueryFeeDetails(tx: string, at?: string): Promise<FeeDetails> {
    return this.withRetry(async () =>
      unwrapLegacy(await rpc.runtimeApi.TransactionPaymentApi_queryFeeDetails(this.client.endpoint(), tx, at)),
    )
  }

  async transactionPaymentQueryCallInfo(call: string, at?: string): Promise<RuntimeDispatchInfo> {
    return this.withRetry(async () =>
      unwrapLegacy(await rpc.runtimeApi.TransactionPaymentCallApi_queryCallInfo(this.client.endpoint(), call, at)),
    )
  }

  async transactionPaymentQueryCallFeeDetails(call: string, at?: string): Promise<FeeDetails> {
    return this.withRetry(async () =>
      unwrapLegacy(
        await rpc.runtimeApi.TransactionPaymentCallApi_queryCallFeeDetails(this.client.endpoint(), call, at),
      ),
    )
  }

  shouldRetryOnError(): boolean {
    if (this.retryOnError === RetryPolicy.Inherit) {
      return this.client.retryPolicy() !== RetryPolicy.Disabled
    }
    return this.retryOnError === RetryPolicy.Enabled
  }
}
