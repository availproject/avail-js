import { assertEqJson, isOk, isOkAndNotNull } from ".."
import { Client, MAINNET_ENDPOINT } from "../../src/sdk"
import { utility } from "../../src/sdk/types/pallets"
import { ICall } from "../../src/sdk/interface"
import { BN } from "../../src/sdk/types"

export default async function runTests() {
  await tx_test()
}

async function tx_test() {
  const client = isOk(await Client.create(MAINNET_ENDPOINT))

  {
    const block = client.block(1828776)

    // Batch
    const call1 = client.tx.staking.chill()
    const call2 = client.tx.staking.unbond(new BN("1020000000000000000000"))
    const submittable = client.tx.utility.batch([call1, call2])
    const expectedCall = ICall.decode(utility.tx.Batch, submittable.call.method.toU8a())!
    const actualTx = isOkAndNotNull(await block.tx.get(utility.tx.Batch, 1))
    assertEqJson(actualTx.call, expectedCall)
    assertEqJson(isOk(actualTx.call.decodeCalls()), isOk(expectedCall.decodeCalls()))
  }

  {
    const block = client.block(1827667)

    // Batch All
    const call1 = client.tx.staking.chill()
    const call2 = client.tx.staking.unbond(new BN("8371491570236280685776"))
    const submittable = client.tx.utility.batchAll([call1, call2])
    const expectedCall = ICall.decode(utility.tx.BatchAll, submittable.call.method.toU8a())!
    const actualTx = isOkAndNotNull(await block.tx.get(utility.tx.BatchAll, 3))
    assertEqJson(actualTx.call, expectedCall)
    assertEqJson(isOk(actualTx.call.decodeCalls()), isOk(expectedCall.decodeCalls()))
  }

  {
    const block = client.block(1815311)

    // Force Batch
    const call1 = client.tx.staking.payoutStakers(
      "0xb4125a5595f7818337330dc3959ae1bfa3b363be621e6668122abe8dd6f18e0a",
      418,
    )
    const call2 = client.tx.staking.payoutStakers(
      "0xb4125a5595f7818337330dc3959ae1bfa3b363be621e6668122abe8dd6f18e0a",
      419,
    )
    const submittable = client.tx.utility.forceBatch([call1, call2])
    const expectedCall = ICall.decode(utility.tx.ForceBatch, submittable.call.method.toU8a())!
    const actualTx = isOkAndNotNull(await block.tx.get(utility.tx.ForceBatch, 4))
    assertEqJson(actualTx.call, expectedCall)
    assertEqJson(isOk(actualTx.call.decodeCalls()), isOk(expectedCall.decodeCalls()))
  }
}
