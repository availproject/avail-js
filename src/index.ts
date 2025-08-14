// Allows for generic imports (eg. import {...} from 'avail-js-sdk')
export * from "./chain"
export * from "./helpers"
export * from "./spec"

// Allows for custom imports (eg. import {...} from 'avail-js-sdk/chain')
export * as chain from "./chain"
export * as helpers from "./helpers"
export * as spec from "./spec"

// Export the SDK classes
export * as Core from "./core"

// Re-exports to avoid duplication
export * from "@polkadot/api"
export * as polkadotApi from "@polkadot/api"
export * as polkadotUtil from "@polkadot/util"

// New SDK exports
// Core
export {
  ONE_AVAIL,
  LOCAL_ENDPOINT,
  LOCAL_WS_ENDPOINT,
  MAINNET_ENDPOINT,
  MAINNET_WS_ENDPOINT,
  TURING_ENDPOINT,
  TURING_WS_ENDPOINT,
} from "./core/constants"
export * as Rpc from "./core/rpc"
export { BlockRef, TxRef, AccountId, H256 } from "./core/types"

// Client
export { Client, log } from "./client"
export { SubmittableTransaction, TransactionReceipt, SubmittedTransaction } from "./client/transaction"
export * as RuntimeAPI from "./client/runtime_api"
