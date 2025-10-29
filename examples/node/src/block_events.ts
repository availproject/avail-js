import { AvailError, Client, avail, MAINNET_ENDPOINT } from "avail-js"
import { IEvent } from "avail-js/core/interface"

async function main() {
  const client = await Client.create(MAINNET_ENDPOINT)
  if (client instanceof AvailError) throw AvailError

  const block = client.block(2042845)

  // Extrinsic index 0
  console.log("Extrinsic 0 events: ")
  const extrinsicEvents = await block.events().extrinsic(0)
  if (extrinsicEvents instanceof AvailError) throw extrinsicEvents

  // Checking existence
  const isSuccessPresent = extrinsicEvents.isExtrinsicSuccessPresent()
  const isFailedPresent = extrinsicEvents.isExtrinsicFailedPresent()
  const multisigExecuted = extrinsicEvents.multisigExecutedSuccessfully()
  const proxyExecuted = extrinsicEvents.proxyExecutedSuccessfully()
  const isDepositPresent = extrinsicEvents.isPresent(avail.balances.events.Deposit)
  console.log(
    `Extrinsic Success present: ${isSuccessPresent}, Extrinsic Failed present: ${isFailedPresent}, Multisig Executed present: ${multisigExecuted}, Proxy Executed present: ${proxyExecuted}, Balances Deposit present: ${isDepositPresent}`,
  )

  // Counting
  const successCount = extrinsicEvents.count(avail.system.events.ExtrinsicSuccess)
  const depositCount = extrinsicEvents.count(avail.balances.events.Deposit)
  console.log(
    `Total count: ${extrinsicEvents.events.length}, Success count: ${successCount}, Deposit Count: ${depositCount}`,
  )
  console.log("")

  // Extrinsic index 1
  console.log("Extrinsic 1 events: ")
  const extrinsicEvents1 = await block.events().extrinsic(1)
  if (extrinsicEvents1 instanceof AvailError) throw extrinsicEvents1

  // Checking existence
  const isSuccessPresent2 = extrinsicEvents1.isExtrinsicSuccessPresent()
  const isFailedPresent2 = extrinsicEvents1.isExtrinsicFailedPresent()
  const multisigExecuted2 = extrinsicEvents1.multisigExecutedSuccessfully()
  const proxyExecuted2 = extrinsicEvents1.proxyExecutedSuccessfully()
  const isDepositPresent2 = extrinsicEvents1.isPresent(avail.balances.events.Deposit)
  console.log(
    `Extrinsic Success present: ${isSuccessPresent2}, Extrinsic Failed present: ${isFailedPresent2}, Multisig Executed present: ${multisigExecuted2}, Proxy Executed present: ${proxyExecuted2}, Balances Deposit present: ${isDepositPresent2}`,
  )

  // Counting
  const successCount2 = extrinsicEvents1.count(avail.system.events.ExtrinsicSuccess)
  const depositCount2 = extrinsicEvents1.count(avail.balances.events.Deposit)
  console.log(
    `Total count: ${extrinsicEvents1.events.length}, Success count: ${successCount2}, Deposit Count: ${depositCount2}`,
  )
  console.log("")

  // Extrinsic Events
  const extrinsicEvents2 = await block.events().extrinsic(1)
  if (extrinsicEvents2 instanceof AvailError) throw extrinsicEvents2
  const first = extrinsicEvents2.first(avail.balances.events.Withdraw)
  const last = extrinsicEvents2.last(avail.system.events.ExtrinsicSuccess)
  const all = extrinsicEvents2.all(avail.balances.events.Deposit)
  if (first == null || last == null) throw "Failed to find event"
  if (all instanceof AvailError) throw all

  console.log(
    `Withdraw Amount: ${first.amount}, Extrinsic Weight: ${last.dispatchInfo.weight.refTime}, Deposits Count: ${all.length}`,
  )

  // 1. Decoding ExtrinsicSuccess event
  const extrinisc0Events = await block.events().extrinsic(0)
  const extrinisc1Events = await block.events().extrinsic(1)
  if (extrinisc0Events instanceof AvailError) throw extrinisc0Events
  if (extrinisc1Events instanceof AvailError) throw extrinisc1Events

  const event0 = extrinisc0Events.first(avail.system.events.ExtrinsicSuccess)
  const event1 = extrinisc1Events.first(avail.system.events.ExtrinsicSuccess)
  if (event0 == null || event1 == null) throw "Failed to find events"
  console.log(
    `1. Timestamp::Set Weight: ${event0.dispatchInfo.weight.refTime}, DataAvailability::SubmitData Weight: ${event1.dispatchInfo.weight.refTime}`,
  )

  // 2. Decoding Balances::Deposit Event
  console.log(`Displaying all Balances::Deposit events`)
  const extrinsicEvents3 = await block.events().extrinsic(1)
  if (extrinsicEvents3 instanceof AvailError) throw extrinsicEvents3
  const deposits = extrinsicEvents3.all(avail.balances.events.Deposit)
  if (deposits instanceof AvailError) throw deposits
  for (const deposit of deposits) {
    console.log(`2. Account ID: ${deposit.who}, Amount: ${deposit.amount.toString()}`)
  }
  console.log("")

  // 3. Decoding  DataAvailability::DataSubmitted Event
  console.log("Displaying DataAvailability::DataSubmitted event")
  const extrinsicEvents4 = await block.events().extrinsic(1)
  if (extrinsicEvents4 instanceof AvailError) throw extrinsicEvents4
  const event = extrinsicEvents4.first(avail.dataAvailability.events.DataSubmitted)
  if (event == null) throw "Failed to find events"
  console.log(`3. Who: ${event.who}, Data Hash: ${event.dataHash}`)
  console.log("")

  // 4. Decoding TransactionPayment::TransactionFeePaid Event
  console.log("Displaying TransactionPayment::TransactionFeePaid event")
  const extrinsicEvents5 = await block.events().extrinsic(1)
  if (extrinsicEvents5 instanceof AvailError) throw extrinsicEvents5
  const event3 = extrinsicEvents5.first(avail.transactionPayment.events.TransactionFeePaid)
  if (event3 == null) throw "Failed to find events"
  console.log(`4. Who: ${event3.who}, Actual Fee: ${event3.actualFee.toString()}, Tip: ${event3.tip.toString()}`)
  console.log("")

  // Block System Events
  console.log("Displaying block system event")
  const systemEvents = await block.events().system()
  if (systemEvents instanceof AvailError) throw systemEvents
  const event4 = systemEvents.first(avail.treasury.events.UpdatedInactive)
  if (event4 == null) throw "Failed to find events"
  console.log(`5. Reactivated: ${event4.reactivated.toString()}, Deactivated: ${event4.deactivated.toString()}`)
  console.log("")

  // All Events (both Extrinsic and Block)
  console.log(`Iterating over all extrinsic index 0 events`)
  const events = await block.events().extrinsic(0)
  if (events instanceof AvailError) throw events
  for (const event of events.events) {
    console.log(
      `  Index: ${event.index}, Pallet ID: ${event.palletId}, Variant ID: ${event.variantId}, Data Length: ${event.data.length}, Phase: ${event.phase}`,
    )

    if (
      event.palletId == avail.balances.events.Withdraw.palletId() &&
      event.variantId == avail.balances.events.Withdraw.variantId()
    ) {
      const withdraw = IEvent.decode(avail.balances.events.Withdraw, event.data)
      if (withdraw == null) throw "Failed to decode event"
      console.log(`    6. Who: ${withdraw.who}, amount: ${withdraw.amount}`)
    }
  }

  console.log(`Iterating over all block system events`)
  const events2 = await block.events().system()
  if (events2 instanceof AvailError) throw events
  for (const event of events2.events) {
    console.log(
      `  Index: ${event.index}, Pallet ID: ${event.palletId}, Variant ID: ${event.variantId}, Data Length: ${event.data.length}, Phase: ${event.phase}`,
    )

    if (
      event.palletId == avail.balances.events.Withdraw.palletId() &&
      event.variantId == avail.balances.events.Withdraw.variantId()
    ) {
      const withdraw = IEvent.decode(avail.balances.events.Withdraw, event.data)
      if (withdraw == null) throw "Failed to decode event"
      console.log(`    6. Who: ${withdraw.who}, amount: ${withdraw.amount}`)
    }
  }

  console.log(`Iterating over all events (both extrinsic and system events)`)
  const events3 = await block.events().all("All")
  if (events3 instanceof AvailError) throw events
  for (const event of events3) {
    console.log(
      `  Index: ${event.index}, Pallet ID: ${event.palletId}, Variant ID: ${event.variantId}, Data Length: ${event.data.length}, Phase: ${event.phase}`,
    )

    if (
      event.palletId == avail.balances.events.Withdraw.palletId() &&
      event.variantId == avail.balances.events.Withdraw.variantId()
    ) {
      const withdraw = IEvent.decode(avail.balances.events.Withdraw, event.data)
      if (withdraw == null) throw "Failed to decode event"
      console.log(`    6. Who: ${withdraw.who}, amount: ${withdraw.amount}`)
    }
  }

  process.exit()
}

