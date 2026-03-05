import type { AccountId, H256, RefinedSignatureOptions } from "../core/types"
import { Duration, sleep } from "../core/utils"
import type { IHeaderAndDecodable } from "../core/interface"
import type { AllowedExtrinsic } from "../core/rpc/custom"
import type { BlockEvents, TypedExtrinsic, UntypedExtrinsic } from "../block/block"
import { Block } from "../block/block"
import { NotFoundError, TimeoutError, ValidationError } from "../errors/sdk-error"
import { ErrorOperation } from "../errors/operations"
import { BlockQueryMode, HashLike } from "../types"
import type { Client } from "../client/client"
import { Sub } from "../subscription/sub"

export interface WaitOptions {
  mode?: BlockQueryMode
  timeout?: Duration
  pollInterval?: Duration
}

export type FindReceiptOutcome = TransactionReceipt | "not_found" | "timed_out"
const DEFAULT_WAIT_MODE: BlockQueryMode = "finalized"
const DEFAULT_WAIT_TIMEOUT = Duration.fromSecs(180)

/**
 * Receipt for a transaction inclusion.
 */
export class TransactionReceipt {
  constructor(
    private readonly client: Client,
    readonly blockHash: H256,
    readonly blockHeight: number,
    readonly extHash: H256,
    readonly extIndex: number,
  ) {}

  async extrinsic<T>(as: IHeaderAndDecodable<T>): Promise<TypedExtrinsic<T>> {
    const ext = await new Block(this.client, this.blockHash).extrinsics().getAs(as, this.extIndex)
    if (ext == null) {
      throw new NotFoundError("Failed to find transaction", {
        operation: ErrorOperation.SubmissionReceiptRange,
        details: { blockHash: this.blockHash.toString(), extIndex: this.extIndex },
      })
    }
    return ext
  }

  async untyped_extrinsic(): Promise<UntypedExtrinsic> {
    const ext = await new Block(this.client, this.blockHash).extrinsics().get(this.extIndex)
    if (ext == null) {
      throw new NotFoundError("Failed to find extrinsic", {
        operation: ErrorOperation.SubmissionReceiptRange,
        details: { blockHash: this.blockHash.toString(), extIndex: this.extIndex },
      })
    }
    return ext
  }

  async timestamp(): Promise<number> {
    const block = this.client.block(this.blockHash)
    return await block.timestamp()
  }

  async events(): Promise<BlockEvents> {
    const block = this.client.block(this.blockHash).events()
    const events = await block.extrinsic(this.extIndex)
    if (events.isEmpty()) {
      throw new NotFoundError("No events found for the requested extrinsic", {
        operation: ErrorOperation.ReceiptEvents,
        details: { blockHash: this.blockHash.toString(), extIndex: this.extIndex },
      })
    }
    return events
  }

  /**
   * Searches an inclusive block range for a transaction hash.
   */
  static async fromRange(
    client: Client,
    extHash: HashLike,
    blockStart: number,
    blockEnd: number,
    options?: WaitOptions,
  ): Promise<TransactionReceipt | null> {
    if (blockStart > blockEnd) {
      throw new ValidationError("Block start cannot be after block end", {
        operation: ErrorOperation.SubmissionReceiptRange,
        details: { blockStart, blockEnd },
      })
    }

    const sub = Sub.fromClient(client)
    sub.withBlockQueryMode(options?.mode ?? DEFAULT_WAIT_MODE)
    sub.withStartHeight(blockStart)
    if (options?.pollInterval != null) {
      sub.withPollInterval(options.pollInterval)
    }

    while (true) {
      const blockInfo = await sub.next()
      const infos = await client.chain().extrinsics(blockInfo.hash, [{ TxHash: extHash.toString() }], {}, "None")

      if (infos.length > 0) {
        return new TransactionReceipt(client, blockInfo.hash, blockInfo.height, infos[0].extHash, infos[0].extIndex)
      }

      if (blockInfo.height >= blockEnd) {
        return null
      }
    }
  }
}

