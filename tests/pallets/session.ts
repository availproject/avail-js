import { eqJson, isOk, isOkNotNull } from ".."
import { Client, MAINNET_ENDPOINT } from "../../src/sdk"
import { session } from "../../src/sdk/core/types/pallets"
import { ICall } from "../../src/sdk/core/interface"

export default async function runTests() {
  await tx_test()
}

async function tx_test() {
  const client = isOk(await Client.create(MAINNET_ENDPOINT))
  {
    const block = client.block(1811224)

    // Set Keys
    const submittable = client
      .tx()
      .session()
      .setKeys(
        "0x80c52d4cb7e3f08b72867f94dfd333a69eceeac33182592115329a295d68213c",
        "0xb5e474b9fe49173536aca3ec8f5d6b3bbb8215691466824400fcef78cbbc9ace",
        "0x26fac592a4216ad35dc0960fef4182a34640b4e19781f4dfbe577fa57b145c7d",
        "0xa41af012eb2c05d873869f8d4bc771b7bbc7fc5968ae683f78497ec6b9a32e15",
        new Uint8Array(),
      )
    const expectedCall = ICall.decode(session.tx.SetKeys, submittable.call.method.toU8a())!
    const actualTx = isOkNotNull(await block.ext().get(session.tx.SetKeys, 1))
    eqJson(actualTx.call, expectedCall)
  }

  {
    const block = client.block(209615)

    // Purge Keys
    const submittable = client.tx().session().purgeKeys()
    const expectedCall = ICall.decode(session.tx.PurgeKeys, submittable.call.method.toU8a())!
    const actualTx = isOkNotNull(await block.ext().get(session.tx.PurgeKeys, 1))
    eqJson(actualTx.call, expectedCall)
  }
}
