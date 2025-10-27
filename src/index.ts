export { Client } from "./client"
export * as block from "./block"
export * as tx from "./transaction"
export * as chain from "./chain"
export * as submission from "./submission"
export * as sub from "./subscription"
export * as core from "./core"
export * as log from "./log"

// Re-exports to avoid duplication
export * from "@polkadot/api"
export * as polkadotApi from "@polkadot/api"
export * as polkadotUtil from "@polkadot/util"
