import { Client, LOCAL_ENDPOINT, ONE_AVAIL } from "./../../src"
import { GeneralError, avail, Hex, alice, EventCodec } from "./../../src/core"

const main = async () => {
  const client = await Client.create(LOCAL_ENDPOINT)
  if (client instanceof GeneralError) throw new Error(client.value)

  const balances = client.tx().balances()
  const c1 = balances.transferKeepAlive("5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty", ONE_AVAIL)
  const c2 = balances.transferKeepAlive("5DAAnrj7VHTznn2AWBemMuyBwZWs6FNFjdyVXUeYum3PTXFy", ONE_AVAIL)
  const tx = client.tx().utility().batchAll([c1, c2])

  const st = await tx.signAndSubmit(alice(), {})
  if (st instanceof GeneralError) throw new Error(st.value)

  const receipt = (await st.receipt(true))!
  if (receipt instanceof GeneralError) throw new Error(receipt.value)

  const blockState = await receipt.blockState()
  if (blockState instanceof GeneralError) throw new Error(blockState.value)
  console.log("Block State: " + blockState)

  const events = await receipt.txEvents()
  if (events instanceof GeneralError) throw new Error(events.value)

  // Fetching and displaying Transaction Events
  for (const event of events) {
    console.log(`Pallet Index: ${event.emitted_index[0]}, Variant Index: ${event.emitted_index[1]} `)
    const scaleEncodedEvent = Hex.decode(event.encoded!)
    if (scaleEncodedEvent instanceof GeneralError) throw new Error(scaleEncodedEvent.value)

    if (EventCodec.decodeScale(avail.utility.events.BatchInterrupted, scaleEncodedEvent) != null) {
      console.log("Found BatchInterrupted events")
    }

    if (EventCodec.decodeScale(avail.utility.events.BatchCompleted, scaleEncodedEvent) != null) {
      console.log("Found BatchCompleted events")
    }

    if (EventCodec.decodeScale(avail.utility.events.BatchCompletedWithErrors, scaleEncodedEvent) != null) {
      console.log("Found BatchCompletedWithErrors events")
    }

    if (EventCodec.decodeScale(avail.utility.events.ItemCompleted, scaleEncodedEvent) != null) {
      console.log("Found ItemCompleted events")
    }

    if (EventCodec.decodeScale(avail.utility.events.ItemFailed, scaleEncodedEvent) != null) {
      console.log("Found ItemFailed events")
    }

    if (EventCodec.decodeScale(avail.utility.events.DispatchedAs, scaleEncodedEvent) != null) {
      console.log("Found DispatchedAs events")
    }
  }

  // Decoding batch call
  const blockClient = client.blockClient()
  const result = (await blockClient.transactionStatic(
    avail.utility.tx.BatchAll,
    receipt.blockRef.hash,
    receipt.txRef.index,
  ))!
  if (result instanceof GeneralError) throw new Error(result.value)
  const [decodedTransaction, _] = result

  // Not all calls are decodable.
  const decodedCalls = decodedTransaction.call.decodeCalls()
  if (decodedCalls instanceof GeneralError) throw new Error(decodedCalls.value)

  for (const call of decodedCalls) {
    const c = call.BalancesTransferKeepAlive
    if (c == null) {
      throw new Error("Expected Balance Transfer Keep Alive")
    }

    console.log(`Dest: ${c.dest.asId().toSS58()}, Amount: ${c.value}`)
  }

  process.exit(0)
}

main()
