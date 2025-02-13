import { ApiPromise } from "@polkadot/api"
import { H256, InclusionFee } from "@polkadot/types/interfaces/types"
import { ApiTypes, SubmittableExtrinsic, SubmittablePaymentResult } from "@polkadot/api/types"
import { KeyringPair, Watcher } from ".."
import * as account from "./account"
import { EventRecords } from "./transactions/events"
import { Client } from "./client"
import { TransactionOptions } from "./transaction_options"

export enum WaitFor {
  BlockInclusion,
  BlockFinalization,
}

export async function signAndSendTransaction(
  client: Client,
  tx: SubmittableExtrinsic<"promise">,
  account: KeyringPair,
  waitFor: WaitFor,
  options?: TransactionOptions,
): Promise<TransactionDetails> {
  const optionWrapper = options || {}

  let retryCount = 3
  while (1) {
    const txHash = await tx.signAndSend(account, optionWrapper)
    const watcher = new Watcher(client, txHash, waitFor)
    const details = await watcher.run()
    if (details != null) {
      return details
    }

    if (retryCount == 0) {
      break
    }

    retryCount -= 1;
  }
  throw new Error("Failed to submit and/or find transactions")

}

export class TransactionDetails {
  constructor(
    public client: Client,
    public events: EventRecords | null,
    public txHash: H256,
    public txIndex: number,
    public blockHash: H256,
    public blockNumber: number,
  ) { }

  isSuccessful(_api: ApiPromise): boolean | null {
    if (this.events == null) {
      return null
    }

    for (const event of this.events.iter()) {
      if (event.palletName() == "system" && event.eventName() == "ExtrinsicSuccess") {
        return true
      }

      if (event.palletName() == "system" && event.eventName() == "ExtrinsicFailed") {
        return false
      }
    }

    return null;
  }
}

export class Transaction {
  private client: Client
  private tx: SubmittableExtrinsic<"promise">

  constructor(client: Client, tx: SubmittableExtrinsic<"promise">) {
    this.client = client
    this.tx = tx
  }

  async executeWaitForInclusion(account: KeyringPair, options?: TransactionOptions): Promise<TransactionDetails> {
    return await signAndSendTransaction(this.client, this.tx, account, WaitFor.BlockInclusion, options)
  }

  async executeWaitForFinalization(account: KeyringPair, options?: TransactionOptions): Promise<TransactionDetails> {
    return await signAndSendTransaction(this.client, this.tx, account, WaitFor.BlockFinalization, options)
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

    const queryFeeDetails: any = await api.call.transactionPaymentApi.queryFeeDetails(fakeTx.toHex(), null)

    const inclusionFee = {
      baseFee: queryFeeDetails.inclusionFee.__internal__raw.baseFee,
      lenFee: queryFeeDetails.inclusionFee.__internal__raw.lenFee,
      adjustedWeightFee: queryFeeDetails.inclusionFee.__internal__raw.adjustedWeightFee,
    } as InclusionFee

    return inclusionFee
  }
}

/* export async function parseTransactionResult(
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
 */