import type { Client } from "../client"
import type {
  AccountData,
  AccountInfoStruct,
  BlockState,
  FeeDetails,
  GrandpaJustification,
  RuntimeDispatchInfo,
  SessionKeys,
} from "../core/metadata"
import { AccountId, H256, AccountInfo } from "../core/metadata"
import { AvailError } from "../core/misc/error"
import { rpc } from "../core"
import type { AvailHeader } from "../core/misc/header"
import { Duration, sleep } from "../core/misc/utils"
import { log } from "../log"
import type { Index, PolkadotExtrinsic, SignedBlock } from "../core/misc/polkadot"
import type { BlockInfo, ChainInfo } from "../core/rpc/system/other"
import type { RpcResponse } from "../core/rpc/raw"

export class Chain {
  private client: Client
  private retryOnError: boolean | null = null
  private retryOnNone: boolean | null = null
  constructor(client: Client) {
    this.client = client
  }

  /// Lets you decide if upcoming calls retry on errors or missing data.
  ///
  /// - `error`: overrides whether transport errors are retried (defaults to the client's global flag).
  /// - `none`: when `true`, RPCs returning `null` (e.g., missing storage) will also be retried.
  retryOn(onError: boolean | null, onNone: boolean | null): Chain {
    this.retryOnError = onError
    this.retryOnNone = onNone
    return this
  }

  /// Fetches a block hash for the given height when available.
  ///
  /// # Returns
  /// - `H256` when the chain knows about the requested height.
  /// - `null` when the block does not exist
  /// - `AvailError` when the underlying RPC call fails.
  async blockHash(blockHeight?: number): Promise<H256 | null | AvailError> {
    const retryOnError = this.shouldRetryOnError()
    const retryOnNone = this.retryOnNone ?? false

    const op = () => rpc.chain.getBlockHash(this.client.endpoint, blockHeight)
    return await withRetryOnErrorAndNone(op, retryOnError, retryOnNone)
  }

  /// Grabs a block header by hash or height.
  ///
  /// # Returns
  /// - `AvailHeader` when the header exists.
  /// - `null` when the header is missing
  /// - `AvailError` when conversions or RPC calls fail.
  async blockHeader(at?: H256 | string | number): Promise<AvailHeader | null | AvailError> {
    const retryOnError = this.shouldRetryOnError()
    const retryOnNone = this.retryOnNone ?? false

    const blockHash = await to_block_hash(this, at)
    if (blockHash instanceof AvailError) return blockHash

    const op = () => rpc.chain.getHeader(this.client.endpoint, blockHash)
    const result = await withRetryOnErrorAndNone(op, retryOnError, retryOnNone)
    if (result instanceof AvailError || result == null) return result

    try {
      return this.client.api.registry.createType("Header", result) as AvailHeader
    } catch (e: any) {
      return new AvailError(e instanceof Error ? e.message : String(e))
    }
  }

  /// Retrieves the full legacy block
  ///
  /// # Returns
  /// - `SignedBlock` when the block exists.
  /// - `null` when the block is missing
  /// - `AvailError` when  RPC calls fail.
  async legacyBlock(at?: H256 | string): Promise<SignedBlock | null | AvailError> {
    const retryOnError = this.shouldRetryOnError()
    const retryOnNone = this.retryOnNone ?? false

    const op = () => rpc.chain.getBlock(this.client.endpoint, at === undefined ? at : at.toString())
    return await withRetryOnErrorAndNone(op, retryOnError, retryOnNone)
  }

  /// Looks up an account nonce at a particular block.
  ///
  /// # Errors
  /// Returns `Err(Error)` when the account id cannot be parsed or the RPC call fails.
  async blockNonce(accountId: AccountId | string, at: H256 | string | number): Promise<number | AvailError> {
    const result = await this.accountInfo(accountId, at)
    if (result instanceof AvailError) return result
    return result.nonce
  }

  /// Returns the latest account nonce as seen by the node.
  ///
  /// # Errors
  /// Returns `Err(Error)` when the account id cannot be parsed or the RPC call fails.
  async accountNonce(accountId: AccountId | string): Promise<number | AvailError> {
    const address = accountId instanceof AccountId ? accountId.toSS58() : accountId

    const op = async () => {
      try {
        const r = await this.client.api.rpc.system.accountNextIndex<Index>(address)
        return r.toNumber()
      } catch (e: any) {
        return new AvailError(e instanceof Error ? e.message : String(e))
      }
    }

    return await withRetryOnError(op, this.shouldRetryOnError())
  }

