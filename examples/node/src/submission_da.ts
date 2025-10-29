import { avail, AvailError, Client, Keyring, TURING_ENDPOINT } from "avail-js"

async function main() {
  const client = await Client.create(TURING_ENDPOINT)
  if (client instanceof AvailError) throw AvailError

  // Submission
  const submittable = client.tx().dataAvailability().submitData("My data");
  const signer = new Keyring({ type: "sr25519" }).addFromUri("//Bob")
  const submitted = await submittable.signAndSubmit(signer, { app_id: 2 })
  if (submitted instanceof AvailError) throw submitted
  console.log(`Ext Hash: ${submitted.extHash}`)

  // Getting Extrinsic Receipt
  const receipt = await submitted.receipt(false)
  if (receipt instanceof AvailError) throw receipt
  if (receipt == null) throw "Extrinsic was dropped"
  const blockState = await receipt.blockState()
  if (blockState instanceof AvailError) throw blockState
  console.log(`Block State: ${blockState}`)
  console.log(`Block Height: ${receipt.blockHeight}, Block Hash: ${receipt.blockHash}, Ext Hash: ${receipt.extHash}, Ext Index: ${receipt.extIndex}`)


  // Fetching Extrinsic Events
  const events = await receipt.events()
  if (events instanceof AvailError) throw events
  const event = events.first(avail.dataAvailability.events.DataSubmitted)
  if (event == null) throw "Failed to find DataSubmitted event"
  console.log(`Is Successful: ${events.isExtrinsicSuccessPresent()}, Who: ${event.who}, Data Hash: ${event.dataHash}`)

  // Fetching Extrinsic itself
  const ext = await receipt.extrinsic(avail.dataAvailability.tx.SubmitData)
  if (ext instanceof AvailError) throw ext
  console.log(`Data: ${new TextDecoder().decode(ext.call.data)}`)

  process.exit()
}

main().catch((e) => console.log(e))

/* 
  Expected Output:

  Ext Hash: 0x3702d69eb6d417e40dd8362649535277e9a0371bc71b2fa899272b57dbb6ee95
  Block State: Finalized
  Block Height: 2499432, Block Hash: 0x2a5a9357aff6e15284a7df416a677021398620479170012155c70c00fc009c50, Ext Hash: 0x3702d69eb6d417e40dd8362649535277e9a0371bc71b2fa899272b57dbb6ee95, Ext Index: 1
  Is Successful: true, Amount: 1000000000000000000, From: 5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty, To: 5Ev2jfLbYH6ENZ8ThTmqBX58zoinvHyqvRMvtoiUnLLcv1NJ
  Dest: 5Ev2jfLbYH6ENZ8ThTmqBX58zoinvHyqvRMvtoiUnLLcv1NJ, Value: 1000000000000000000
*/
