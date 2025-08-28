import { isOk } from ".."
import { RuntimeEvent } from "../../../src/sdk/clients/event_client"
import { EventCodec } from "../../../src/sdk/interface"
import { avail, Client, LOCAL_ENDPOINT } from "./../../../src/sdk"
import { alice } from "./../../../src/sdk/accounts"

const main = async () => {
  const client = isOk(await Client.create(LOCAL_ENDPOINT))

  // Submit Transaction
  const tx = client.tx.dataAvailability.submitData("My Data")
  const submitted = isOk(await tx.signAndSubmit(alice(), { app_id: 2 }))
  const receipt = isOk((await submitted.receipt(true))!)

  // Fetching transaction events directly via receipt
  const events = isOk(await receipt.txEvents())
  display_events(events)

  // Fetching transaction events via event client
  const eventClient = client.eventClient()
  const events2 = isOk((await eventClient.transactionEvents(receipt.blockRef.hash, receipt.txRef.index))!)
  display_events(events2)

  // Find Block related events
  const blockEvents = isOk(
    await eventClient.blockEvents(receipt.blockRef.hash, {
      enableDecoding: true,
      enableEncoding: true,
    }),
  )
  for (const eventGroup of blockEvents) {
    display_events(eventGroup.events)
  }

  process.exit(0)
}

function display_events(events: RuntimeEvent[]) {
  for (const event of events) {
    console.log(`Event Index: ${event.index}, Pallet Id: ${event.palletId}, Variant Id: ${event.variantId}`)
    console.log(`Event (hex and string) encoded data: 0x${event.encoded}`)
    if (event.decoded != null) {
      console.log(`Event (hex and string) decoded data: ${event.decoded}`)
    }

    const extSuccess = EventCodec.decodeHex(avail.system.events.ExtrinsicSuccess, event.encoded!)
    if (extSuccess != null) {
      console.log(`Weight: ${extSuccess.dispatchInfo.weight}`)
    }
    const dataSubmitted = EventCodec.decodeHex(avail.dataAvailability.events.DataSubmitted, event.encoded!)
    if (dataSubmitted != null) {
      console.log(`Who: ${dataSubmitted.who}, Data Hash: ${dataSubmitted.dataHash}`)
    }
  }
}

main()
