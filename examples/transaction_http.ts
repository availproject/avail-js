import { assert_eq } from "."
import { Account, SDK, Pallets } from "./../src/index"

export async function runTransactionHttp() {
  const sdk = await SDK.New(SDK.localHttpEndpoint, true)
  const account = Account.alice()

  const tx = sdk.tx.dataAvailability.submitData("My Data")
  const res = await tx.executeWaitForFinalization(account, { app_id: 1 })
  assert_eq(res.isSuccessful(), true)

  // Transaction Details
  console.log(
    `Block Hash: ${res.blockHash}, Block Number: ${res.blockNumber}, Tx Hash: ${res.txHash}, Tx Index: ${res.txIndex}`,
  )

  // Transaction Events
  if (res.events == undefined) throw Error()
  for (const event of res.events.iter()) {
    console.log(
      `Pallet Name: ${event.palletName()}, Pallet Index: ${event.palletIndex()}, Event Name: ${event.eventName()}, Event Index: ${event.eventIndex()}, Tx Index: ${event.txIndex()}`,
    )
  }

  // Find DataSubmitted event
  const event = res.events.findFirst(Pallets.DataAvailabilityEvents.DataSubmitted)
  if (event == undefined) throw new Error()
  console.log(`Who: ${event.who}, DataHash: ${event.dataHash}`)

  console.log("runTransactionExecuteAndWatchFinalization finished correctly")
}
