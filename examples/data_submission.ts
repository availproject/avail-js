import { SDK, Events, Block, DataSubmission, CallData } from "./../src/index"

export async function run() {
  const sdk = await SDK.New(SDK.localEndpoint())
  const api = sdk.api

  const account = SDK.alice()

  // Application Key Creation
  const key = "My JS Key"
  const tx = sdk.tx.dataAvailability.createApplicationKey(key)
  const keyRes = (await tx.executeWaitForInclusion(account)).throwOnFault()

  const keyEvent = keyRes.findFirstEvent(Events.DataAvailability.ApplicationKeyCreated)
  if (keyEvent == null) throw Error("Failed to find Key Event")
  const appId = keyEvent.id

  // Data Submission
  const data = "My Data"
  const tx2 = sdk.tx.dataAvailability.submitData(data)
  const submitRes = (await tx2.executeWaitForInclusion(account, { app_id: appId })).throwOnFault()

  console.log(
    `Block Hash: ${submitRes.blockHash}, Block Number: ${submitRes.blockNumber}, Tx Hash: ${submitRes.txHash}, Tx Index: ${submitRes.txIndex}`,
  )

  const callData = await submitRes.getCallData(api, CallData.DataAvailability.SubmitData)
  if (callData != null) {
    console.log(`Call data: 0x${callData.data}`)
  }

  // Getting Data Submission from Block #1
  const block = await Block.New(api, submitRes.blockHash)

  // dataSubmissionsBySigner, dataSubmissionsByIndex, dataSubmissionsByHash, dataSubmissionsByAppId
  const dataSubmissions = block.dataSubmissionsAll()
  for (const ds of dataSubmissions) {
    console.log(
      `Tx Hash: ${ds.txHash}, Tx Index: ${ds.txIndex}, Data: ${ds.hexData}, Tx Signer: ${ds.txSigner}, App Id: ${ds.appId}`,
    )
    console.log(`Ascii data: ${ds.toAscii()}`)
  }

  // Getting Data Submission from Block #2
  const dataSubmissions2 = block.transactionAll().flatMap((tx, index) => {
    const ds = DataSubmission.fromGenericTx(tx, index)
    return ds ? ds : []
  })
  dataSubmissions2.forEach((ds) => {
    console.log(
      `Tx Hash: ${ds.txHash}, Tx Index: ${ds.txIndex}, Data: ${ds.hexData}, Tx Signer: ${ds.txSigner}, App Id: ${ds.appId}`,
    )
    console.log(`Ascii data: ${ds.toAscii()}`)
  })
}

/*
  Example Output:

  Block Hash: 0xf9a698ca523b3b7a9e1bd37a41ed23bb9df419fb01212776043371068905d7ec, Block Number: 473, Tx Hash: 0x39c037a90ee423971ec1a0dd9a9d17a90c7d1efe7b285936cab98a87ef5f1dc2, Tx Index: 1
  Call data: 0x4d792044617461
  Tx Hash: 0x39c037a90ee423971ec1a0dd9a9d17a90c7d1efe7b285936cab98a87ef5f1dc2, Tx Index: 1, Data: 4d792044617461, Tx Signer: 5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY, App Id: 10
  Ascii data: My Data
  Tx Hash: 0x39c037a90ee423971ec1a0dd9a9d17a90c7d1efe7b285936cab98a87ef5f1dc2, Tx Index: 1, Data: 4d792044617461, Tx Signer: 5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY, App Id: 10
  Ascii data: My Data
*/
