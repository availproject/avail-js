import { AvailError, Client, TURING_ENDPOINT, avail } from "avail-js"
import { BlockEvents } from "avail-js/block"

async function main() {
  const client = await Client.create(TURING_ENDPOINT)
  if (client instanceof AvailError) throw client

  const block = client.block(2470159)
  const palletId = avail.dataAvailability.tx.SubmitData.palletId()
  const variantId = avail.dataAvailability.tx.SubmitData.variantId()
  const encoded = await block.encoded().first({ filter: { PalletCall: [[palletId, variantId]] } })
  if (encoded instanceof AvailError) throw encoded
  if (encoded == null) throw "Failed to find extrinsic"

  const extrinsic = await block.extrinsics().first(avail.dataAvailability.tx.SubmitData)
  if (extrinsic instanceof AvailError) throw extrinsic
  if (extrinsic == null) throw "Failed to find extrinsic"

  const events1 = await encoded.events(client)
  const events2 = await extrinsic.events(client)
  if (events1 instanceof AvailError) throw events1
  if (events2 instanceof AvailError) throw events2
  printoutEvents("encoded", events1)
  printoutEvents("encoded", events2)

  process.exit()
}

main().catch((e) => console.log(e))

function printoutEvents(from: string, events: BlockEvents) {
  console.log(`${from}: `)
  for (const event of events.events) {
    console.log(
      `  Index: ${event.index}, Pallet ID: ${event.palletId}, Variant ID: ${event.variantId}, Data Length: ${event.data.length}, Phase: ${event.phase}`,
    )
  }
}

/* 
  Expected Output:

encoded: 
  Index: 2, Pallet ID: 6, Variant ID: 8, Data Length: 100, Phase: 1
  Index: 3, Pallet ID: 29, Variant ID: 1, Data Length: 132, Phase: 1
  Index: 4, Pallet ID: 6, Variant ID: 7, Data Length: 100, Phase: 1
  Index: 5, Pallet ID: 6, Variant ID: 7, Data Length: 100, Phase: 1
  Index: 6, Pallet ID: 6, Variant ID: 7, Data Length: 100, Phase: 1
  Index: 7, Pallet ID: 7, Variant ID: 0, Data Length: 132, Phase: 1
  Index: 8, Pallet ID: 0, Variant ID: 0, Data Length: 36, Phase: 1
encoded: 
  Index: 2, Pallet ID: 6, Variant ID: 8, Data Length: 100, Phase: 1
  Index: 3, Pallet ID: 29, Variant ID: 1, Data Length: 132, Phase: 1
  Index: 4, Pallet ID: 6, Variant ID: 7, Data Length: 100, Phase: 1
  Index: 5, Pallet ID: 6, Variant ID: 7, Data Length: 100, Phase: 1
  Index: 6, Pallet ID: 6, Variant ID: 7, Data Length: 100, Phase: 1
  Index: 7, Pallet ID: 7, Variant ID: 0, Data Length: 132, Phase: 1
  Index: 8, Pallet ID: 0, Variant ID: 0, Data Length: 36, Phase: 1
*/
