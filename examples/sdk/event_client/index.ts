import { isOk } from ".."
import { TransactionEvent } from "../../../src/sdk/clients/event_client"
import { IEvent } from "../../../src/sdk/interface"
import { PhaseEvents } from "../../../src/sdk/rpc/system/fetch_events"
import { avail, Client, LOCAL_ENDPOINT } from "./../../../src/sdk"
import { alice } from "./../../../src/sdk/accounts"

const main = async () => {
  const client = isOk(await Client.create(LOCAL_ENDPOINT))

  // Submit Transaction
  const tx = client.tx().dataAvailability().submitData("My Data")
  const submitted = isOk(await tx.signAndSubmit(alice(), { app_id: 2 }))
  const receipt = isOk((await submitted.receipt(true))!)

  // Fetching transaction events directly via receipt
  const events = isOk(await receipt.txEvents())
  displayTransactionEvents(events.events)

  // Fetching transaction events via event client
  const eventClient = client.eventClient()
  const events2 = isOk((await eventClient.transactionEvents(receipt.blockRef.hash, receipt.txRef.index))!)
  displayTransactionEvents(events2.events)

  // Find Block related events
  const blockEvents = isOk(
    await eventClient.blockEvents(receipt.blockRef.hash, {
      enableEncoding: true,
      enableDecoding: true,
    }),
  )
  blockEvents.list.forEach(displayPhaseEvents)

  process.exit(0)
}

function displayTransactionEvents(events: TransactionEvent[]) {
  for (const event of events) {
    console.log(`Event Index: ${event.index}, Pallet Id: ${event.palletId}, Variant Id: ${event.variantId}`)
    console.log(`Event (hex and string) data: ${event.data}`)

    const extSuccess = IEvent.decode(avail.system.events.ExtrinsicSuccess, event.data)
    if (extSuccess != null) {
      console.log(`Weight: ${extSuccess.dispatchInfo.weight}`)
    }
    const dataSubmitted = IEvent.decode(avail.dataAvailability.events.DataSubmitted, event.data)
    if (dataSubmitted != null) {
      console.log(`Who: ${dataSubmitted.who}, Data Hash: ${dataSubmitted.dataHash}`)
    }
  }
}

function displayPhaseEvents(phase: PhaseEvents) {
  for (const event of phase.events) {
    console.log(`Event Index: ${event.index}, Pallet Id: ${event.palletId}, Variant Id: ${event.variantId}`)
    console.log(`Event (hex and string) encoded data: 0x${event.encodedData}`)
    if (event.decodedData != null) {
      console.log(`Event (hex and string) decoded data: ${event.decodedData}`)
    }

    const extSuccess = IEvent.decode(avail.system.events.ExtrinsicSuccess, event.encodedData!)
    if (extSuccess != null) {
      console.log(`Weight: ${extSuccess.dispatchInfo.weight}`)
    }
    const dataSubmitted = IEvent.decode(avail.dataAvailability.events.DataSubmitted, event.encodedData!)
    if (dataSubmitted != null) {
      console.log(`Who: ${dataSubmitted.who}, Data Hash: ${dataSubmitted.dataHash}`)
    }
  }
}

main()
