import { isOkAndNotNull, json } from ".."
import { Client, ClientError, LOCAL_ENDPOINT } from "../../src/sdk"
import { sudo } from "../../src/sdk/types/pallets"
import { Hex } from "../../src/sdk/utils"

export default async function runTests() {
  await tx_test()
}

async function tx_test() {
  const client = await Client.create(LOCAL_ENDPOINT)
  if (client instanceof ClientError) throw client

  const blockClient = client.blockClient()
  {
    // Sudo
    const [actualCall] = isOkAndNotNull(await blockClient.transactionStatic(sudo.tx.Sudo, 64, 1))
    console.log(Hex.encode(actualCall.call))
  }

  /*   {
      // Sudo As
      const call1 = client.tx.staking.chill()
      const call2 = client.tx.staking.unbond(new BN("8371491570236280685776"))
      const submittable = client.tx.utility.batchAll([call1, call2])
      const expectedCall = ICall.decode(utility.tx.BatchAll, submittable.call.method.toU8a())!
      const [actualCall] = isOkAndNotNull(await blockClient.transactionStatic(utility.tx.BatchAll, 1827667, 3))
      assertEqJson(actualCall, expectedCall)
      assertEqJson(isOk(actualCall.decodeCalls()), isOk(expectedCall.decodeCalls()))
    } */
}
