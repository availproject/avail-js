import { isOk } from ".."
import ClientError from "../../../src/sdk/error"
import { EventCodec } from "../../../src/sdk/interface"
import { pallets } from "../../../src/sdk/types"
import { Hex } from "../../../src/sdk/utils"
import { avail, Client, LOCAL_ENDPOINT, ONE_AVAIL } from "./../../../src/sdk"
import { alice } from "./../../../src/sdk/accounts"

const main = async () => {
  const client = isOk(await Client.create(LOCAL_ENDPOINT))

  const balances = client.tx().balances
  const c1 = balances.transferKeepAlive("5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty", ONE_AVAIL)
  const c2 = balances.transferKeepAlive("5DAAnrj7VHTznn2AWBemMuyBwZWs6FNFjdyVXUeYum3PTXFy", ONE_AVAIL)
  const tx = client.tx().utility.batchAll([c1, c2])

  const st = isOk(await tx.signAndSubmit(alice(), {}))
  const receipt = isOk(await st.receipt(true))!
  const blockState = isOk(await receipt.blockState())
  console.log("Block State: " + blockState)

  const events = isOk(await receipt.txEvents())
  // Fetching and displaying Transaction Events
  for (const event of events) {
    console.log(`Pallet Index: ${event.palletId}, Variant Index: ${event.variantId} `)
    const scaleEncodedEvent = isOk(Hex.decode(event.encoded!))

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
  if (result instanceof ClientError) throw result
  const [decodedTransaction, _] = result

  // Not all calls are decodable.
  const decodedCalls = isOk(decodedTransaction.call.decodeCalls())

  for (const call of decodedCalls) {
    if (!(call instanceof pallets.balances.tx.TransferKeepAlive))
      throw new Error("Expected Balance Transfer Keep Alive")
    console.log(`Dest: ${call.dest.asId().toSS58()}, Amount: ${call.value}`)
  }

  process.exit(0)
}

main()
