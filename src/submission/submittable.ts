import { scaleEncodeHeaderAndEncodable, type IHeaderAndEncodable } from "../core/interface"
import type {
  FeeDetails,
  Mortality,
  RefinedSignatureOptions,
  RuntimeDispatchInfo,
  SignatureOptions,
} from "../core/types"
import { AccountId, H256 } from "../core/types"
import type { KeyringPair, PolkadotExtrinsic } from "../core/polkadot"
import { BN, GenericExtrinsic, u8aToHex } from "../core/polkadot"
import { hexDecode } from "../core/utils"
import type { Client } from "../client/client"
import { normalizeThrown } from "../internal/result/unwrap"
import { RetryPolicy } from "../types"
import { SubmittedTransaction, SubmissionOutcome } from "./submitted"
import type { WaitOptions } from "./submitted"
import { normalizeSignatureOptions, Options } from "./options"

type LegacyLikeSubmittable = { ext: { method: { toU8a(): Uint8Array } } }

/**
 * Mutable transaction builder for signing, submission, and fee queries.
 */
export class SubmittableTransaction {
  private retryOnError: RetryPolicy = "inherit"

  constructor(
    private readonly client: Client,
    readonly ext: GenericExtrinsic,
  ) {}

  /**
   * Normalizes supported call/extrinsic inputs into a submittable transaction.
   */
  static from(client: Client, value: ExtrinsicLike): SubmittableTransaction {
    if (value instanceof SubmittableTransaction) {
      return value
    }

    if (value instanceof GenericExtrinsic) {
      return new SubmittableTransaction(client, value)
    }

    const encoded = encodeTransactionCallLike(value)
    const wrappedCall = client.api().registry.createType("Call", encoded)
    const extrinsic = client.api().registry.createType("Extrinsic", { method: wrappedCall }) as GenericExtrinsic
    return new SubmittableTransaction(client, extrinsic)
  }

  /**
   * Sets retry policy for chain calls made by this builder.
   */
  withRetryPolicy(policy: RetryPolicy): SubmittableTransaction {
    this.retryOnError = policy
    return this
  }

  callHex(): string {
    return this.ext.method.hash.toHex()
  }

  callHash(): H256 {
    return H256.from(this.ext.method.hash.toHex())
  }

  async signOnly(signer: KeyringPair, options?: SignatureOptions | Options): Promise<PolkadotExtrinsic> {
    try {
      const accountId = AccountId.from(signer)
      const refinedOptions = await refineOptions(
        this.client,
        accountId,
        normalizeSignatureOptions(options),
        this.retryOnError,
      )
      return this.signWithRefined(signer, refinedOptions)
    } catch (error) {
      normalizeThrown(error)
    }
  }

  /**
   * Signs and submits this transaction.
   */
  async submit(signer: KeyringPair, options?: SignatureOptions | Options): Promise<SubmittedTransaction> {
    const accountId = AccountId.from(signer)
    const refinedOptions = await refineOptions(
      this.client,
      accountId,
      normalizeSignatureOptions(options),
      this.retryOnError,
    )
    const tx = this.signWithRefined(signer, refinedOptions)
    const extHash = await this.client.chain().retryPolicy(this.retryOnError, "inherit").submit(tx)

    return new SubmittedTransaction(this.client, extHash, accountId, refinedOptions)
  }

  private signWithRefined(signer: KeyringPair, refinedOptions: RefinedSignatureOptions): PolkadotExtrinsic {
    return this.ext.sign(signer, refinedOptions)
  }

  /**
   * Submits and waits for receipt plus events.
   */
  async submitAndWaitForOutcome(
    signer: KeyringPair,
    options?: SignatureOptions | Options,
    waitOptions?: WaitOptions,
  ): Promise<SubmissionOutcome> {
    const submitted = await this.submit(signer, options)
    return submitted.outcome(waitOptions)
  }

  /**
   * Submits and waits for a receipt.
   */
  async submitAndWaitForReceipt(signer: KeyringPair, options?: SignatureOptions | Options, waitOptions?: WaitOptions) {
    const submitted = await this.submit(signer, options)
    return submitted.receipt(waitOptions)
  }