main().catch((e) => console.log(e))

/* 
  Expected Output:

  Extrinsic 0 events: 
  Extrinsic Success present: true, Extrinsic Failed present: false, Multisig Executed present: null, Proxy Executed present: null, Balances Deposit present: false
  Total count: 1, Success count: 1, Deposit Count: 0

  Extrinsic 1 events: 
  Extrinsic Success present: true, Extrinsic Failed present: false, Multisig Executed present: null, Proxy Executed present: null, Balances Deposit present: true
  Total count: 7, Success count: 1, Deposit Count: 3

  Withdraw Amount: 124711139352751361, Extrinsic Weight: 13057471500, Deposits Count: 3
  1. Timestamp::Set Weight: 12606212000, DataAvailability::SubmitData Weight: 13057471500
  Displaying all Balances::Deposit events
  2. Account ID: 5EZZm8AKzZw8ti9PSmTZdXCgNEeaE3vs5sNxqkQ6u5NhG8kT, Amount: 0
  2. Account ID: 5EYCAe5ijiYfyeZ2JJCGq56LmPyNRAKzpG4QkoQkkQNB5e6Z, Amount: 99768911482201088
  2. Account ID: 5Ew2zpT4iT7fRLqD81fzq7rGViVj4MSLKMJn6tZdadbQLy8B, Amount: 24942227870550273

  Displaying DataAvailability::DataSubmitted event
  3. Who: 5EZZm8AKzZw8ti9PSmTZdXCgNEeaE3vs5sNxqkQ6u5NhG8kT, Data Hash: 0x14e3128c0c0f5840c1594420546b1dbd2ed60ac6f8f9095a06db7ad1a19032bf

  Displaying TransactionPayment::TransactionFeePaid event
  4. Who: 5EZZm8AKzZw8ti9PSmTZdXCgNEeaE3vs5sNxqkQ6u5NhG8kT, Actual Fee: 124711139352751361, Tip: 0

  Displaying block system event
  5. Reactivated: 292332715967391734000945630, Deactivated: 292332716069790243286966271

  Iterating over all extrinsic index 0 events
    Index: 1, Pallet ID: 0, Variant ID: 0, Data Length: 30, Phase: 0
  Iterating over all block system events
    Index: 0, Pallet ID: 18, Variant ID: 8, Data Length: 68, Phase: Initialization
  Iterating over all events (both extrinsic and system events)
    Index: 0, Pallet ID: 18, Variant ID: 8, Data Length: 68, Phase: Initialization
    Index: 1, Pallet ID: 0, Variant ID: 0, Data Length: 30, Phase: 0
    Index: 2, Pallet ID: 6, Variant ID: 8, Data Length: 100, Phase: 1
      6. Who: 5EZZm8AKzZw8ti9PSmTZdXCgNEeaE3vs5sNxqkQ6u5NhG8kT, amount: 124711139352751361
    Index: 3, Pallet ID: 29, Variant ID: 1, Data Length: 132, Phase: 1
    Index: 4, Pallet ID: 6, Variant ID: 7, Data Length: 100, Phase: 1
    Index: 5, Pallet ID: 6, Variant ID: 7, Data Length: 100, Phase: 1
    Index: 6, Pallet ID: 6, Variant ID: 7, Data Length: 100, Phase: 1
    Index: 7, Pallet ID: 7, Variant ID: 0, Data Length: 132, Phase: 1
    Index: 8, Pallet ID: 0, Variant ID: 0, Data Length: 36, Phase: 1
    Index: 9, Pallet ID: 0, Variant ID: 0, Data Length: 28, Phase: 2
*/
