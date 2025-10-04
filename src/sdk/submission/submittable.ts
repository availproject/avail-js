import type { Client } from "../client"
import { rpc } from "../core"
import type { IHeaderAndEncodable } from "../core/interface"
import { ICall } from "../core/interface"
import type {
  FeeDetails,
  H256,
  Mortality,
  RefinedSignatureOptions,
  RuntimeDispatchInfo,
  SignatureOptions,
} from "../core/metadata"
import { AccountId } from "../core/metadata"
import { AvailError } from "../core/misc/error"
import { BN, GenericExtrinsic, KeyringPair, type PolkadotExtrinsic, u8aToHex } from "../core/misc/polkadot"
import { hexDecode } from "../core/misc/utils"
import { SubmittedTransaction } from "./submitted"

export class SubmittableTransaction {
  private client: Client
  public call: GenericExtrinsic
  private retryOnError: boolean | null = null

  constructor(client: Client, call: GenericExtrinsic) {
    this.client = client
    this.call = call
  }

  // Sign
  async sign(signer: KeyringPair, options?: SignatureOptions): Promise<PolkadotExtrinsic | AvailError> {
    const retry = this.retryOnError ?? this.client.isGlobalRetiresEnabled()

    const accountId = AccountId.from(signer)
    const refinedOptions = await refineOptions(this.client, accountId, options, retry)
    if (refinedOptions instanceof AvailError) return refinedOptions

    return this.call.sign(signer, refinedOptions)
  }

  async signAndSubmit(signer: KeyringPair, options?: SignatureOptions): Promise<SubmittedTransaction | AvailError> {
    const retry = this.retryOnError ?? this.client.isGlobalRetiresEnabled()

    const accountId = AccountId.from(signer)
    const refinedOptions = await refineOptions(this.client, accountId, options, retry)
    if (refinedOptions instanceof AvailError) return refinedOptions

    const signedTransaction = this.call.sign(signer, refinedOptions)
    if (signedTransaction instanceof AvailError) return signedTransaction

    const hash = await this.client.chain().retryOn(retry, null).submitExtrinsic(signedTransaction)
    if (hash instanceof AvailError) return hash

    return new SubmittedTransaction(this.client, hash, accountId, refinedOptions)
  }

  static from(client: Client, value: ExtrinsicLike): SubmittableTransaction {
    if (value instanceof GenericExtrinsic) {
      return new SubmittableTransaction(client, value)
    } else if (value instanceof SubmittableTransaction) {
      return value
    }

    const encoded = encodeTransactionCallLike(value)
    const wrappedCall = client.api.registry.createType("Call", encoded)
    const gExtrinsic = client.api.registry.createType("Extrinsic", { method: wrappedCall }) as GenericExtrinsic

    return new SubmittableTransaction(client, gExtrinsic)
  }

  async estimateCallFees(at?: H256 | string): Promise<FeeDetails | AvailError> {
    const blockHash = at?.toString()
    const call = u8aToHex(this.call.method.toU8a())
    return rpc.runtimeApi.TransactionPaymentCallApi_queryCallFeeDetails(this.client.endpoint, call, blockHash)
  }

  async queryCallInfo(at?: H256 | string): Promise<RuntimeDispatchInfo | AvailError> {
    const blockHash = at?.toString()
    const call = u8aToHex(this.call.method.toU8a())
    return rpc.runtimeApi.TransactionPaymentCallApi_queryCallInfo(this.client.endpoint, call, blockHash)
  }

  async queryExtrinsicInfo(
    signer: KeyringPair,
    options: SignatureOptions,
    at?: H256 | string,
  ): Promise<RuntimeDispatchInfo | AvailError> {
    const tx = await this.sign(signer, options)
    if (tx instanceof AvailError) return tx

    const blockHash = at?.toString()
    return rpc.runtimeApi.TransactionPaymentApi_queryInfo(this.client.endpoint, tx.toHex(), blockHash)
  }

  async estimateExtrinsicFees(
    signer: KeyringPair,
    options: SignatureOptions,
    at?: H256 | string,
  ): Promise<FeeDetails | AvailError> {
    const tx = await this.sign(signer, options)
    if (tx instanceof AvailError) return tx

    const blockHash = at?.toString()
    return rpc.runtimeApi.TransactionPaymentApi_queryFeeDetails(this.client.endpoint, tx.toHex(), blockHash)
  }

  callToHex(): string {
    return this.call.toHex()
  }
}

async function refineOptions(
  client: Client,
  accountId: AccountId,
  rawOptions?: SignatureOptions,
  retryOnError: boolean = true,
): Promise<RefinedSignatureOptions | AvailError> {
  rawOptions ??= {}

  let mortality: Mortality
  if (rawOptions.mortality != null) {
    mortality = rawOptions.mortality
  } else {
    const ref = await client.finalized().blockInfo()
    if (ref instanceof AvailError) return ref

    const period = 32
    mortality = { blockHash: ref.hash, blockHeight: ref.height, period } satisfies Mortality
  }
  const blockHash = mortality.blockHash.toHex()
  const tip = rawOptions.tip ?? new BN("0")
  const app_id = rawOptions.app_id ?? 0
  const genesisHash = client.genesisHash().toHex()
  const runtimeVersion = client.runtimeVersion()
  const era = client.api.registry.createType("ExtrinsicEra", {
    current: mortality.blockHeight,
    period: mortality.period,
  })

  let nonce: number
  if (rawOptions.nonce != undefined) {
    nonce = rawOptions.nonce
  } else {
    const result = await client.chain().retryOn(retryOnError, null).accountNonce(accountId)
    if (result instanceof AvailError) return result

    nonce = result
  }

  return {
    app_id,
    blockHash,
    genesisHash,
    mortality,
    nonce,
    runtimeVersion,
    tip,
    era,
  } satisfies RefinedSignatureOptions
}

export type ExtrinsicLike = GenericExtrinsic | Uint8Array | SubmittableTransaction | string | IHeaderAndEncodable
export function encodeTransactionCallLike(value: ExtrinsicLike): Uint8Array {
  if (typeof value === "string") {
    const array = hexDecode(value)
    if (array instanceof AvailError) throw array
    value = array
  } else if (value instanceof GenericExtrinsic) {
    value = value.method.toU8a()
  } else if (value instanceof SubmittableTransaction) {
    value = value.call.method.toU8a()
  } else if ("palletId" in value) {
    value = ICall.encode(value)
  }

  return value
}
