import { H256, InclusionFee } from "@polkadot/types/interfaces/types"
import { ApiTypes, SubmittableExtrinsic, SubmittablePaymentResult } from "@polkadot/api/types"
import { KeyringPair, Pallets, Events, Client } from "."
import { TransactionOptions } from "./transaction_options"
import { signAndSendTransaction } from "./transaction_execution"
import { Account } from "./account"

export enum WaitFor {
  BlockInclusion,
  BlockFinalization,
}

export class TransactionDetails {
  constructor(
    public client: Client,
    public events: Events.EventRecords | null,
    public txHash: H256,
    public txIndex: number,
    public blockHash: H256,
    public blockNumber: number,
  ) { }

  isSuccessful(): boolean | undefined {
    if (this.events == null) {
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

    return undefined;
  }
}

export class Transaction {
  private client: Client
  public tx: SubmittableExtrinsic<"promise">

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

  async payment_query_fee_details(client: Client, address: string): Promise<InclusionFee> {
    const blockHash2 = await client.api.rpc.chain.getBlockHash()
    const nonce = await Account.nonce(client, address)
    const runtimeVersion = client.api.runtimeVersion
    const signatureOptions = { blockHash: blockHash2, genesisHash: client.api.genesisHash, nonce, runtimeVersion }
    const fakeTx = this.tx.signFake(address, signatureOptions)

    const queryFeeDetails: any = await client.api.call.transactionPaymentApi.queryFeeDetails(fakeTx.toHex(), null)

    const inclusionFee = {
      baseFee: queryFeeDetails.inclusionFee.__internal__raw.baseFee,
      lenFee: queryFeeDetails.inclusionFee.__internal__raw.lenFee,
      adjustedWeightFee: queryFeeDetails.inclusionFee.__internal__raw.adjustedWeightFee,
    } as InclusionFee

    return inclusionFee
  }
}
