import type { Client } from "../client"
import type { IHeaderAndEncodable } from "../core/interface"
import { ICall } from "../core/interface"
import {
  FeeDetails,
  H256,
  Mortality,
  RefinedSignatureOptions,
  RuntimeDispatchInfo,
  SignatureOptions,
} from "../core/metadata"
import { AccountId } from "../core/metadata"
import { AvailError } from "../core/error"
import { BN, GenericExtrinsic, KeyringPair, type PolkadotExtrinsic, u8aToHex } from "../core/polkadot"
import { hexDecode } from "../core/utils"
import { SubmittedTransaction } from "./submitted"

/**
 * Represents a transaction that can be signed and submitted to the Avail blockchain.
 *
 * @remarks
 * The SubmittableTransaction class provides methods for signing transactions, estimating fees,
 * and submitting transactions to the blockchain. It wraps a generic extrinsic and provides
 * convenient interfaces for transaction management and fee estimation.
 *
 * @example
 * ```ts
 * import { Keyring } from "@polkadot/keyring";
 * import { avail } from "@avail-js/sdk";
 *
 * const client = await Client.create("ws://127.0.0.1:9944");
 * if (!(client instanceof AvailError)) {
 *   const keyring = new Keyring({ type: "sr25519" });
 *   const alice = keyring.addFromUri("//Alice");
 *
 *   // Create a submittable transaction
 *   const call = avail.balances.tx.TransferKeepAlive.create("Bob", 1000000);
 *   const tx = SubmittableTransaction.from(client, call);
 *
 *   // Sign and submit the transaction
 *   const submitted = await tx.signAndSubmit(alice);
 * }
 * ```
 *
 * @public
 */
export class SubmittableTransaction {
  private client: Client
  public ext: GenericExtrinsic
  private retryOnError: boolean | null = null

  constructor(client: Client, ext: GenericExtrinsic) {
    this.client = client
    this.ext = ext
  }

  /**
   * Signs the transaction using the provided keypair.
   *
   * @param signer - The KeyringPair to sign the transaction with.
   * @param options - Optional signature options including nonce, app_id, tip, and mortality.
   * @returns A Promise resolving to the signed PolkadotExtrinsic or an AvailError on failure.
   *
   * @remarks
   * This method signs the transaction without submitting it to the blockchain. The signed
   * extrinsic can be stored, transmitted, or submitted later. If nonce is not provided in
   * options, it will be automatically fetched from the chain.
   *
   * @example
   * ```ts
   * import { Keyring } from "@polkadot/keyring";
   * import { avail } from "@avail-js/sdk";
   *
   * const client = await Client.create("ws://127.0.0.1:9944");
   * if (!(client instanceof AvailError)) {
   *   const keyring = new Keyring({ type: "sr25519" });
   *   const alice = keyring.addFromUri("//Alice");
   *
   *   const call = avail.balances.tx.TransferKeepAlive.create("Bob", 1000000);
   *   const tx = SubmittableTransaction.from(client, call);
   *
   *   // Sign the transaction with custom options
   *   const signed = await tx.sign(alice, { app_id: 1, tip: new BN("100") });
   *   if (!(signed instanceof AvailError)) {
   *     console.log("Transaction signed:", signed.toHex());
   *   }
   * }
   * ```
   *
   * @public
   */
  async sign(signer: KeyringPair, options?: SignatureOptions): Promise<PolkadotExtrinsic | AvailError> {
    const retry = this.retryOnError ?? this.client.isGlobalRetiresEnabled()

    const accountId = AccountId.from(signer)
    const refinedOptions = await refineOptions(this.client, accountId, options, retry)
    if (refinedOptions instanceof AvailError) return refinedOptions

    return this.ext.sign(signer, refinedOptions)
  }

