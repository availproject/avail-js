import { disconnect, initialize, isConnected } from "./chain"

const main = async () => {
  const api = await initialize()
  const chain = await api.rpc.system.chain()
  console.log(`Chain: ${chain} - Is connected: ${isConnected()}`)
  await disconnect()
}
main()
