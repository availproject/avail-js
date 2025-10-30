import { AvailError, Client, TURING_ENDPOINT, avail } from "avail-js"
import { BlockEncodedExtrinsic } from "avail-js/block"
import { ICall } from "avail-js/core/interface"

async function main() {
  const client = await Client.create(TURING_ENDPOINT)
  if (client instanceof AvailError) throw client

  const block = client.block(2470159)
  const query = block.encoded()

  const count = await query.count({ appId: 246 })
  const exists = await query.exists({ appId: 246 })
  if (count instanceof AvailError) throw count
  if (exists instanceof AvailError) throw exists

  console.log(`Block 2470159 has ${count} extrinsics with app id 246`)
  console.log(`Does Block 2470159 have extrinsics with app id 100? ${exists}`)
  console.log("")

  // 1
  const bext = await query.get(0)
  if (bext instanceof AvailError) throw bext
  if (bext == null) throw "Failed to find timestamp ext"
  printoutDetails(bext)
  const call = ICall.decode(avail.timestamp.tx.Set, bext.call)
  if (call == null) throw "Failed to decode timestamp call"
  console.log(`Get: Timestamp::Set now: ${call.now}`)
  console.log("")

  // 2
  const filter1: [number, number] = [
    avail.dataAvailability.tx.SubmitData.palletId(),
    avail.dataAvailability.tx.SubmitData.variantId(),
  ]
  const first = await query.first({ filter: { PalletCall: [filter1] } })
  if (first instanceof AvailError) throw first
  if (first == null) throw "Failed to find submit data ext"
  printoutDetails(first)
  const call1 = ICall.decode(avail.dataAvailability.tx.SubmitData, first.call)
  if (call1 == null) throw "Failed to decode SubmitData call"
  console.log(`First: DataAvailability::SubmitData data len: ${call1.data.length}`)

  const filter2: [number, number] = [
    avail.dataAvailability.tx.SubmitData.palletId(),
    avail.dataAvailability.tx.SubmitData.variantId(),
  ]
  const last = await query.last({ filter: { PalletCall: [filter2] } })
  if (last instanceof AvailError) throw last
  if (last == null) throw "Failed to find submit data ext"
  printoutDetails(last)
  const call2 = ICall.decode(avail.dataAvailability.tx.SubmitData, last.call)
  if (call2 == null) throw "Failed to decode SubmitData call"
  console.log(`Last: DataAvailability::SubmitData data len: ${call2.data.length}`)
  console.log("")

  // 3
  const filter3: [number, number] = [
    avail.dataAvailability.tx.SubmitData.palletId(),
    avail.dataAvailability.tx.SubmitData.variantId(),
  ]
  const all = await query.all({ filter: { PalletCall: [filter3] } })
  if (all instanceof AvailError) throw all
  all.forEach(printoutDetails)
  const call3 = ICall.decode(avail.dataAvailability.tx.SubmitData, all[all.length - 1].call)
  if (call3 == null) throw "Failed to decode SubmitData call"
  console.log(`Last from All: DataAvailability::SubmitData data len: ${call3.data.length}`)
  console.log("")

  process.exit()
}

main().catch((e) => console.log(e))

function printoutDetails(bext: BlockEncodedExtrinsic) {
  console.log(`Ext Index: ${bext.extIndex()}, Ext Call Len: ${bext.call.length}, App ID: ${bext.appId()}`)
}

/* 
  Expected Output:

  Block 2470159 has 4 extrinsics with app id 246
  Does Block 2470159 have extrinsics with app id 100? true

  Ext Index: 0, Ext Call Len: 9, App ID: null
  Get: Timestamp::Set now: 1761144640000

  Ext Index: 1, Ext Call Len: 8, App ID: 1
  First: DataAvailability::SubmitData data len: 5
  Ext Index: 6, Ext Call Len: 1582, App ID: 246
  Last: DataAvailability::SubmitData data len: 1578

  Ext Index: 1, Ext Call Len: 8, App ID: 1
  Ext Index: 2, Ext Call Len: 8, App ID: 2
  Ext Index: 3, Ext Call Len: 154, App ID: 246
  Ext Index: 4, Ext Call Len: 375, App ID: 246
  Ext Index: 5, Ext Call Len: 630, App ID: 246
  Ext Index: 6, Ext Call Len: 1582, App ID: 246
  Last from All: DataAvailability::SubmitData data len: 1578
*/
