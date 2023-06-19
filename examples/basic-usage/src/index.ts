import { initialize } from "avail-js-sdk" // Global import
import { isConnected, disconnect } from "avail-js-sdk/chain" // Modular import

const main = async () => {
  const api = await initialize()
  const chain = await api.rpc.system.chain()
  console.log(`Chain: ${chain} - Is connected: ${isConnected()}`)
  await disconnect()
  process.exit(0)
}
main()
