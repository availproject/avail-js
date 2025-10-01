import { eqJson, isOk, isOkNotNull } from ".."
import { Client, MAINNET_ENDPOINT, BN } from "../../src/sdk"
import { utility } from "../../src/sdk/core/types/pallets"
import { ICall } from "../../src/sdk/core/interface"

export default async function runTests() {
  await tx_test()
}

async function tx_test() {
  const client = isOk(await Client.create(MAINNET_ENDPOINT))

  {
    const block = client.block(1828776)

    // Batch
    const call1 = client.tx().staking().chill()
    const call2 = client.tx().staking().unbond(new BN("1020000000000000000000"))
    const submittable = client.tx().utility().batch([call1, call2])
    const expectedCall = ICall.decode(utility.tx.Batch, submittable.call.method.toU8a())!
    const actualTx = isOkNotNull(await block.ext().get(utility.tx.Batch, 1))
    eqJson(actualTx.call, expectedCall)
    eqJson(isOk(actualTx.call.decodeCalls()), isOk(expectedCall.decodeCalls()))
  }

  {
    const block = client.block(1827667)

    // Batch All
    const call1 = client.tx().staking().chill()
    const call2 = client.tx().staking().unbond(new BN("8371491570236280685776"))
    const submittable = client.tx().utility().batchAll([call1, call2])
    const expectedCall = ICall.decode(utility.tx.BatchAll, submittable.call.method.toU8a())!
    const actualTx = isOkNotNull(await block.ext().get(utility.tx.BatchAll, 3))
    eqJson(actualTx.call, expectedCall)
    eqJson(isOk(actualTx.call.decodeCalls()), isOk(expectedCall.decodeCalls()))
  }

  {
    const block = client.block(1815311)

    // Force Batch
    const call1 = client
      .tx()
      .staking()
      .payoutStakers("0xb4125a5595f7818337330dc3959ae1bfa3b363be621e6668122abe8dd6f18e0a", 418)
    const call2 = client
      .tx()
      .staking()
      .payoutStakers("0xb4125a5595f7818337330dc3959ae1bfa3b363be621e6668122abe8dd6f18e0a", 419)
    const submittable = client.tx().utility().forceBatch([call1, call2])
    const expectedCall = ICall.decode(utility.tx.ForceBatch, submittable.call.method.toU8a())!
    const actualTx = isOkNotNull(await block.ext().get(utility.tx.ForceBatch, 4))
    eqJson(actualTx.call, expectedCall)
    eqJson(isOk(actualTx.call.decodeCalls()), isOk(expectedCall.decodeCalls()))
  }
}