  async estimateCallFees(at?: string): Promise<FeeDetails> {
    const call = u8aToHex(this.ext.method.toU8a())
    return await this.client
      .chain()
      .retryPolicy(this.retryOnError, "inherit")
      .transactionPaymentQueryCallFeeDetails(call, at)
  }

  /**
   * Alias for estimateCallFees.
   */
  async estimateFees(at?: string): Promise<FeeDetails> {
    return this.estimateCallFees(at)
  }

  async estimateExtrinsicFees(
    signer: KeyringPair,
    options?: SignatureOptions | Options,
    at?: string,
  ): Promise<FeeDetails> {
    const tx = await this.signOnly(signer, options)
    return await this.client
      .chain()
      .retryPolicy(this.retryOnError, "inherit")
      .transactionPaymentQueryFeeDetails(tx.toHex(), at)
  }

  async callInfo(at?: string): Promise<RuntimeDispatchInfo> {
    const call = u8aToHex(this.ext.method.toU8a())
    return await this.client.chain().retryPolicy(this.retryOnError, "inherit").transactionPaymentQueryCallInfo(call, at)
  }

  async extrinsicInfo(
    signer: KeyringPair,
    options?: SignatureOptions | Options,
    at?: string,
  ): Promise<RuntimeDispatchInfo> {
    const tx = await this.signOnly(signer, options)
    return await this.client
      .chain()
      .retryPolicy(this.retryOnError, "inherit")
      .transactionPaymentQueryInfo(tx.toHex(), at)
  }
}

async function refineOptions(
  client: Client,
  accountId: AccountId,
  rawOptions?: SignatureOptions,
  retryOnError: RetryPolicy = "inherit",
): Promise<RefinedSignatureOptions> {
  const options = rawOptions ?? {}

  const mortality = options.mortality ?? {
    ...(await defaultMortality(client, retryOnError)),
  }

  const blockHash = mortality.blockHash.toHex()
  const tip = options.tip ?? new BN("0")
  const app_id = options.app_id ?? 0
  const genesisHash = client.genesisHash().toHex()
  const runtimeVersion = client.runtimeVersion()
  const era = client.api().registry.createType("ExtrinsicEra", {
    current: mortality.blockHeight,
    period: mortality.period,
  })

  const nonce = options.nonce ?? (await client.chain().retryPolicy(retryOnError, "inherit").accountNonce(accountId))

  return {
    app_id,
    blockHash,
    genesisHash,
    mortality,
    nonce,
    runtimeVersion,
    tip,
    era,
  }
}

async function defaultMortality(client: Client, retryOnError: RetryPolicy): Promise<Mortality> {
  const finalized = await client.head("finalized").retryPolicy(retryOnError).blockInfo()
  return {
    blockHash: finalized.hash,
    blockHeight: finalized.height,
    period: 32,
  }
}

export type ExtrinsicLike = GenericExtrinsic | Uint8Array | SubmittableTransaction | string | IHeaderAndEncodable

export function encodeTransactionCallLike(value: ExtrinsicLike): Uint8Array {
  if (typeof value === "string") {
    value = hexDecode(value)
  } else if (value instanceof GenericExtrinsic) {
    value = value.method.toU8a()
  } else if (value instanceof SubmittableTransaction) {
    value = value.ext.method.toU8a()
  } else if (isLegacyLikeSubmittable(value)) {
    value = value.ext.method.toU8a()
  } else if ("palletId" in value) {
    value = scaleEncodeHeaderAndEncodable(value)
  }

  return value as Uint8Array
}

function isLegacyLikeSubmittable(value: unknown): value is LegacyLikeSubmittable {
  if (typeof value !== "object" || value == null || !("ext" in value)) {
    return false
  }
  const ext = (value as { ext?: unknown }).ext
  if (typeof ext !== "object" || ext == null || !("method" in ext)) {
    return false
  }
  const method = (ext as { method?: unknown }).method
  return typeof method === "object" && method != null && typeof (method as { toU8a?: unknown }).toU8a === "function"
}
