import { assertEq, isOk, isNotOk, isOkAndNotNull, waitForBlock } from ".."
import { Client, LOCAL_ENDPOINT, ClientError } from "../../src/sdk"
import { alice } from "../../src/sdk/accounts"
import { SubmittableTransaction } from "../../src/sdk/transaction"
import { dataAvailability } from "../../src/sdk/types/pallets"
import { hexToU8a } from "../../src/sdk/types/polkadot"
import { Duration } from "../../src/sdk/utils"

const ONE_SECOND: Duration = Duration.fromSecs(1)

export default async function runTests() {
  const client = await Client.create(LOCAL_ENDPOINT)
  if (client instanceof ClientError) throw client

  // Ways to create a submittable
  // 1. using the tx wrapper
  // 2. by using directly the hex encoded call data
  // 3. by using polkadot js api
  // 4. by passing an object that has palletId, variantId and encode as methods
  // 5. by passing u8a
  const submittable_01 = client.tx.dataAvailability.submitData("ABC")
  const submittable_02 = SubmittableTransaction.from(client, "0x1d010c414243")
  const submittable_03 = SubmittableTransaction.from(client, client.api.tx.dataAvailability.submitData("ABC"))
  const submittable_04 = SubmittableTransaction.from(client, {
    palletId: () => 29,
    variantId: () => 1,
    encode: () => hexToU8a("0x0c414243"),
  })
  const submittable_05 = SubmittableTransaction.from(client, hexToU8a("0x1d010c414243"))
  // Checking that all the submittables are the actually same
  assertEq(submittable_01.call.method.toString(), submittable_02.call.method.toString())
  assertEq(submittable_02.call.method.toString(), submittable_03.call.method.toString())
  assertEq(submittable_03.call.method.toString(), submittable_04.call.method.toString())
  assertEq(submittable_04.call.method.toString(), submittable_05.call.method.toString())

  {
    const submittable = client.tx.dataAvailability.submitData("ABC")

    // TODO Submitting DA transaction must be done with appID set to a non null and non zero value
    // const submitted_01 = await submittable.signAndSubmit(alice())
    isOk(await submittable.signAndSubmit(alice(), { app_id: 2 }))
    //assertTrue(submitted_01 instanceof ClientError, "Submitted tx must be in error")
  }

  {
    // Submitting non-DA transaction must be done with either null or appID zero
    const submittable = client.tx.dataAvailability.createApplicationKey("ABC")
    isOk(await submittable.signAndSubmit(alice(), undefined, false))
    isOk(await submittable.signAndSubmit(alice(), { app_id: 0 }, false))
    isNotOk(await submittable.signAndSubmit(alice(), { app_id: 2 }, false))
  }

  {
    const submittable = client.tx.dataAvailability.submitData("ABC")
    const submitted = isOk(await submittable.signAndSubmit(alice(), { app_id: 2 }))

    // Calling .receipt() without args should look for the tx in finalized blocks
    console.log("Waiting for finalization...")
    const receipt = isOkAndNotNull(await submitted.receipt(undefined, { pollRate: ONE_SECOND }))
    const finalizedRef = isOk(await client.finalized.blockRef())
    assertEq(receipt.blockRef.hash.toString(), finalizedRef.hash.toString())
    assertEq(receipt.blockRef.height, finalizedRef.height)
    assertEq(isOk(await receipt.blockState()), "Finalized")
  }

  {
    const submittable = client.tx.dataAvailability.submitData("ABC")
    const submitted = isOk(await submittable.signAndSubmit(alice(), { app_id: 2 }))

    // Calling .receipt(false) should look for the tx in finalized blocks
    console.log("Waiting for finalization...")
    const receipt = isOkAndNotNull(await submitted.receipt(false, { pollRate: ONE_SECOND }))
    const finalizedRef = isOk(await client.finalized.blockRef())
    assertEq(receipt.blockRef.hash.toString(), finalizedRef.hash.toString())
    assertEq(receipt.blockRef.height, finalizedRef.height)
    assertEq(isOk(await receipt.blockState()), "Finalized")
  }

  {
    const submittable = client.tx.dataAvailability.submitData("ABC")
    const submitted = isOk(await submittable.signAndSubmit(alice(), { app_id: 2 }))

    // Calling .receipt(true) should look for the tx in the best blocks
    console.log("Waiting for best block...")
    const receipt = isOkAndNotNull(await submitted.receipt(true, { pollRate: ONE_SECOND }))
    const bestRef = isOk(await client.best.blockRef())
    assertEq(receipt.blockRef.hash.toString(), bestRef.hash.toString())
    assertEq(receipt.blockRef.height, bestRef.height)
    assertEq(isOk(await receipt.blockState()), "Included")

    // Making sure that the blockState changes when the block gets finalized
    console.log("Waiting for finalization...")
    await waitForBlock(client, receipt.blockRef.height, false)
    assertEq(isOk(await receipt.blockState()), "Finalized")
    assertEq(isOk(await client.finalized.blockRef()).height, receipt.blockRef.height)
  }

  {
    const submittable = client.tx.dataAvailability.createApplicationKey("ABC")
    const submitted = isOk(await submittable.signAndSubmit(alice()))
    console.log("Waiting for best block...")
    const receipt = isOkAndNotNull(await submitted.receipt(true, { pollRate: ONE_SECOND }))

    // Extrinsic failed should be present on TXs that failed
    // Extrinsic success should NOT be present on TXs that failed
    const events = isOk(await receipt.txEvents())
    assertEq(events.isExtrinsicSuccessPresent(), false)
    assertEq(events.isExtrinsicFailedPresent(), true)
    assertEq(events.isPresent(dataAvailability.events.ApplicationKeyCreated), false)
  }

  {
    const submittable = client.tx.dataAvailability.submitData("ABC")
    const submitted = isOk(await submittable.signAndSubmit(alice(), { app_id: 2 }))
    console.log("Waiting for best block...")
    const receipt = isOkAndNotNull(await submitted.receipt(true, { pollRate: ONE_SECOND }))

    // Extrinsic success should be present on TXs that are successful
    // Extrinsic failed should NOT be present on TXs that are successful
    // DataSubmitted should be present as the TX was successful
    const events = isOk(await receipt.txEvents())
    assertEq(events.isExtrinsicSuccessPresent(), true)
    assertEq(events.isExtrinsicFailedPresent(), false)
    assertEq(events.isPresent(dataAvailability.events.DataSubmitted), true)
  }
}
