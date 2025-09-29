import { Client, core, AvailError } from "../."
import {
  TransactionPaymentApi_queryFeeDetails,
  TransactionPaymentApi_queryInfo,
  TransactionPaymentCallApi_queryCallFeeDetails,
  TransactionPaymentCallApi_queryCallInfo,
} from "../rpc/runtime_api"
import {
  AccountId,
  FeeDetails,
  Mortality,
  RefinedSignatureOptions,
  RuntimeDispatchInfo,
  SignatureOptions,
} from "../types/metadata"
import { BN, PolkadotExtrinsic, GenericExtrinsic, KeyringPair } from "../types/polkadot"
import { Hex } from "../utils"
import { SubmittedTransaction } from "./submitted"
import { encodeTransactionCallLike, TransactionCallLike } from "./transaction_call"

export class SubmittableTransaction {
  private client: Client
  public call: GenericExtrinsic

  constructor(client: Client, call: GenericExtrinsic) {
    this.client = client
    this.call = call
  }

  // Sign and/or Submit
  public sign(signer: KeyringPair, options: RefinedSignatureOptions): PolkadotExtrinsic {
    return this.call.sign(signer, options)
  }

  async signAndSubmit(
    signer: KeyringPair,
    options?: SignatureOptions,
    retryOnError: boolean = true,
  ): Promise<SubmittedTransaction | AvailError> {
    const accountId = AccountId.from(signer)
    const refinedOptions = await refineOptions(this.client, accountId, options, retryOnError)
    if (refinedOptions instanceof AvailError) return refinedOptions

    const signedTransaction = this.sign(signer, refinedOptions)
    const hash = await this.client.submit(signedTransaction, retryOnError)
    if (hash instanceof AvailError) return hash

    return new SubmittedTransaction(this.client, hash, accountId, refinedOptions)
  }

  static from(client: Client, value: TransactionCallLike): SubmittableTransaction {
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
    const call = Hex.encode(this.call.method.toU8a())
    return TransactionPaymentCallApi_queryCallFeeDetails(this.client, call, blockHash)
  }

  async queryCallInfo(at?: H256 | string): Promise<RuntimeDispatchInfo | AvailError> {
    const blockHash = at?.toString()
    const call = Hex.encode(this.call.method.toU8a())
    return TransactionPaymentCallApi_queryCallInfo(this.client, call, blockHash)
  }

  async queryExtrinsicInfo(
    signer: KeyringPair,
    options: SignatureOptions,
    at?: H256 | string,
  ): Promise<RuntimeDispatchInfo | AvailError> {
    const accountId = AccountId.from(signer)
    const refinedOptions = await refineOptions(this.client, accountId, options)
    if (refinedOptions instanceof AvailError) return refinedOptions

    const tx = this.sign(signer, refinedOptions)
    const blockHash = at?.toString()
    return TransactionPaymentApi_queryInfo(this.client, tx.toHex(), blockHash)
  }

  async estimateExtrinsicFees(
    signer: KeyringPair,
    options: SignatureOptions,
    at?: H256 | string,
  ): Promise<FeeDetails | AvailError> {
    const accountId = AccountId.from(signer)
    const refinedOptions = await refineOptions(this.client, accountId, options)
    if (refinedOptions instanceof AvailError) return refinedOptions

    const tx = this.sign(signer, refinedOptions)
    const blockHash = at?.toString()
    return TransactionPaymentApi_queryFeeDetails(this.client, tx.toHex(), blockHash)
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
    const ref = await client.finalized.blockInfo()
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
    const result = await client.nonce(accountId, retryOnError)
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

export type ExtrinsicLike =
  | core.types.polkadot.GenericExtrinsic
  | Uint8Array
  | SubmittableTransaction
  | string
  | IHeaderAndEncodable
export function encodeTransactionCallLike(value: ExtrinsicLike): Uint8Array {
  if (typeof value === "string") {
    const array = core.Hex.decode(value)
    if (array instanceof AvailError) throw array
    value = array
  } else if (value instanceof core.types.polkadot.GenericExtrinsic) {
    value = value.method.toU8a()
  } else if (value instanceof SubmittableTransaction) {
    value = value.call.method.toU8a()
  } else if ("palletId" in value) {
    value = ICall.encode(value)
  }

  return value
}
