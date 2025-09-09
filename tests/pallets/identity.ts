import { assertEqJson, isOk, isOkAndNotNull } from ".."
import { Client, ClientError, MAINNET_ENDPOINT } from "../../src/sdk"
import { identity } from "../../src/sdk/types/pallets"
import { ICall } from "../../src/sdk/interface"
import { IdentityInfo } from "../../src/sdk/types/pallets/identity/types"

export default async function runTests() {
  await tx_test()
}

async function tx_test() {
  const client = await Client.create(MAINNET_ENDPOINT)
  if (client instanceof ClientError) throw client

  {
    const block = isOk(await client.block(813564))

    // AddSub
    const submittable = client.tx.identity.addSub(
      "0x3e20656e44adb9f33f0a4524ffd77bfca14a5dbab16db47b5137ca5bcc055862",
      { Raw: new TextEncoder().encode("2") },
    )
    const expectedCall = ICall.decode(identity.tx.AddSub, submittable.call.method.toU8a())!
    const actualTx = isOkAndNotNull(await block.tx.get(identity.tx.AddSub, 1))
    assertEqJson(actualTx.call, expectedCall)
  }

  {
    const block = isOk(await client.block(1511978))

    // Clear Identity
    const submittable = client.tx.identity.clearIdentity()
    const expectedCall = ICall.decode(identity.tx.ClearIdentity, submittable.call.method.toU8a())!
    const actualTx = isOkAndNotNull(await block.tx.get(identity.tx.ClearIdentity, 1))
    assertEqJson(actualTx.call, expectedCall)
  }

  {
    const block = isOk(await client.block(1775649))

    // Quit Sub
    const submittable = client.tx.identity.quitSub()
    const expectedCall = ICall.decode(identity.tx.QuitSub, submittable.call.method.toU8a())!
    const actualTx = isOkAndNotNull(await block.tx.get(identity.tx.QuitSub, 1))
    assertEqJson(actualTx.call, expectedCall)
  }

  {
    const block = isOk(await client.block(238667))

    // Remove Sub
    const submittable = client.tx.identity.removeSub(
      "0x1c685e36b375814a39b068e079873f35fd666fb5c66c18126f0e34b942786951",
    )
    const expectedCall = ICall.decode(identity.tx.RemoveSub, submittable.call.method.toU8a())!
    const actualTx = isOkAndNotNull(await block.tx.get(identity.tx.RemoveSub, 1))
    assertEqJson(actualTx.call, expectedCall)
  }

  {
    const block = isOk(await client.block(1808497))

    // Set Identity
    const textEncoder = new TextEncoder()
    const iden = new IdentityInfo(
      [[{ Raw: textEncoder.encode("Discord") }, { Raw: textEncoder.encode("blocktache") }]],
      { Raw: textEncoder.encode("BlockTache") },
      { Raw: textEncoder.encode("BlockTache") },
      { Raw: textEncoder.encode("https://validator.business") },
      { Raw: textEncoder.encode("@andersen0707:matrix.org") },
      { Raw: textEncoder.encode("BlockTache@validator.business") },
      null,
      "None",
      { Raw: textEncoder.encode("@Andrei03343878") },
    )
    const submittable = client.tx.identity.setIdentity(iden)
    const expectedCall = ICall.decode(identity.tx.SetIdentity, submittable.call.method.toU8a())!
    const actualTx = isOkAndNotNull(await block.tx.get(identity.tx.SetIdentity, 1))
    assertEqJson(actualTx.call, expectedCall)
  }

  {
    const block = isOk(await client.block(502560))

    // Set Subs
    const submittable = client.tx.identity.setSubs([
      [
        "0x37dfeeed435f0e9f205e1dfc55775fcd06518f63a5b1ccd53ce2d9e14ab783d3",
        { Raw: new TextEncoder().encode("InfraSingularity") },
      ],
    ])
    const expectedCall = ICall.decode(identity.tx.SetSubs, submittable.call.method.toU8a())!
    const actualTx = isOkAndNotNull(await block.tx.get(identity.tx.SetSubs, 1))
    assertEqJson(actualTx.call, expectedCall)
  }
}
