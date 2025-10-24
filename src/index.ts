export { Client } from "./client"
export * as blockApi from "./block"
export * as txApi from "./transaction"
export * as chainApi from "./chain"
export * as submissionApi from "./submission"
export * as subApi from "./subscription"
export * as core from "./core"
export * as log from "./log"
export * as legacy from "./legacy"

// Re-exports to avoid duplication
export * from "@polkadot/api"
export * as polkadotApi from "@polkadot/api"
export * as polkadotUtil from "@polkadot/util"
