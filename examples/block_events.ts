import { assert_eq } from "."
import { SDK, Block, Pallets } from "./../src/index"

export async function runBlockEvents() {
  const sdk = await SDK.New(SDK.turingEndpoint)

  const block = await Block.New(sdk.client, "0x94746ba186876d7407ee618d10cb6619befc59eeb173cacb00c14d1ff492fc58")
  const blockEvents = block.events
  if (blockEvents == null) throw Error();
  assert_eq(blockEvents.len(), 53)

  // Printout All Block Events
  for (const event of blockEvents.iter()) {
    console.log(`Pallet Name: ${event.palletName()}, Pallet Index: ${event.palletIndex()}, Event Name: ${event.eventName()}, Event Index: ${event.eventIndex()}, Tx Index: ${event.txIndex()}`)
  }

  // Find Transfer event
  const transferEvents = blockEvents.find(Pallets.BalancesEvents.Transfer)
  assert_eq(transferEvents.length, 2)

  for (const event of transferEvents) {
    console.log(`From: ${event.from}, To: ${event.to}, Amount: ${event.amount.toString()}`)
  }

  // Find ApplicationKeyCreated event
  const keyCreatedEvent = blockEvents.findFirst(Pallets.DataAvailabilityEvents.ApplicationKeyCreated)
  if (keyCreatedEvent == undefined) throw Error()
  console.log(`Owner: ${keyCreatedEvent.owner}, Key: ${keyCreatedEvent.keyToString()}, App Id: ${keyCreatedEvent.id}`)

  // Check
  assert_eq(blockEvents.find(Pallets.DataAvailabilityEvents.DataSubmitted).length, 4)
  assert_eq(blockEvents.find(Pallets.DataAvailabilityEvents.ApplicationKeyCreated).length, 1)

  // Events for Specific Transaction
  const txIndex = 0
  const txEvents = block.eventsForTransaction(txIndex)
  if (txEvents == undefined) throw Error()
  assert_eq(txEvents.len(), 1)

  // Printout All Tx Events
  for (const event of txEvents.iter()) {
    console.log(`Pallet Name: ${event.palletName()}, Pallet Index: ${event.palletIndex()}, Event Name: ${event.eventName()}, Event Index: ${event.eventIndex()}, Tx Index: ${event.txIndex()}`)
  }

  // Find ExtrinsicSuccess event
  const successEvent = blockEvents.findFirst(Pallets.SystemEvents.ExtrinsicSuccess)
  if (successEvent == undefined) throw Error()
  console.log(`DispatchInfo:`, successEvent.dispatchInfo.toHuman())

  // Check
  const tx2 = block.transactions({ txIndex: txIndex })
  assert_eq(tx2.length, 1)
  const tx2Events = tx2[0].events()
  if (tx2Events == undefined) throw Error()
  assert_eq(tx2Events.len(), txEvents.len())

  console.log("runBlockEvents finished correctly")
}