  /**
   * Signs and submits the transaction to the blockchain in a single operation.
   *
   * @param signer - The KeyringPair to sign the transaction with.
   * @param options - Optional signature options including nonce, app_id, tip, and mortality.
   * @returns A Promise resolving to a SubmittedTransaction for tracking the transaction status or an AvailError on failure.
   *
   * @remarks
   * This is a convenience method that combines signing and submission. The returned
   * SubmittedTransaction can be used to wait for transaction inclusion and retrieve receipts.
   * If nonce is not provided, it will be automatically fetched from the chain.
   *
   * @example
   * ```ts
   * import { Keyring } from "@polkadot/keyring";
   * import { avail } from "@avail-js/sdk";
   *
   * const client = await Client.create("ws://127.0.0.1:9944");
   * if (!(client instanceof AvailError)) {
   *   const keyring = new Keyring({ type: "sr25519" });
   *   const alice = keyring.addFromUri("//Alice");
   *
   *   const call = avail.balances.tx.TransferKeepAlive.create("Bob", 1000000);
   *   const tx = SubmittableTransaction.from(client, call);
   *
   *   // Sign and submit in one step
   *   const submitted = await tx.signAndSubmit(alice, { app_id: 1 });
   *   if (!(submitted instanceof AvailError)) {
   *     console.log("Transaction hash:", submitted.extHash.toString());
   *
   *     // Wait for transaction receipt
   *     const receipt = await submitted.receipt();
   *     if (receipt && !(receipt instanceof AvailError)) {
   *       console.log("Transaction included in block:", receipt.blockHeight);
   *     }
   *   }
   * }
   * ```
   *
   * @public
   */
  async signAndSubmit(signer: KeyringPair, options?: SignatureOptions): Promise<SubmittedTransaction | AvailError> {
    const retry = this.retryOnError ?? this.client.isGlobalRetiresEnabled()

    const accountId = AccountId.from(signer)
    const refinedOptions = await refineOptions(this.client, accountId, options, retry)
    if (refinedOptions instanceof AvailError) return refinedOptions

    const signedTransaction = this.ext.sign(signer, refinedOptions)
    if (signedTransaction instanceof AvailError) return signedTransaction

    const hash = await this.client.chain().retryOn(retry, null).submit(signedTransaction)
    if (hash instanceof AvailError) return hash

    return new SubmittedTransaction(this.client, hash, accountId, refinedOptions)
  }

  /**
   * Creates a SubmittableTransaction from various extrinsic-like values.
   *
   * @param client - The Client instance to use for the transaction.
   * @param value - An extrinsic-like value which can be a GenericExtrinsic, SubmittableTransaction, Uint8Array, hex string, or IHeaderAndEncodable.
   * @returns A new SubmittableTransaction instance.
   *
   * @remarks
   * This factory method provides a flexible way to create SubmittableTransaction instances
   * from various input types. It handles encoding and wrapping of transaction calls automatically.
   *
   * @example
   * ```ts
   * import { Keyring } from "@polkadot/keyring";
   * import { avail } from "@avail-js/sdk";
   *
   * const client = await Client.create("ws://127.0.0.1:9944");
   * if (!(client instanceof AvailError)) {
   *   // Create from a transaction call
   *   const call = avail.balances.tx.TransferKeepAlive.create("Bob", 1000000);
   *   const tx1 = SubmittableTransaction.from(client, call);
   *
   *   // Create from a hex-encoded extrinsic
   *   const hexTx = "0x1d010c616263";
   *   const tx2 = SubmittableTransaction.from(client, hexTx);
   *
   *   // Create from raw bytes
   *   const bytes = new Uint8Array([0x1d, 0x01, 0x0c, 0x61, 0x62, 0x63]);
   *   const tx3 = SubmittableTransaction.from(client, bytes);
   * }
   * ```
   *
   * @public
   */
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

  /**
   * Estimates the fees for the transaction call without signing.
   *
   * @param at - Optional block hash or hex string to query fees at a specific block. Defaults to the latest block.
   * @returns A Promise resolving to FeeDetails containing inclusion fee and other fee information, or an AvailError on failure.
   *
   * @remarks
   * This method estimates fees for the unsigned call data only. For more accurate fee estimates
   * that include signature overhead, use {@link estimateExtrinsicFees} instead. The fee estimation
   * is performed at the specified block or the latest block if not specified.
   *
   * @example
   * ```ts
   * import { avail } from "@avail-js/sdk";
   *
   * const client = await Client.create("ws://127.0.0.1:9944");
   * if (!(client instanceof AvailError)) {
   *   const call = avail.balances.tx.TransferKeepAlive.create("Bob", 1000000);
   *   const tx = SubmittableTransaction.from(client, call);
   *
   *   // Estimate fees for the call
   *   const fees = await tx.estimateCallFees();
   *   if (!(fees instanceof AvailError)) {
   *     console.log("Base fee:", fees.inclusionFee?.baseFee.toString());
   *     console.log("Length fee:", fees.inclusionFee?.lenFee.toString());
   *     console.log("Adjusted weight fee:", fees.inclusionFee?.adjustedWeightFee.toString());
   *   }
   * }
   * ```
   *
   * @public
   */
  async estimateCallFees(at?: H256 | string): Promise<FeeDetails | AvailError> {
    const call = u8aToHex(this.ext.method.toU8a())
    return await this.client
      .chain()
      .retryOn(this.retryOnError, null)
      .transactionPaymentQueryCallFeeDetails(call, at?.toString())
  }

