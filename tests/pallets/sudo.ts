import { isOk, isOkAndNotNull } from ".."
import { Client, LOCAL_ENDPOINT } from "../../src/sdk"
import { sudo } from "../../src/sdk/types/pallets"
import { Hex } from "../../src/sdk/utils"

export default async function runTests() {
  await tx_test()
}

async function tx_test() {
  const client = isOk(await Client.create(LOCAL_ENDPOINT))

  {
    const block = isOk(await client.block(64))

    // Sudo
    const actualTx = isOkAndNotNull(await block.tx.get(sudo.tx.Sudo, 1))
  }
}
