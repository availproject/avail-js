import { assertEqJson, isOkAndNotNull, json } from ".."
import { Client, ClientError, MAINNET_ENDPOINT } from "../../src/sdk"
import { balances } from "../../src/sdk/types/pallets"
import { ICall } from "../../src/sdk/interface"
import { BN } from "../../src/sdk/types"

export default async function runTests() {
  await tx_test()
}

async function tx_test() {
  const client = await Client.create(MAINNET_ENDPOINT)
  if (client instanceof ClientError) throw client

  const blockClient = client.blockClient()
  {
    // TransferAll
    const submittable = client.tx.balances.transferAll(
      "0x28806db1fa697e9c4967d8bd8ee78a994dfea2887486c39969a7d16bfebbf36f",
      false,
    )
    const expectedCall = ICall.decode(balances.tx.TransferAll, submittable.call.method.toU8a())!
    const [actualCall] = isOkAndNotNull(await blockClient.transactionStatic(balances.tx.TransferAll, 1828050, 1))
    assertEqJson(actualCall, expectedCall)
  }

  {
    // TransferAllowDeath
    const submittable = client.tx.balances.transferAllowDeath(
      "0x0d584a4cbbfd9a4878d816512894e65918e54fae13df39a6f520fc90caea2fb0",
      new BN("2010899374608366600109698"),
    )
    const expectedCall = ICall.decode(balances.tx.TransferAllowDeath, submittable.call.method.toU8a())!
    const [actualCall] = isOkAndNotNull(await blockClient.transactionStatic(balances.tx.TransferAllowDeath, 1828972, 1))
    assertEqJson(actualCall, expectedCall)
  }

  {
    // TransferKeepAlive
    const submittable = client.tx.balances.transferKeepAlive(
      "0x00d6fb2b0c83e1bbf6938265912d900f57c9bee67bd8a8cb18ec50fefbf47931",
      new BN("616150000000000000000"),
    )
    const expectedCall = ICall.decode(balances.tx.TransferKeepAlive, submittable.call.method.toU8a())!
    const [actualCall] = isOkAndNotNull(await blockClient.transactionStatic(balances.tx.TransferKeepAlive, 1828947, 1))
    assertEqJson(actualCall, expectedCall)
  }
}
