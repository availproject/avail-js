import { assert_eq } from "."
import { find_finalized_block, find_transaction } from "../src/sdk/transaction_execution"
import { Account, SDK, Pallets } from "./../src/index"

export async function runTransactionExecute() {
  const sdk = await SDK.New(SDK.localEndpoint)
  const account = Account.alice()

  // Transaction will be signed, and sent.
  //
  // There is no guarantee that the transaction was executed at all. It might have been
  // dropped or discarded for various reasons. The caller is responsible for querying future
  // blocks in order to determine the execution status of that transaction.
  const tx = sdk.tx.dataAvailability.submitData("My Data")
  const [txhash, refined] = await tx.execute2(account, { app_id: 1 })

  // Checking if the transaction was included
  //
  let block = await find_finalized_block(sdk.client, refined, account.address)
  if (block == null) {
    throw new Error("Failed to find transaction")
  }

  let details = await find_transaction(sdk.client, block[1], block[0], txhash.toHex())
  if (details == null) {
    throw new Error("Failed to find transaction")
  }
  assert_eq(details.isSuccessful(), true)

  // Transaction Details
  console.log(
    `Block Hash: ${details.blockHash}, Block Number: ${details.blockNumber}, Tx Hash: ${details.txHash}, Tx Index: ${details.txIndex}`,
  )

  // Transaction Events
  if (details.events == undefined) throw Error()
  for (const event of details.events.iter()) {
    console.log(
      `Pallet Name: ${event.palletName()}, Pallet Index: ${event.palletIndex()}, Event Name: ${event.eventName()}, Event Index: ${event.eventIndex()}, Tx Index: ${event.txIndex()}`,
    )
  }

  // Find DataSubmitted event
  const event = details.events.findFirst(Pallets.DataAvailabilityEvents.DataSubmitted)
  if (event == undefined) throw new Error()
  console.log(`Who: ${event.who}, DataHash: ${event.dataHash}`)

  console.log("runTransactionExecute finished correctly")
}