  /**
   * Estimates the fees for the fully signed extrinsic.
   *
   * @param signer - The KeyringPair to sign the transaction with for fee estimation.
   * @param options - Optional signature options including nonce, app_id, tip, and mortality.
   * @param at - Optional block hash or hex string to query fees at a specific block. Defaults to the latest block.
   * @returns A Promise resolving to FeeDetails containing inclusion fee and other fee information, or an AvailError on failure.
   *
   * @remarks
   * This method provides a more accurate fee estimate than {@link estimateCallFees} because it
   * includes the overhead of the signature and other extrinsic metadata. The transaction is
   * signed temporarily for estimation purposes only and not submitted to the chain.
   *
   * @example
   * ```ts
   * import { Keyring } from "@polkadot/keyring";
   * import { avail } from "@avail-js/sdk";
   *
   * const client = await Client.create("ws://127.0.0.1:9944");
   * if (!(client instanceof AvailError)) {
   *   const keyring = new Keyring({ type: "sr25519" });
   *   const alice = keyring.addFromUri("//Alice");
   *
   *   const call = avail.balances.tx.TransferKeepAlive.create("Bob", 1000000);
   *   const tx = SubmittableTransaction.from(client, call);
   *
   *   // Estimate fees for the signed extrinsic
   *   const fees = await tx.estimateExtrinsicFees(alice, { app_id: 1 });
   *   if (!(fees instanceof AvailError)) {
   *     const totalFee = fees.inclusionFee?.baseFee
   *       .add(fees.inclusionFee.lenFee)
   *       .add(fees.inclusionFee.adjustedWeightFee);
   *     console.log("Total estimated fee:", totalFee?.toString());
   *   }
   * }
   * ```
   *
   * @public
   */
  async estimateExtrinsicFees(
    signer: KeyringPair,
    options?: SignatureOptions,
    at?: H256 | string,
  ): Promise<FeeDetails | AvailError> {
    const tx = await this.sign(signer, options)
    if (tx instanceof AvailError) return tx

    return await this.client
      .chain()
      .retryOn(this.retryOnError, null)
      .transactionPaymentQueryFeeDetails(tx.toHex(), at?.toString())
  }

  /**
   * Retrieves runtime dispatch information for the transaction call.
   *
   * @param at - Optional block hash or hex string to query information at a specific block. Defaults to the latest block.
   * @returns A Promise resolving to RuntimeDispatchInfo containing weight and fee information, or an AvailError on failure.
   *
   * @remarks
   * This method provides detailed dispatch information including the computational weight
   * and partial fee for the unsigned call. For information about a signed extrinsic,
   * use {@link extrinsicInfo} instead.
   *
   * @example
   * ```ts
   * import { avail } from "@avail-js/sdk";
   *
   * const client = await Client.create("ws://127.0.0.1:9944");
   * if (!(client instanceof AvailError)) {
   *   const call = avail.balances.tx.TransferKeepAlive.create("Bob", 1000000);
   *   const tx = SubmittableTransaction.from(client, call);
   *
   *   // Get runtime dispatch info for the call
   *   const info = await tx.callInfo();
   *   if (!(info instanceof AvailError)) {
   *     console.log("Weight:", info.weight.refTime.toString());
   *     console.log("Partial fee:", info.partialFee.toString());
   *     console.log("Class:", info.class.toString());
   *   }
   * }
   * ```
   *
   * @public
   */
  async callInfo(at?: H256 | string): Promise<RuntimeDispatchInfo | AvailError> {
    const call = u8aToHex(this.ext.method.toU8a())
    return await this.client
      .chain()
      .retryOn(this.retryOnError, null)
      .transactionPaymentQueryCallInfo(call, at?.toString())
  }