  /// Reports the free balance for an account at a specific block.
  ///
  /// Errors mirror [`Chain.account_info`].
  async accountBalance(accountId: AccountId | string, at: H256 | string | number): Promise<AccountData | AvailError> {
    const result = await this.accountInfo(accountId, at)
    if (result instanceof AvailError) return result
    return result.data
  }

  /// Fetches the full account record (nonce, balances, …) at a given block.
  ///
  /// # Errors
  /// Returns `Err(Error)` when the account identifier or block id cannot be converted, the block is
  /// missing, or the RPC call fails.
  async accountInfo(accountId: AccountId | string, at: H256 | string | number): Promise<AccountInfo | AvailError> {
    const retryOnError = this.shouldRetryOnError()
    const address = accountId instanceof AccountId ? accountId.toSS58() : accountId
    const blockHash = await to_block_hash(this, at)
    if (blockHash instanceof AvailError) return blockHash
    if (blockHash === undefined) return new AvailError("No block hash found for that block height")

    const op = async () => {
      try {
        const api = await this.client.api.at(blockHash)
        const struct = await api.query.system.account<AccountInfoStruct>(address)
        return new AccountInfo(
          struct.nonce.toNumber(),
          struct.consumers.toNumber(),
          struct.providers.toNumber(),
          struct.sufficients.toNumber(),
          struct.data,
        )
      } catch (e: any) {
        return new AvailError(e instanceof Error ? e.message : String(e))
      }
    }
    return await withRetryOnError(op, retryOnError)
  }

  /// Tells you if a block is pending, finalized, or missing.
  ///
  /// # Returns
  /// Distinguishes between "Included", "Finalized", "Discarded",
  /// and "DoesNotExist", depending on chain state.
  ///
  /// # Errors
  /// Returns `Err(Error)` if the supplied identifier cannot be converted or RPC calls fail.
  async blockState(blockId: H256 | string | number): Promise<BlockState | AvailError> {
    const blockId2 = to_hash_number(blockId)
    if (blockId2 instanceof AvailError) return blockId2

    const chainInfo = await this.chainInfo()
    if (chainInfo instanceof AvailError) return chainInfo

    let num = 0
    if (typeof blockId2 === "number") {
      num = blockId2
    }
    if (blockId2 instanceof H256) {
      const h = blockId2
      if (h.toHex() == chainInfo.finalizedHash.toHex()) return "Finalized"
      if (h.toHex() == chainInfo.bestHash.toHex()) return "Included"

      const n = await this.blockHeight(h)
      if (n instanceof AvailError) return n
      if (n == null) return "DoesNotExist"

      const blockHash = await this.blockHash(n)
      if (blockHash instanceof AvailError) return blockHash
      if (blockHash == null) return "DoesNotExist"
      if (blockHash.toString() != h.toString()) return "Discarded"

      num = n
    }

    if (num > chainInfo.bestHeight) return "DoesNotExist"
    if (num > chainInfo.finalizedHeight) return "Included"

    return "Finalized"
  }

  /// Converts a block hash into its block height when possible.
  ///
  /// # Returns
  /// - `number` when the block height exists.
  /// - `null` when the block height is missing
  /// - `AvailError` when  RPC calls fail.
  async blockHeight(at: H256 | string): Promise<number | null | AvailError> {
    const retryOnNone = this.retryOnNone ?? false
    const op = () => rpc.system.getBlockNumber(this.client.endpoint, at.toString())
    return await withRetryOnErrorAndNone(op, this.shouldRetryOnError(), retryOnNone)
  }

  /// Returns the latest block info, either best or finalized.
  async blockInfo(useBestBlock?: boolean): Promise<BlockInfo | AvailError> {
    const bestBlock = useBestBlock ?? false

    const op = () => rpc.system.latestBlockInfo(this.client.endpoint, bestBlock)
    return await withRetryOnError(op, this.shouldRetryOnError())
  }

  /// Quick snapshot of both the best and finalized heads.
  async chainInfo(): Promise<ChainInfo | AvailError> {
    const op = () => rpc.system.latestChainInfo(this.client.endpoint)
    return await withRetryOnError(op, this.shouldRetryOnError())
  }