/**
 * Handle to an already-submitted transaction.
 */
export class SubmittedTransaction {
  constructor(
    private readonly client: Client,
    readonly extHash: H256,
    readonly accountId: AccountId,
    readonly signatureOptions: RefinedSignatureOptions,
  ) {}

  /**
   * Searches for a receipt inside the transaction mortality window.
   */
  async findReceipt(options?: WaitOptions): Promise<FindReceiptOutcome> {
    const resolved = resolveWaitOptions(options)
    return await findReceipt(
      this.client,
      this.extHash,
      this.signatureOptions.mortality.blockHeight,
      this.signatureOptions.mortality.blockHeight + this.signatureOptions.mortality.period,
      resolved,
    )
  }

  /**
   * Waits until the receipt is found or throws.
   */
  async receipt(options?: WaitOptions): Promise<TransactionReceipt> {
    const resolved = resolveWaitOptions(options)
    const outcome = await this.findReceipt(resolved)
    if (outcome !== "not_found" && outcome !== "timed_out") {
      return outcome
    }

    if (outcome === "timed_out") {
      throw new TimeoutError("Transaction receipt search timed out", {
        operation: ErrorOperation.SubmissionWaitForReceipt,
        details: {
          extHash: this.extHash.toString(),
          mode: resolved.mode,
          timeoutMs: resolved.timeout.value,
        },
      })
    }

    throw new NotFoundError("Transaction was not found in the search window", {
      operation: ErrorOperation.SubmissionWaitForReceipt,
      details: { extHash: this.extHash.toString(), mode: resolved.mode },
    })
  }

  /**
   * Waits for receipt and fetches emitted events.
   */
  async outcome(options?: WaitOptions): Promise<SubmissionOutcome> {
    const receipt = await this.receipt(options)
    const events = await receipt.events()
    return { submitted: this, receipt, events }
  }
}

async function findReceipt(
  client: Client,
  extHash: H256,
  fromBlockHeight: number,
  maxBlockHeight: number | null,
  opts: Required<WaitOptions>,
): Promise<FindReceiptOutcome> {
  const timeoutResult: FindReceiptOutcome = "timed_out"
  const result: FindReceiptOutcome = await Promise.race([
    findReceiptInner(client, extHash, fromBlockHeight, maxBlockHeight, opts),
    sleep(opts.timeout).then(() => timeoutResult),
  ])
  return result
}

async function findReceiptInner(
  client: Client,
  extHash: H256,
  fromBlockHeight: number,
  maxBlockHeight: number | null,
  opts: Required<WaitOptions>,
): Promise<FindReceiptOutcome> {
  const allowList: AllowedExtrinsic[] = [{ TxHash: extHash.toHex() }]
  const sub = await client.subscribe().raw().fromHeight(fromBlockHeight).mode(opts.mode).build()

  while (true) {
    const blockInfo = await sub.next()
    const ext = await client.chain().extrinsics(blockInfo.blockHash, allowList, {}, "None")
    if (ext.length > 0) {
      return new TransactionReceipt(client, blockInfo.blockHash, blockInfo.blockHeight, ext[0].extHash, ext[0].extIndex)
    }

    if (maxBlockHeight != null && blockInfo.blockHeight > maxBlockHeight) {
      return "not_found"
    }
  }
}

function resolveWaitOptions(value?: WaitOptions): Required<WaitOptions> {
  return {
    mode: value?.mode ?? DEFAULT_WAIT_MODE,
    timeout: value?.timeout ?? DEFAULT_WAIT_TIMEOUT,
    pollInterval: value?.pollInterval ?? Duration.fromSecs(3),
  }
}

export interface SubmissionOutcome {
  submitted: SubmittedTransaction
  receipt: TransactionReceipt
  events: BlockEvents
}
