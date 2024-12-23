import { SDK, Block, CallData } from "./../src/index"

export async function run() {
  const sdk = await SDK.New(SDK.localEndpoint())
  const account = SDK.alice()

  const data = "My Data"
  const tx = sdk.tx.dataAvailability.submitData(data)
  const res = (await tx.executeWaitForInclusion(account, { app_id: 1 })).throwOnFault()

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

  const callData = CallData.getCallData(genericTx, CallData.DataAvailability.SubmitData)
  if (callData != null) {
    console.log(`Tx Call Data: ${callData.data}`)
  }

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
  console.log(`All Event count: ${allEvents.length}`)

  // Fetching events for a specific transaction
  const txEvents = await block.fetchEvents(sdk.api, res.txIndex)
  console.log(`Transaction Event count: ${txEvents.length}`)
}

/*
  Example Output:

  Pallet name: dataAvailability, Call name: submitData
  Tx Call Data: 4d792044617461
  Tx hash: 0x208e55a67414623c4f98d46808b6f11e4a9718acfd8ceb2e90f38c6f38dd05a2, Tx Index: 1, Data: 4d792044617461, Tx Singer: 5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY, App Id: 1
  All Event count: 9
  Transaction Event count: 7
*/
