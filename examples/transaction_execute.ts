import { assert_eq } from "."
import { Account, SDK, Pallets, Watcher, WaitFor } from "./../src/index"

export async function runTransactionExecute() {
  const sdk = await SDK.New(SDK.localEndpoint)
  const account = Account.alice()

  // Transaction will be signed, and sent.
  //
  // There is no guarantee that the transaction was executed at all. It might have been
  // dropped or discarded for various reasons. The caller is responsible for querying future
  // blocks in order to determine the execution status of that transaction.
  const tx = sdk.tx.dataAvailability.submitData("My Data")
  const txhash = await tx.execute(account, { app_id: 1 })

  // Checking if the transaction was included
  //
  // It's not necessary to use the builtin watcher. A custom watcher
  // might yield better results in some cases.
  const watcher = new Watcher(sdk.client, txhash, WaitFor.BlockInclusion)
  const res = await watcher.run()
  if (res == null) throw Error()
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

  console.log("runTransactionExecute finished correctly")
}