  /// Submits a signed extrinsic and gives you the transaction hash.
  async submit(tx: string | PolkadotExtrinsic | Uint8Array): Promise<H256 | AvailError> {
    const op = () => this.client.api.rpc.author.submitExtrinsic(tx)
    const result = await withRetryOnError(op, this.shouldRetryOnError())
    if (result instanceof AvailError) return result

    return H256.from(result)
  }

  async stateCall(method: string, data: string | Uint8Array, at?: H256 | string): Promise<string | AvailError> {
    const op = () => rpc.state.call(this.client.endpoint, method, data, at)
    return await withRetryOnError(op, this.shouldRetryOnError())
  }

  async stateGetStorage(key: string, at?: H256): Promise<Uint8Array | null | AvailError> {
    const op = () => rpc.state.getStorage(this.client.endpoint, key, at)
    return await withRetryOnError(op, this.shouldRetryOnError())
  }

  async stateGetKeysPaged(
    prefix: string | null,
    count: number,
    startKey: string | null,
    at?: H256,
  ): Promise<string[] | AvailError> {
    const op = () => rpc.state.getKeysPaged(this.client.endpoint, prefix, count, startKey, at)
    return await withRetryOnError(op, this.shouldRetryOnError())
  }

  /// Performs a raw RPC invocation against the connected node
  async rpcRawCall(method: string, params?: any): Promise<RpcResponse | AvailError> {
    const op = () => rpc.rpcRawCall(this.client.endpoint, method, params)
    return await withRetryOnError(op, this.shouldRetryOnError())
  }

  /// Calls into the runtime API and decodes the answer for you.
  async runtimeApiRawCall(method: string, data: string | Uint8Array): Promise<string | AvailError> {
    const op = () => rpc.runtimeApiRawCall(this.client.endpoint, method, data)
    return await withRetryOnError(op, this.shouldRetryOnError())
  }

  /// Fetches GRANDPA justification for the given block number.
  ///
  /// # Returns
  /// - `GrandpaJustification` when a justification is present.
  /// - `null` when the runtime returns no justification.
  /// - `AvailError` if decoding the response or the RPC call fails.
  async grandpaBlockJustificationJson(blockHeight: number): Promise<GrandpaJustification | null | AvailError> {
    const op = () => rpc.grandpa.blockJustificationJson(this.client.endpoint, blockHeight)
    return await withRetryOnError(op, this.shouldRetryOnError())
  }

  async transactionPaymentQueryInfo(tx: string, at?: string): Promise<RuntimeDispatchInfo | AvailError> {
    const op = () => rpc.runtimeApi.TransactionPaymentApi_queryInfo(this.client.endpoint, tx, at)
    return await withRetryOnError(op, this.shouldRetryOnError())
  }

  async transactionPaymentQueryFeeDetails(tx: string, at?: string): Promise<FeeDetails | AvailError> {
    const op = () => rpc.runtimeApi.TransactionPaymentApi_queryFeeDetails(this.client.endpoint, tx, at)
    return await withRetryOnError(op, this.shouldRetryOnError())
  }

  async transactionPaymentQueryCallInfo(call: string, at?: string): Promise<RuntimeDispatchInfo | AvailError> {
    const op = () => rpc.runtimeApi.TransactionPaymentCallApi_queryCallInfo(this.client.endpoint, call, at)
    return await withRetryOnError(op, this.shouldRetryOnError())
  }

  async transactionPaymentQueryCallFeeDetails(call: string, at?: string): Promise<FeeDetails | AvailError> {
    const op = () => rpc.runtimeApi.TransactionPaymentCallApi_queryCallFeeDetails(this.client.endpoint, call, at)
    return await withRetryOnError(op, this.shouldRetryOnError())
  }

  async kateBlockLength(at?: H256 | string): Promise<rpc.kate.BlockLength | AvailError> {
    const op = () => rpc.kate.blockLength(this.client.endpoint, at)
    return await withRetryOnError(op, this.shouldRetryOnError())
  }

  /// Fetches extrinsics from a block using the provided filters.
  ///
  /// # Errors
  /// Returns `AvailError` when the block id cannot be decoded or the RPC request fails.
  async systemFetchExtrinsics(
    blockId: H256 | string | number,
    options?: rpc.system.fetchExtrinsics.Options,
  ): Promise<rpc.system.fetchExtrinsics.ExtrinsicInfo[] | AvailError> {
    const op = () => rpc.system.fetchExtrinsics.fetchExtrinsics(this.client.endpoint, blockId, options)
    return await withRetryOnError(op, this.shouldRetryOnError())
  }

