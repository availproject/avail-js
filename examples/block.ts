import { SDK, Block, throwOnErrorOrFailed } from "./../src/index"

export async function run() {
  const sdk = await SDK.New(SDK.localEndpoint())
  const account = SDK.alice()

  const dest = "5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty"
  const value = SDK.oneAvail()
  const tx = sdk.tx.balances.transferKeepAlive(dest, value)
  const res = throwOnErrorOrFailed(sdk.api, await tx.executeWaitForInclusion(account))

  // Fetching best block
  await Block.NewBestBlock(sdk.api)

  // Fetching finalized block
  await Block.NewFinalizedBlock(sdk.api)

  // Fetching with block hash
  const block = await Block.New(sdk.api, res.blockHash)

  // Transactions
  const genericTx = block.transactionByIndex(res.txIndex)
  if (genericTx == undefined) throw Error("Data Submission Tx not found")
  const callName = genericTx.method.method
  const palletName = genericTx.method.section
  console.log(`Pallet name: ${palletName}, Call name: ${callName}`)
  /*
  Available methods:
    transactionCount
    transactionAll
    transactionBySigner
    transactionByIndex
    transactionByHash
    transactionByAppId
  */

  // Data Submission
  const ds = block.dataSubmissionsByIndex(res.txIndex)
  if (ds == undefined) throw Error("Data Submission not found")
  console.log(
    `Tx hash: ${ds.txHash}, Tx Index: ${ds.txIndex}, Data: ${ds.hexData}, Tx Singer: ${ds.txSigner}, App Id: ${ds.appId}`,
  )
  /*
  Available methods:
    dataSubmissionsCount
    dataSubmissionsAll
    dataSubmissionsBySigner
    dataSubmissionsByIndex
    dataSubmissionsByHash
    dataSubmissionsByAppId
  */

  // Converting transaction hash to string.
  let index = block.transactionHashToIndex(res.txHash)
  if (index == undefined || index != res.txIndex) throw Error("Hash to Index failed.")

  // Events
  // Fetching all events
  const allEvents = await block.fetchEvents(sdk.api)
  console.log(`Event count: ${allEvents.length}`)

  // Fetching events for a specific transaction
  const txEvents = await block.fetchEvents(sdk.api, res.txIndex)
  console.log(`Event count: ${txEvents.length}`)
}
