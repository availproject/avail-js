import { avail, AvailError, Client, Keyring, TURING_ENDPOINT } from "avail-js"

async function main() {
  const client = await Client.create(TURING_ENDPOINT)
  if (client instanceof AvailError) throw AvailError

  // 1 Submittable
  const submittable = client.tx().dataAvailability().submitData("My data");
  const callHash = submittable.callHash()
  const estimatedFee = await submittable.estimateCallFees()
  const weight = await submittable.callInfo()
  if (estimatedFee instanceof AvailError) throw estimatedFee
  if (weight instanceof AvailError) throw weight
  console.log(`Call Hash: ${callHash.toString()}, Estimated Fee: ${estimatedFee.finalFee()?.toString()}, Weight: ${weight.weight.refTime.toString()}`)

  // 2 Submitting
  const signer = new Keyring({ type: "sr25519" }).addFromUri("//Bob")
  const submitted = await submittable.signAndSubmit(signer, { app_id: 2 })
  if (submitted instanceof AvailError) throw submitted
  console.log(`Ext Hash: ${submitted.extHash}, Account Id: ${submitted.accountId}, Nonce: ${submitted.signatureOptions.nonce}, App Id: ${submitted.signatureOptions.app_id}`)

  // 3 Getting Extrinsic Receipt
  const receipt = await submitted.receipt(false)
  if (receipt instanceof AvailError) throw receipt
  if (receipt == null) throw "Extrinsic was dropped"
  const blockState = await receipt.blockState()
  if (blockState instanceof AvailError) throw blockState
  console.log(`Block State: ${blockState}`)
  console.log(`Block Height: ${receipt.blockHeight}, Block Hash: ${receipt.blockHash}, Ext Hash: ${receipt.extHash}, Ext Index: ${receipt.extIndex}`)

  // 4 Fetching Extrinsic Events
  const events = await receipt.events()
  if (events instanceof AvailError) throw events
  const event = events.first(avail.dataAvailability.events.DataSubmitted)
  if (event == null) throw "Failed to find DataSubmitted event"
  console.log(`Is Successful: ${events.isExtrinsicSuccessPresent()}, Who: ${event.who}, Data Hash: ${event.dataHash}`)

  // 5 Fetching Extrinsic itself
  const ext = await receipt.extrinsic(avail.dataAvailability.tx.SubmitData)
  if (ext instanceof AvailError) throw ext
  console.log(`Data: ${new TextDecoder().decode(ext.call.data)}`)

  process.exit()
}

main().catch((e) => console.log(e))

/* 
  Expected Output:

  Call Hash: 0x3ef6074c55575799d2e1cfca27b36e95e8c713acf9ae101f14d8e886db8fd6c4, Estimated Fee: 124424705632400689, Weight: 32423250
  Ext Hash: 0x5f6a168aa78ab6bea997674847a6342db6e5c1c64548e16464f25f2e389fcf90, Account Id: 5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty, Nonce: 513, App Id: 2
  Block State: Finalized
  Block Height: 2499396, Block Hash: 0x4b8c9eee999b428a4bbe2fe82dc7518c0f3520b9b0664ae7e4ac3fe502323983, Ext Hash: 0x5f6a168aa78ab6bea997674847a6342db6e5c1c64548e16464f25f2e389fcf90, Ext Index: 1
  Is Successful: true, Who: 5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty, Data Hash: 0xe91967d389a73e279a69db56c95ed7f37b09d737f12ee0b483f35554522da01f
  Data: My data
*/
