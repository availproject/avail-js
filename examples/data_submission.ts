import { assert_eq, assert_true } from "."
import { Account, SDK, Pallets } from "./../src/index"

export async function runDataSubmission() {
  const sdk = await SDK.New(SDK.localEndpoint)
  const account = Account.alice()

  const key = "" + Math.ceil(Math.random() * 1_000_000_00)
  const tx = sdk.tx.dataAvailability.createApplicationKey(key)
  const res = await tx.executeWaitForInclusion(account, {})
  const isOk = res.isSuccessful()

  // If the return value from `IsSuccessful` is undefined, it means that we cannot
  // determine if the transaction was successful or not.
  assert_true(isOk !== undefined)

  // If the value of `IsSuccessful()` is false then the transaction has failed.
  assert_eq(isOk, true)

  // We might have failed to decode the events so res.events could be None.
  if (res.events == undefined) throw new Error()

  const event = res.events.findFirst(Pallets.DataAvailabilityEvents.ApplicationKeyCreated)
  if (event == undefined) throw new Error();
  const appId = event.id;
  console.log(`Owner: ${event.owner}, Key: ${event.keyToString()}, App Id: ${appId}`)

  const tx2 = sdk.tx.dataAvailability.submitData("My Data")
  const res2 = await tx2.executeWaitForInclusion(account, { app_id: appId })
  assert_eq(res2.isSuccessful(), true)

  // Transaction Details
  console.log(`Block Hash: ${res.blockHash}, Block Number: ${res.blockNumber}, Tx Hash: ${res.txHash}, Tx Index: ${res.txIndex}`)

  // Events
  if (res2.events == undefined) throw new Error()
  for (const event of res.events.iter()) {
    console.log(`Pallet Name: ${event.palletName()}, Pallet Index: ${event.palletIndex()}, Event Name: ${event.eventName()}, Event Index: ${event.eventIndex()}, Tx Index: ${event.txIndex()}`)
  }

  const event2 = res2.events.findFirst(Pallets.DataAvailabilityEvents.DataSubmitted)
  if (event2 == undefined) throw new Error();
  console.log(`Who: ${event2.who}, DataHash: ${event2.dataHash}`)

  console.log("runDataSubmission finished correctly")
}
