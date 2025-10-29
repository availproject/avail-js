import { AvailError, Client, TURING_ENDPOINT, avail } from "avail-js"
import { BlockExtrinsic } from "avail-js/block"

async function main() {
  const client = await Client.create(TURING_ENDPOINT)
  if (client instanceof AvailError) throw AvailError

  const block = client.block(2470159)
  const query = block.extrinsics()

  const count = await query.count(avail.dataAvailability.tx.SubmitData)
  const exists = await query.exists(avail.dataAvailability.tx.CreateApplicationKey)
  if (count instanceof AvailError) throw count
  if (exists instanceof AvailError) throw exists

  console.log(`Block 2470159 has ${count} DataAvailability::SubmitData extrinsics`)
  console.log(`Does Block 2470159 have DataAvailability::CreateApplicationKey extrinsics? ${exists}`)
  console.log("")

  // 1
  const timestamp = await query.get(avail.timestamp.tx.Set, 0)
  if (timestamp instanceof AvailError) throw timestamp
  if (timestamp == null) throw "Failed to find timestamp ext"
  printoutDetails(timestamp)
  console.log(`Get: Timestamp::Set now: ${timestamp.call.now}`)
  console.log("")

  // 2
  const submitData1 = await query.first(avail.dataAvailability.tx.SubmitData)
  if (submitData1 instanceof AvailError) throw submitData1
  if (submitData1 == null) throw "Failed to find submit data ext"
  printoutDetails(submitData1)
  console.log(`First: DataAvailability::SubmitData data len: ${submitData1.call.data.length}`)

  const submitData2 = await query.last(avail.dataAvailability.tx.SubmitData)
  if (submitData2 instanceof AvailError) throw submitData2
  if (submitData2 == null) throw "Failed to find submit data ext"
  printoutDetails(submitData2)
  console.log(`Last: DataAvailability::SubmitData data len: ${submitData2.call.data.length}`)
  console.log("")

  // 3
  const allSubmitData = await query.all(avail.dataAvailability.tx.SubmitData)
  if (allSubmitData instanceof AvailError) throw submitData2
  allSubmitData.forEach((x) => printoutDetails(x))
  console.log(
    `Last from All: DataAvailability::SubmitData data len: ${allSubmitData[allSubmitData.length - 1].call.data.length}`,
  )
  console.log("")

  process.exit()
}

main().catch((e) => console.log(e))

function printoutDetails<T>(bext: BlockExtrinsic<T>) {
  console.log(
    `Ext Index: ${bext.extIndex()}, Ext Call Pallet ID: ${bext.header()[0]}, Ext Call Variant ID: ${bext.header()[1]}, App ID: ${bext.appId()}`,
  )
}

/* 
  Expected Output:

  Block 2470159 has 6 DataAvailability::SubmitData extrinsics
  Does Block 2470159 have DataAvailability::CreateApplicationKey extrinsics? false

  Ext Index: 0, Ext Call Pallet ID: 3, Ext Call Variant ID: 0, App ID: null
  Get: Timestamp::Set now: 1761144640000

  Ext Index: 1, Ext Call Pallet ID: 29, Ext Call Variant ID: 1, App ID: 1
  First: DataAvailability::SubmitData data len: 5
  Ext Index: 6, Ext Call Pallet ID: 29, Ext Call Variant ID: 1, App ID: 246
  Last: DataAvailability::SubmitData data len: 1578

  Ext Index: 1, Ext Call Pallet ID: 29, Ext Call Variant ID: 1, App ID: 1
  Ext Index: 2, Ext Call Pallet ID: 29, Ext Call Variant ID: 1, App ID: 2
  Ext Index: 3, Ext Call Pallet ID: 29, Ext Call Variant ID: 1, App ID: 246
  Ext Index: 4, Ext Call Pallet ID: 29, Ext Call Variant ID: 1, App ID: 246
  Ext Index: 5, Ext Call Pallet ID: 29, Ext Call Variant ID: 1, App ID: 246
  Ext Index: 6, Ext Call Pallet ID: 29, Ext Call Variant ID: 1, App ID: 246
  Last from All: DataAvailability::SubmitData data len: 1578
*/
