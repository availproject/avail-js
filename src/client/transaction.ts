import { Client } from "./clients";
import { AccountId, BlockLocation, H256, TransactionLocation, KeyringPair, BN, Mortality, SignatureOptions, RefinedOptions } from "../core/index";
import { Extrinsic } from "@polkadot/types/interfaces"
import { SignatureFilterOptions } from "./clients/block_client";
import { AnyU8a } from "@polkadot/types-codec/types";
import { GenericExtrinsic } from "@polkadot/types";

export const BLOCK_STATE_INCLUDED: number = 0
export const BLOCK_STATE_FINALIZED: number = 1
export const BLOCK_STATE_DISCARDED: number = 2
export const BLOCK_STATE_DOES_NOT_EXIST: number = 3

export class SubmittableTransaction {
  private client: Client
  public call: AnyU8a

  constructor(client: Client, call: AnyU8a) {
    this.client = client
    this.call = call;
  }

  // Sign and/or Submit
  public sign(signer: KeyringPair, options: RefinedOptions): Extrinsic {
    const extrinsic = new GenericExtrinsic(this.client.api.registry, this.call)
    return extrinsic.sign(signer, options)
  }

  public async signAndSubmit(signer: KeyringPair, options: SignatureOptions): Promise<SubmittedTransaction> {
    const accountId = AccountId.fromSS58(signer.address)
    const refinedOptions = await refineOptions(this.client, accountId, options)

    const signedTransaction = this.sign(signer, refinedOptions)
    const hash = await this.client.submit(signedTransaction)

    return new SubmittedTransaction(this.client, hash, accountId, refinedOptions)
  }
}

async function refineOptions(client: Client, accountId: AccountId, rawOptions: SignatureOptions): Promise<RefinedOptions> {
  let mortality: Mortality;
  if (rawOptions.mortality != null) {
    mortality = rawOptions.mortality
  } else {
    const blockHeight = await client.finalizedBlockHeight()
    const blockHash = await client.blockHash(blockHeight)
    const period = 32
    mortality = { blockHash, blockHeight, period } satisfies Mortality
  }
  const blockHash = mortality.blockHash.toHex()
  const nonce = rawOptions.nonce ?? await client.nonce(accountId)
  const tip = rawOptions.tip ?? new BN("0")
  const app_id = rawOptions.app_id ?? 0
  const genesisHash = client.genesisHash().toHex()
  const runtimeVersion = client.runtimeVersion()
  const era = client.api.registry.createType("ExtrinsicEra", { current: mortality.blockHeight, period: mortality.period });

  return { app_id, blockHash, genesisHash, mortality, nonce, runtimeVersion, tip, era } satisfies RefinedOptions
}

export class SubmittedTransaction {
  private client: Client
  public txHash: H256
  public accountId: AccountId
  public options: RefinedOptions

  constructor(client: Client, txHash: H256, accountId: AccountId, options: RefinedOptions) {
    this.client = client
    this.txHash = txHash
    this.accountId = accountId
    this.options = options
  }

  public async receipt(useBestBlock: boolean): Promise<TransactionReceipt | null> {
    return await transactionReceipt(this.client, this.txHash, this.options.nonce, this.accountId, this.options.mortality, useBestBlock)
  }
}

export class TransactionReceipt {
  private client: Client
  public blockLoc: BlockLocation
  public txLoc: TransactionLocation

  constructor(client: Client, blockLoc: BlockLocation, txLoc: TransactionLocation) {
    this.client = client
    this.blockLoc = blockLoc
    this.txLoc = txLoc
  }
}

export async function transactionReceipt(client: Client, txHash: H256, nonce: number, accountId: AccountId, mortality: Mortality, useBestBlock: boolean): Promise<TransactionReceipt | null> {
  const blockLoc = await findBlockLocViaNonce(client, nonce, accountId, mortality, useBestBlock)
  if (blockLoc == null) {
    console.log("Error 0")
    return null;
  }

  const blockClient = client.blockClient()

  const signatureFilter = { ss58_address: accountId.toSS58(), nonce: nonce } satisfies SignatureFilterOptions
  const some = await blockClient.blockTransaction(blockLoc.hash, txHash, signatureFilter, "Call")

  return null;
}

async function findBlockLocViaNonce(client: Client, nonce: number, accountId: AccountId, mortality: Mortality, _useBestBlock: boolean): Promise<BlockLocation | null> {
  const mortalityEnds = mortality.blockHeight + mortality.period;
  let nextBlockHeight = mortality.blockHeight += 1;

  while (nextBlockHeight <= mortalityEnds) {
    const finalizedHeight = await client.finalizedBlockHeight()
    if (nextBlockHeight > finalizedHeight) {
      await sleep(500)
      continue
    }

    const blockHash = await client.blockHash(nextBlockHeight)
    const stateNonce = await client.blockNonce(accountId, blockHash)
    if (stateNonce > nonce) {
      const blockLoc = { hash: blockHash, height: nextBlockHeight } satisfies BlockLocation
      return blockLoc
    }

    nextBlockHeight += 1
  }

  return null;
}


function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
