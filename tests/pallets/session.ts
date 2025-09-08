import { assertEqJson, isOkAndNotNull } from ".."
import { Client, ClientError, MAINNET_ENDPOINT } from "../../src/sdk"
import { session } from "../../src/sdk/types/pallets"
import { ICall } from "../../src/sdk/interface"

export default async function runTests() {
  await tx_test()
}

async function tx_test() {
  const client = await Client.create(MAINNET_ENDPOINT)
  if (client instanceof ClientError) throw client

  const blockClient = client.blockClient()
  {
    // Set Keys
    const submittable = client.tx.session.setKeys(
      "0x80c52d4cb7e3f08b72867f94dfd333a69eceeac33182592115329a295d68213c",
      "0xb5e474b9fe49173536aca3ec8f5d6b3bbb8215691466824400fcef78cbbc9ace",
      "0x26fac592a4216ad35dc0960fef4182a34640b4e19781f4dfbe577fa57b145c7d",
      "0xa41af012eb2c05d873869f8d4bc771b7bbc7fc5968ae683f78497ec6b9a32e15",
      new Uint8Array(),
    )
    const expectedCall = ICall.decode(session.tx.SetKeys, submittable.call.method.toU8a())!
    const [actualCall] = isOkAndNotNull(await blockClient.transactionStatic(session.tx.SetKeys, 1811224, 1))
    assertEqJson(actualCall, expectedCall)
  }

  {
    // Purge Keys
    const submittable = client.tx.session.purgeKeys()
    const expectedCall = ICall.decode(session.tx.PurgeKeys, submittable.call.method.toU8a())!
    const [actualCall] = isOkAndNotNull(await blockClient.transactionStatic(session.tx.PurgeKeys, 209615, 1))
    assertEqJson(actualCall, expectedCall)
  }
}