  /**
   * Retrieves runtime dispatch information for the fully signed extrinsic.
   *
   * @param signer - The KeyringPair to sign the transaction with for information retrieval.
   * @param options - Optional signature options including nonce, app_id, tip, and mortality.
   * @param at - Optional block hash or hex string to query information at a specific block. Defaults to the latest block.
   * @returns A Promise resolving to RuntimeDispatchInfo containing weight and fee information, or an AvailError on failure.
   *
   * @remarks
   * This method provides more accurate dispatch information than {@link callInfo} because it
   * includes the overhead of the signature and other extrinsic metadata. The transaction is
   * signed temporarily for information retrieval only and not submitted to the chain.
   *
   * @example
   * ```ts
   * import { Keyring } from "@polkadot/keyring";
   * import { avail } from "@avail-js/sdk";
   *
   * const client = await Client.create("ws://127.0.0.1:9944");
   * if (!(client instanceof AvailError)) {
   *   const keyring = new Keyring({ type: "sr25519" });
   *   const alice = keyring.addFromUri("//Alice");
   *
   *   const call = avail.balances.tx.TransferKeepAlive.create("Bob", 1000000);
   *   const tx = SubmittableTransaction.from(client, call);
   *
   *   // Get runtime dispatch info for the signed extrinsic
   *   const info = await tx.extrinsicInfo(alice, { app_id: 1 });
   *   if (!(info instanceof AvailError)) {
   *     console.log("Weight:", info.weight.refTime.toString());
   *     console.log("Partial fee:", info.partialFee.toString());
   *     console.log("Dispatch class:", info.class.toString());
   *   }
   * }
   * ```
   *
   * @public
   */
  async extrinsicInfo(
    signer: KeyringPair,
    options?: SignatureOptions,
    at?: H256 | string,
  ): Promise<RuntimeDispatchInfo | AvailError> {
    const tx = await this.sign(signer, options)
    if (tx instanceof AvailError) return tx

    return await this.client
      .chain()
      .retryOn(this.retryOnError, null)
      .transactionPaymentQueryInfo(tx.toHex(), at?.toString())
  }

  /**
   * Retrieves the hexadecimal representation of the transaction call hash.
   *
   * @returns The hex-encoded hash of the transaction call.
   *
   * @remarks
   * This method returns the hash of the call data as a hex string. The hash is computed
   * from the encoded transaction method without signature information.
   *
   * @example
   * ```ts
   * import { avail } from "@avail-js/sdk";
   *
   * const client = await Client.create("ws://127.0.0.1:9944");
   * if (!(client instanceof AvailError)) {
   *   const call = avail.balances.tx.TransferKeepAlive.create("Bob", 1000000);
   *   const tx = SubmittableTransaction.from(client, call);
   *
   *   const hash = tx.callHex();
   *   console.log("Call hash (hex):", hash);
   * }
   * ```
   *
   * @public
   */
  callHex(): string {
    return this.ext.method.hash.toHex()
  }

  /**
   * Retrieves the transaction call hash as an H256 instance.
   *
   * @returns The call hash as an H256 object, or a default H256 if hash creation fails.
   *
   * @remarks
   * This method returns the hash of the call data as an H256 type, which is useful for
   * programmatic hash comparisons and storage. The hash is computed from the encoded
   * transaction method without signature information. If conversion fails, a default
   * H256 (zero hash) is returned.
   *
   * @example
   * ```ts
   * import { avail } from "@avail-js/sdk";
   *
   * const client = await Client.create("ws://127.0.0.1:9944");
   * if (!(client instanceof AvailError)) {
   *   const call = avail.balances.tx.TransferKeepAlive.create("Bob", 1000000);
   *   const tx = SubmittableTransaction.from(client, call);
   *
   *   const hash = tx.callHash();
   *   console.log("Call hash:", hash.toString());
   *
   *   // Use the hash for comparisons
   *   const anotherHash = tx.callHash();
   *   if (hash.eq(anotherHash)) {
   *     console.log("Hashes match");
   *   }
   * }
   * ```
   *
   * @public
   */
  callHash(): H256 {
    const hash = H256.from(this.ext.method.hash.toHex())
    if (hash instanceof AvailError) return H256.default()
    return hash
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
    value = value.ext.method.toU8a()
  } else if ("palletId" in value) {
    value = ICall.encode(value)
  }

  return value
}
