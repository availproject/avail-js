import { ApiPromise } from "@polkadot/api"
import { ISubmittableResult } from "@polkadot/types/types/extrinsic"
import { EventRecord, H256, InclusionFee } from "@polkadot/types/interfaces/types"
import { err, ok, Result } from "neverthrow"
import { ApiTypes, SubmittableExtrinsic, SubmittablePaymentResult } from "@polkadot/api/types"
import { Block, BN, KeyringPair } from ".."
import { GenericExtrinsic } from "@polkadot/types"
import { Events, CallData, utils } from "./."
import * as account from "./account"

export enum WaitFor {
  BlockInclusion,
  BlockFinalization,
}

export async function signAndSendTransaction(
  api: ApiPromise,
  tx: SubmittableExtrinsic<"promise">,
  account: KeyringPair,
  waitFor: WaitFor,
  options?: TransactionOptions,
): Promise<TransactionResult> {
  const optionWrapper = options || {}

  const maybeTxResult = await new Promise<Result<ISubmittableResult, string>>((res, _) => {
    tx.signAndSend(account, optionWrapper, (result: ISubmittableResult) => {
      if (result.isError || (result.isInBlock && waitFor == WaitFor.BlockInclusion) || result.isFinalized) {
        res(ok(result))
      }
    }).catch((reason) => {
      res(err(reason))
    })
  })

  if (maybeTxResult.isErr()) return new TransactionResult(api, err(maybeTxResult.error))
  const maybeParsed = await parseTransactionResult(api, maybeTxResult.value)
  if (maybeParsed.isErr()) return new TransactionResult(api, err(maybeParsed.error))

  return new TransactionResult(api, ok(maybeParsed.value))
}

export interface TransactionOptions {
  app_id?: number
  nonce?: number
  tip?: BN
  era?: number
  blockHash?: H256
}

export class TransactionResult {
  constructor(
    public api: ApiPromise,
    public details: Result<TransactionDetails, string>,
  ) {}

  isError(): boolean {
    return this.details.isErr()
  }

  isFailure(): boolean {
    if (this.details.isOk()) {
      return this.details.value.isError(this.api) == null
    }
    return true
  }

  throwOnError(): TransactionDetails {
    if (this.details.isErr()) throw Error(this.details.error)

    return this.details.value
  }

  throwOnFault(): TransactionDetails {
    const details = this.throwOnError()
    const resultError = details.isError(this.api)
    if (resultError) throw Error(resultError)

    return details
  }
}

export class TransactionDetails {
  constructor(
    public txResult: ISubmittableResult,
    public events: EventRecord[],
    public txHash: H256,
    public txIndex: number,
    public blockHash: H256,
    public blockNumber: number,
  ) {}

  async fetchBlock(api: ApiPromise): Promise<Block> {
    return await Block.New(api, this.blockHash)
  }

  async fetchGenericTransaction(api: ApiPromise): Promise<GenericExtrinsic | undefined> {
    const block = await Block.New(api, this.blockHash)
    return block.transactionByIndex(this.txIndex)
  }

  findFirstEvent<T>(c: { decode(arg0: EventRecord): T | null }): T | null {
    return Events.findFirstEvent(c, this.events)
  }

  findLastEvent<T>(c: { decode(arg0: EventRecord): T | null }): T | null {
    return Events.findLastEvent(c, this.events)
  }

  findEvent<T>(c: { decode(arg0: EventRecord): T | null }): T[] {
    return Events.findEvent(c, this.events)
  }

  async getCallData<T>(api: ApiPromise, c: { decode(arg0: GenericExtrinsic): T | null }): Promise<T | null> {
    const tx = await this.fetchGenericTransaction(api)
    return tx ? CallData.getCallData(tx, c) : null
  }

  isError(api: ApiPromise): string | null {
    return utils.findAndDecodeError(api, this.events)
  }

  printDebug() {
    console.log(
      `TransactionDetails {\n  txResult: {...}\n  events: ${this.events.toString()}\n  txHash: ${this.txHash.toHuman()}\n  txIndex: ${this.txIndex.toString()}\n  blockHash: ${this.blockHash.toHuman()}\n  blockNumber: ${this.blockNumber.toString()}\n}`,
    )
  }
}

export class Transaction {
  private api: ApiPromise
  private tx: SubmittableExtrinsic<"promise">

  constructor(api: ApiPromise, tx: SubmittableExtrinsic<"promise">) {
    this.api = api
    this.tx = tx
  }

  async executeWaitForInclusion(account: KeyringPair, options?: TransactionOptions): Promise<TransactionResult> {
    return await this.executeAndWatch(WaitFor.BlockInclusion, account, options)
  }

  async executeWaitForFinalization(account: KeyringPair, options?: TransactionOptions): Promise<TransactionResult> {
    return await this.executeAndWatch(WaitFor.BlockFinalization, account, options)
  }

  async executeAndWatch(
    waitFor: WaitFor,
    account: KeyringPair,
    options?: TransactionOptions,
  ): Promise<TransactionResult> {
    return await signAndSendTransaction(this.api, this.tx, account, waitFor, options)
  }

  async execute(account: KeyringPair, options?: TransactionOptions): Promise<H256> {
    const optionWrapper = options || {}
    return await this.tx.signAndSend(account, optionWrapper)
  }

  async payment_query_info(address: string): Promise<SubmittablePaymentResult<ApiTypes>> {
    return this.tx.paymentInfo(address)
  }

  async payment_query_fee_details(api: ApiPromise, address: string): Promise<InclusionFee> {
    const blockHash2 = await api.rpc.chain.getBlockHash()
    const nonce = await account.fetchNonceNode(api, address)
    const runtimeVersion = api.runtimeVersion
    const signatureOptions = { blockHash: blockHash2, genesisHash: api.genesisHash, nonce, runtimeVersion }
    const fakeTx = this.tx.signFake(address, signatureOptions)

    const queryFeeDetails: any = api.call.transactionPaymentApi.queryFeeDetails(fakeTx.toHex(), null)

    const inclusionFee = {
      baseFee: queryFeeDetails.inclusionFee.__internal__raw.baseFee,
      lenFee: queryFeeDetails.inclusionFee.__internal__raw.lenFee,
      adjustedWeightFee: queryFeeDetails.inclusionFee.__internal__raw.adjustedWeightFee,
    } as InclusionFee

    return inclusionFee
  }
}

export async function parseTransactionResult(
  api: ApiPromise,
  txResult: ISubmittableResult,
): Promise<Result<TransactionDetails, string>> {
  if (txResult.isError) {
    if (txResult.status.isDropped) {
      return err("Transaction was Dropped")
    }

    if (txResult.status.isFinalityTimeout) {
      return err("Transaction FinalityTimeout")
    }

    if (txResult.status.isInvalid) {
      return err("Transaction is Invalid")
    }

    if (txResult.status.isUsurped) {
      return err("Transaction was Usurped")
    }

    return err("Transaction Error")
  }

  const events = txResult.events
  const txHash = txResult.txHash as H256
  const txIndex: number = txResult.txIndex || 22
  let blockHash = txHash

  if (txResult.status.isFinalized) {
    blockHash = txResult.status.asFinalized as H256
  } else {
    blockHash = txResult.status.asInBlock as H256
  }

  const header = await api.rpc.chain.getHeader(blockHash)
  const blockNumber: number = header.number.toNumber()

  const details = new TransactionDetails(txResult, events, txHash, txIndex, blockHash, blockNumber)

  return ok(details)
}
