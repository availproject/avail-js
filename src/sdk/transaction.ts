import { SubmittableExtrinsic } from "@polkadot/api/types"
import { KeyringPair, Pallets, Events, Client, H256, RuntimeAPI } from "."
import { RefinedOptions, toRefinedOptions, toSignerOptions, TransactionOptions } from "./transaction_options"
import { signAndSendTransaction } from "./transaction_execution"
import { Account } from "./account"
import { FeeDetails, RuntimeDispatchInfo } from "./metadata"

export enum WaitFor {
  BlockInclusion,
  BlockFinalization,
}

export class TransactionDetails {
  constructor(
    public client: Client,
    public events: Events.EventRecords | undefined,
    public txHash: H256,
    public txIndex: number,
    public blockHash: H256,
    public blockNumber: number,
  ) {}

  isSuccessful(): boolean | undefined {
    if (this.events == undefined) {
      return undefined
    }

    for (const event of this.events.iter()) {
      if (Events.palletEventMatch(event, Pallets.SystemEvents.ExtrinsicSuccess)) {
        return true
      }
      if (Events.palletEventMatch(event, Pallets.SystemEvents.ExtrinsicFailed)) {
        return false
      }
    }

    return undefined
  }
}

export class Transaction {
  private client: Client
  public tx: SubmittableExtrinsic<"promise">

  constructor(client: Client, tx: SubmittableExtrinsic<"promise">) {
    this.client = client
    this.tx = tx
  }

  async executeWaitForInclusion(account: KeyringPair, options: TransactionOptions): Promise<TransactionDetails> {
    return await signAndSendTransaction(this.client, this.tx, account, WaitFor.BlockInclusion, options)
  }

  async executeWaitForFinalization(account: KeyringPair, options: TransactionOptions): Promise<TransactionDetails> {
    return await signAndSendTransaction(this.client, this.tx, account, WaitFor.BlockFinalization, options)
  }

  async execute(account: KeyringPair, options: TransactionOptions): Promise<H256> {
    const refinedOptions = await toRefinedOptions(options, this.client, account.address)
    const signerOptions = await toSignerOptions(refinedOptions, this.client)
    const result = await this.tx.signAndSend(account, signerOptions)
    return new H256(result)
  }

  async execute2(account: KeyringPair, options: TransactionOptions): Promise<[H256, RefinedOptions]> {
    const refinedOptions = await toRefinedOptions(options, this.client, account.address)
    const signerOptions = await toSignerOptions(refinedOptions, this.client)
    const result = await this.tx.signAndSend(account, signerOptions)
    return [new H256(result), refinedOptions]
  }

  async paymentQueryInfo(address: string): Promise<RuntimeDispatchInfo> {
    const blockHash = await this.client.finalizedBlockHash()
    const nonce = await Account.nonce(this.client, address)
    const runtimeVersion = this.client.api.runtimeVersion
    const signatureOptions = {
      blockHash: blockHash.toString(),
      genesisHash: this.client.api.genesisHash,
      nonce,
      runtimeVersion,
    }
    const fakeTx = this.tx.signFake(address, signatureOptions)

    return RuntimeAPI.TransactionPaymentApi_queryInfo(this.client, fakeTx.toHex())
  }

  async paymentQueryFeeDetails(address: string): Promise<FeeDetails> {
    const blockHash = await this.client.finalizedBlockHash()
    const nonce = await Account.nonce(this.client, address)
    const runtimeVersion = this.client.api.runtimeVersion
    const signatureOptions = {
      blockHash: blockHash.toString(),
      genesisHash: this.client.api.genesisHash,
      nonce,
      runtimeVersion,
    }
    const fakeTx = this.tx.signFake(address, signatureOptions)

    return RuntimeAPI.TransactionPaymentApi_queryFeeDetails(this.client, fakeTx.toHex())
  }

  async paymentQueryCallInfo(): Promise<RuntimeDispatchInfo> {
    return RuntimeAPI.TransactionPaymentCallApi_queryCallInfo(this.client, this.tx.method.toHex())
  }

  async paymentQueryCallFeeDetails(): Promise<FeeDetails> {
    return RuntimeAPI.TransactionPaymentCallApi_queryCallFeeDetails(this.client, this.tx.method.toHex())
  }
}
