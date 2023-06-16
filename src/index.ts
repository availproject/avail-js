import { disconnect, initialize, isConnected } from "./chain"

// const main = async () => {
//   const api = await initialize()
//   const chain = await api.rpc.system.chain()
//   console.log(`Chain: ${chain} - Is connected: ${isConnected()}`)
//   await disconnect()
// }
// main()

// Allows for generic imports (eg. import {...} from 'avail-js-sdk')
export * from "./chain"
export * from "./spec"

// Allows for custom imports (eg. import {...} from 'avail-js-sdk/chain')
export * as chain from "./chain"
export * as spec from "./spec"

// Re-exports to avoid duplicattion
export * from "@polkadot/api"
