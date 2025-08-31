import { assertEqJson, isOkAndNotNull } from ".."
import { Client, ClientError, MAINNET_ENDPOINT } from "../../src/sdk"
import { dataAvailability } from "../../src/sdk/types/pallets"
import { ICall } from "../../src/sdk/interface"

export default async function runTests() {
  await tx_test()
}

async function tx_test() {
  const client = await Client.create(MAINNET_ENDPOINT)
  if (client instanceof ClientError) throw client

  const blockClient = client.blockClient()
  {
    // SubmitData
    const submittable = client.tx.dataAvailability.submitData("The future is available for all, one block at a time.")
    const expectedCall = ICall.decode(dataAvailability.tx.SubmitData, submittable.call.method.toU8a())!
    const [actualCall] = isOkAndNotNull(await blockClient.transactionStatic(dataAvailability.tx.SubmitData, 0, 0))
    assertEqJson(actualCall, expectedCall)
  }

  {
    // CreateApplicationKey
    const submittable = client.tx.dataAvailability.createApplicationKey("kraken")
    const expectedCall = ICall.decode(dataAvailability.tx.CreateApplicationKey, submittable.call.method.toU8a())!
    const [actualCall] = isOkAndNotNull(
      await blockClient.transactionStatic(dataAvailability.tx.CreateApplicationKey, 1783406, 1),
    )
    assertEqJson(actualCall, expectedCall)
  }
}
