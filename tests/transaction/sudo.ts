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
}
