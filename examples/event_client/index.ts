import { Client, LOCAL_ENDPOINT } from "./../../src"
import { EventCodec, GeneralError, alice, avail } from "../../src/core"
import { RuntimeEvent } from "../../src/client/clients/event_client"

const main = async () => {
  const client = await Client.create(LOCAL_ENDPOINT)
  if (client instanceof GeneralError) throw new Error(client.value)

  // Submit Transaction
  const tx = client.tx().dataAvailability().submitData("My Data")
  const submitted = await tx.signAndSubmit(alice(), { app_id: 2 })
  if (submitted instanceof GeneralError) throw submitted.toError()
  const receipt = (await submitted.receipt(true))!
  if (receipt instanceof GeneralError) throw receipt.toError()

  // Fetching transaction events directly via receipt
  const events = await receipt.txEvents()
  if (events instanceof GeneralError) throw events.toError()
  display_events(events)

  // Fetching transaction events via event client
  const eventClient = client.eventClient()
  const events2 = (await eventClient.transactionEvents(receipt.blockRef.hash, receipt.txRef.index))!
  if (events2 instanceof GeneralError) throw events2.toError()
  display_events(events2)

  // Find Block related events
  const blockEvents = await eventClient.blockEvents(receipt.blockRef.hash, {
    enableDecoding: true,
    enableEncoding: true,
  })
  if (blockEvents instanceof GeneralError) throw blockEvents.toError()
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
