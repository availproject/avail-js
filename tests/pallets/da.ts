import { assertEqJson, isOk, isOkAndNotNull } from ".."
import { Client, MAINNET_ENDPOINT } from "../../src/sdk"
import { dataAvailability } from "../../src/sdk/types/pallets"
import { ICall } from "../../src/sdk/interface"
import { AccountId, H256 } from "../../src/sdk/types"

export default async function runTests() {
  await tx_test()
  await event_test()
}

async function tx_test() {
  const client = isOk(await Client.create(MAINNET_ENDPOINT))
  {
    const block = client.block(0)

    const submittable = client.tx.dataAvailability.submitData("The future is available for all, one block at a time.")
    const expectedCall = ICall.decode(dataAvailability.tx.SubmitData, submittable.call.method.toU8a())!
    const actualTx = isOkAndNotNull(await block.tx.get(dataAvailability.tx.SubmitData, 0))
    assertEqJson(actualTx.call, expectedCall)
  }

  {
    const block = client.block(1783406)

    // CreateApplicationKey
    const submittable = client.tx.dataAvailability.createApplicationKey("kraken")
    const expectedCall = ICall.decode(dataAvailability.tx.CreateApplicationKey, submittable.call.method.toU8a())!
    const actualTx = isOkAndNotNull(await block.tx.get(dataAvailability.tx.CreateApplicationKey, 1))
    assertEqJson(actualTx.call, expectedCall)
  }
}

async function event_test() {
  const client = isOk(await Client.create(MAINNET_ENDPOINT))
  {
    const block = client.block(1783406)

    // ApplicationKeyCreated
    const events = isOkAndNotNull(await block.event.tx(1))
    const event = events.find(dataAvailability.events.ApplicationKeyCreated, true)
    const expected = new dataAvailability.events.ApplicationKeyCreated(
      new TextEncoder().encode("kraken"),
      AccountId.from("0x268d78a6783f236eca1e54e8053aa42d8bd138d549e2473c898b482e270f2c56", true),
      41,
    )
    assertEqJson(event, expected)
  }

  {
    const block = client.block(1861947)

    // DataSubmitted
    const events = isOkAndNotNull(await block.event.tx(1))
    const event = events.find(dataAvailability.events.DataSubmitted, true)
    const expected = new dataAvailability.events.DataSubmitted(
      AccountId.from("0x6e7b54d8c3a0db834338c6dc3ec02cab9af483e1fdafe24afb0d3d1bd19c0f77", true),
      H256.from("0x04771cf2fabb927e3a3bbbc1096c9ad85d5e3c98ffdc9c26c574e6a079fb3914", true),
    )
    assertEqJson(event, expected)
  }
}
