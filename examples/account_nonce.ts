import { SDK, sdkAccount } from "./../src/index"

export async function run() {
  const sdk = await SDK.New(SDK.localEndpoint())
  const account = SDK.alice()

  // Fetch nonce from Node (this includes Tx Pool)
  const nodeNonce = await sdkAccount.fetchNonceNode(sdk.api, account.address)
  console.log("Nonce from Node: ", nodeNonce)

  // Fetch nonce from best block state
  const stateNonce = await sdkAccount.fetchNonceState(sdk.api, account.address)
  console.log("Nonce from best block state: ", stateNonce)

  // Fetch nonce from custom block state
  const blockHash = await sdk.api.rpc.chain.getBlockHash()
  const customStateNonce = await sdkAccount.fetchNonceState(sdk.api, account.address, blockHash)
  console.log("Nonce from custom block state: ", customStateNonce)

  // Fetch nonce from manually reading storage
  const apiAt = await sdk.api.at(blockHash)
  const entry: any = await apiAt.query.system.account(account.address)
  console.log("Nonce from manually reading storage: ", entry.nonce.toNumber())
}
/*
  Example Output:
  
  Nonce from Node:  1
  Nonce from best block state:  1
  Nonce from custom block state:  1
  Nonce from manually reading storage:  1
*/
