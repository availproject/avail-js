import type { AccountId, BlockInfo, H256, RefinedSignatureOptions } from "../core/metadata"
import type { Duration } from "../core/utils"
import type { IHeaderAndDecodable } from "../core/interface"
import type { PhaseEvents } from "../core/rpc/custom"
import type { BlockEvents, TypedBlockExtrinsic, UntypedBlockExtrinsic } from "../block/block"
import { Block } from "../block/block"
import { NotFoundError, ValidationError } from "../errors/sdk-error"
import { ErrorOperation } from "../errors/operations"
import { BlockQueryMode, HashLike } from "../types"
import type { Client } from "../client/client"
import { Sub } from "../subscription/sub"

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

  async extrinsic<T>(as: IHeaderAndDecodable<T>): Promise<TypedBlockExtrinsic<T>> {
    const ext = await new Block(this.client, this.blockHash).extrinsics().getAs(as, this.extIndex)
    if (ext == null) {
      throw new NotFoundError("Failed to find transaction", {
        operation: ErrorOperation.SubmissionReceiptRange,
        details: { blockHash: this.blockHash.toString(), extIndex: this.extIndex },
      })
    }
    return ext
  }

  async untyped_extrinsic(): Promise<UntypedBlockExtrinsic> {
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
    options?: { pollRate?: Duration; mode?: BlockQueryMode },
  ): Promise<TransactionReceipt | null> {
    if (blockStart > blockEnd) {
      throw new ValidationError("Block start cannot be after block end", {
        operation: ErrorOperation.SubmissionReceiptRange,
        details: { blockStart, blockEnd },
      })
    }

    const sub = Sub.fromClient(client)
    sub.withBlockQueryMode(options?.mode ?? "finalized")
    sub.withStartHeight(blockStart)
    if (options?.pollRate != null) {
      sub.withPollInterval(options.pollRate)
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
  async find_receipt(
    mode: BlockQueryMode = "finalized",
    options?: { pollInterval?: Duration },
  ): Promise<TransactionReceipt | null> {
    const pollRate = options?.pollInterval
    const blockInfo = await findCorrectBlockInfo(
      this.client,
      this.signatureOptions.nonce,
      this.accountId,
      this.extHash,
      this.signatureOptions.mortality,
      mode,
      pollRate,
    )
    if (blockInfo == null) return null

    const infos = await this.client
      .chain()
      .extrinsics(blockInfo.hash, [{ TxHash: this.extHash.toString() }], {}, "None")
    if (infos.length === 0) return null

    return new TransactionReceipt(this.client, blockInfo.hash, blockInfo.height, infos[0].extHash, infos[0].extIndex)
  }

  /**
   * Waits until the receipt is found or throws.
   */
  async receipt(mode: BlockQueryMode = "finalized"): Promise<TransactionReceipt> {
    const receipt = await this.find_receipt(mode)
    if (receipt == null) {
      throw new NotFoundError("Transaction was not found in the search window", {
        operation: ErrorOperation.SubmissionWaitForReceipt,
        details: { extHash: this.extHash.toString(), mode },
      })
    }
    return receipt
  }

  /**
   * Waits for receipt and fetches emitted events.
   */
  async outcome(mode: BlockQueryMode = "finalized"): Promise<SubmissionOutcome> {
    const receipt = await this.receipt(mode)
    const events = await receipt.events()
    return { submitted: this, receipt, events }
  }
}

async function findCorrectBlockInfo(
  client: Client,
  nonce: number,
  accountId: AccountId,
  extHash: H256,
  mortality: RefinedSignatureOptions["mortality"],
  mode: BlockQueryMode,
  pollRate?: Duration,
): Promise<BlockInfo | null> {
  const mortalityEnds = mortality.blockHeight + mortality.period
  let currentBlockHeight = mortality.blockHeight

  const sub = Sub.fromClient(client)
  sub.withStartHeight(currentBlockHeight)
  sub.withBlockQueryMode(mode)
  if (pollRate != null) {
    sub.withPollInterval(pollRate)
  }

  while (mortalityEnds >= currentBlockHeight) {
    const blockInfo = await sub.next()
    currentBlockHeight = blockInfo.height

    const stateNonce = await client.chain().blockNonce(accountId, blockInfo.hash)
    if (stateNonce > nonce) return blockInfo

    if (stateNonce === 0) {
      const infos = await client.chain().extrinsics(blockInfo.hash, [{ TxHash: extHash.toString() }], {}, "None")

      if (infos.length > 0) return blockInfo
    }
  }

  return null
}

export interface SubmissionOutcome {
  submitted: SubmittedTransaction
  receipt: TransactionReceipt
  events: BlockEvents
}
