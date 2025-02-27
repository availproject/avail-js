import { assert_eq } from "."
import { Account, SDK, Pallets } from "./../src/index"

export async function runTransactionExecuteAndWatchFinalization() {
  const sdk = await SDK.New(SDK.localEndpoint)
  const account = Account.alice()

  // Transaction will be signed, sent, and watched
  // If the transaction was dropped or never executed, the system will retry it
  // for 2 more times using the same nonce and app id.
  //
  // Waits for transaction inclusion. Most of the time you would want to call `ExecuteAndWatchFinalization` as
  // inclusion doesn't mean that the transaction will be in the canonical chain.
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
