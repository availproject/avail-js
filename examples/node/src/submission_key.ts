import { avail, AvailError, Client, Keyring, TURING_ENDPOINT } from "avail-js"

async function main() {
  const client = await Client.create(TURING_ENDPOINT)
  if (client instanceof AvailError) throw client

  // Submission
  const key = new Date().toTimeString()
  const submittable = client.tx().dataAvailability().createApplicationKey(key)
  const signer = new Keyring({ type: "sr25519" }).addFromUri("//Bob")
  const submitted = await submittable.signAndSubmit(signer)
  if (submitted instanceof AvailError) throw submitted
  console.log(`Ext Hash: ${submitted.extHash}`)

  // Getting Extrinsic Receipt
  const receipt = await submitted.receipt(false)
  if (receipt instanceof AvailError) throw receipt
  if (receipt == null) throw "Extrinsic was dropped"
  const blockState = await receipt.blockState()
  if (blockState instanceof AvailError) throw blockState
  console.log(`Block State: ${blockState}`)
  console.log(
    `Block Height: ${receipt.blockHeight}, Block Hash: ${receipt.blockHash}, Ext Hash: ${receipt.extHash}, Ext Index: ${receipt.extIndex}`,
  )

  // Fetching Extrinsic Events
  const events = await receipt.events()
  if (events instanceof AvailError) throw events
  const event = events.first(avail.dataAvailability.events.ApplicationKeyCreated)
  if (event == null) throw "Failed to find DataSubmitted event"
  console.log(
    `Is Successful: ${events.isExtrinsicSuccessPresent()}, Id: ${event.id}, Key: ${new TextDecoder().decode(event.key)}, Owner: ${event.owner}`,
  )

  // Fetching Extrinsic itself
  const ext = await receipt.extrinsic(avail.dataAvailability.tx.CreateApplicationKey)
  if (ext instanceof AvailError) throw ext
  console.log(`Key: ${new TextDecoder().decode(ext.call.key)}`)

  process.exit()
}

main().catch((e) => console.log(e))

/* 
  Expected Output:

  Ext Hash: 0x45275496fab89134980ce4c9851da678237341bb331e628540a5a09d7448939f
  Block State: Finalized
  Block Height: 2499418, Block Hash: 0x49b3b8a05b959750e8042e132e4140bfe390697e5cdfdf68bd331853353e758c, Ext Hash: 0x45275496fab89134980ce4c9851da678237341bb331e628540a5a09d7448939f, Ext Index: 1
  Is Successful: true, Id: 497, Key: 10:23:58 GMT+0100 (Central European Standard Time), Owner: 5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty
  Key: 10:23:58 GMT+0100 (Central European Standard Time)
*/