  /// Pulls events for a block with optional filtering.
  ///
  /// # Errors
  /// Returns `AvailError` when the block id cannot be resolved or the RPC call fails.
  async systemFetchEvents(
    blockId: H256 | string | number,
    options?: rpc.system.fetchEvents.Options,
  ): Promise<rpc.system.fetchEvents.BlockPhaseEvent[] | AvailError> {
    const blockHash = await to_string_2(this, blockId)
    if (blockHash instanceof AvailError) return blockHash

    const op = () => rpc.system.fetchEvents.fetchEvents(this.client.endpoint, blockHash, options)
    return await withRetryOnError(op, this.shouldRetryOnError())
  }

  async rotateKeys(): Promise<SessionKeys | AvailError> {
    const op = () => rpc.author.rotateKeys(this.client.endpoint)
    return await withRetryOnError(op, this.shouldRetryOnError())
  }

  shouldRetryOnError(): boolean {
    return this.retryOnError ?? this.client.isGlobalRetiresEnabled()
  }
}

async function to_block_hash(rpc: Chain, value?: H256 | string | number): Promise<string | undefined | AvailError> {
  if (value === undefined) return value
  if (value instanceof H256) return value.toHex()
  if (typeof value === "string") return value

  const hash = await rpc.blockHash(value)
  if (hash instanceof AvailError) return hash
  if (hash == null) return new AvailError("Block Hash not found for that block height")
  return hash.toHex()
}

async function to_string(rpc: Chain, value?: H256 | string | number): Promise<string | undefined | AvailError> {
  if (value === undefined) return value
  if (value instanceof H256) return value.toHex()
  if (typeof value === "string") return value

  const hash = await rpc.blockHash(value)
  if (hash instanceof AvailError) return hash
  if (hash == null) return new AvailError("Block Hash not found for that block height")
  return hash.toHex()
}

async function to_string_2(rpc: Chain, value: H256 | string | number): Promise<string | AvailError> {
  if (value instanceof H256) return value.toHex()
  if (typeof value === "string") return value

  const hash = await rpc.blockHash(value)
  if (hash instanceof AvailError) return hash
  if (hash == null) return new AvailError("Block Hash not found for that block height")
  return hash.toHex()
}

function to_hash_number(value: H256 | string | number): H256 | number | AvailError {
  if (typeof value === "number") return value
  return H256.from(value)
}

function warnAboutRetry(reason: string, duration: Duration, retriesRemaining: number) {
  const sleepSeconds = duration.value / 1000
  const retryText =
    retriesRemaining === 0
      ? "no retries remaining"
      : `${retriesRemaining} ${retriesRemaining === 1 ? "retry" : "retries"} remaining`
  log.warn(`Retry scheduled in ${sleepSeconds}s (${retryText}) due to ${reason}`)
}

export async function withRetryOnError<T>(op: () => Promise<T | AvailError>, retry: boolean): Promise<T | AvailError> {
  const durations = [8, 5, 3, 2, 1].map((x) => Duration.fromSecs(x))

  while (true) {
    let result
    try {
      result = await op()
    } catch (e: any) {
      result = new AvailError(e instanceof Error ? e.message : String(e))
    }
    if (!(result instanceof AvailError)) return result
    if (retry == false || durations.length == 0) return result

    const duration = durations.pop()!
    warnAboutRetry(`AvailError: ${result.toString()}`, duration, durations.length)
    await sleep(duration)
  }
}

export async function withRetryOnErrorAndNone<T>(
  op: () => Promise<T | null | AvailError>,
  onError: boolean,
  onNone: boolean,
): Promise<T | null | AvailError> {
  const durations = [8, 5, 3, 2, 1].map((x) => Duration.fromSecs(x))

  while (true) {
    let result
    try {
      result = await op()
    } catch (e: any) {
      result = new AvailError(e instanceof Error ? e.message : String(e))
    }
    if (result instanceof AvailError) {
      if (onError == false || durations.length == 0) return result
      const duration = durations.pop()!
      warnAboutRetry(`AvailError: ${result.toString()}`, duration, durations.length)
      await sleep(duration)
      continue
    }

    if (result == null) {
      if (onNone == false || durations.length == 0) return result
      const duration = durations.pop()!
      warnAboutRetry("operation returned null", duration, durations.length)
      await sleep(duration)
      continue
    }

    return result
  }
}
