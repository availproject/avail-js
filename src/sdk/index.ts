import { ApiPromise, Keyring } from "@polkadot/api"
import { initialize } from "../chain"
import { Transactions } from "./transactions"
import { BN } from "@polkadot/util"
import { KeyringPair } from "@polkadot/keyring/types"
import { Client } from "./client"

export { BN } from "@polkadot/util"
export { Keyring } from "@polkadot/api"
export { KeyringPair } from "@polkadot/keyring/types"
export { Bytes } from "@polkadot/types-codec"
export { H256, Weight, InclusionFee, BlockHash } from "@polkadot/types/interfaces"
export { DataSubmission } from "./block"
export { EventRecord } from "@polkadot/types/interfaces/types"
export {
  StakingRewardDestination,
  DispatchFeeModifier,
  BondExtra,
  ClaimPermission,
  NewCommission,
  PoolState,
  Events,
  CallData,
} from "./transactions"
export { WaitFor, TransactionDetails, Transaction } from "./transaction"
export { Block } from "./block"

export * as sdkBlock from "./block"
export * as utils from "./utils"
export * as sdkTransactions from "./transactions"
export * as sdkTransaction from "./transaction"
export * as sdkAccount from "./account"
export { Watcher } from "./transaction_watcher"

export class SDK {
  client: Client
  tx: Transactions

  static async New(endpoint: string): Promise<SDK> {
    const api = await initialize(endpoint)
    return new SDK(new Client(api))
  }

  private constructor(client: Client) {
    this.client = client
    this.tx = new Transactions(client)
  }

  static oneAvail(): BN {
    return new BN(10).pow(new BN(18))
  }

  static localEndpoint(): string {
    return "ws://127.0.0.1:9944"
  }

  static turingEndpoint(): string {
    return "wss://turing-rpc.avail.so/ws"
  }

  static mainnetEndpoint(): string {
    return "wss://mainnet-rpc.avail.so/ws"
  }

  static alice(): KeyringPair {
    return new Keyring({ type: "sr25519" }).addFromUri("//Alice")
  }

  static bob(): KeyringPair {
    return new Keyring({ type: "sr25519" }).addFromUri("//Bob")
  }

  static charlie(): KeyringPair {
    return new Keyring({ type: "sr25519" }).addFromUri("//Charlie")
  }
}
