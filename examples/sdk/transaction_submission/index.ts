import { assertEq } from ".."
import { avail, Client, AvailError, LOCAL_ENDPOINT, alice, interfaces } from "./../../../src/sdk"

const main = async () => {
  const client = await Client.create(LOCAL_ENDPOINT)
  if (client instanceof AvailError) throw client
  const signer = alice()

  // Transaction Creation
  const submittableTx = client.tx().dataAvailability().submitData("abc")

  // Transaction Submission
  const submittedTx = await submittableTx.signAndSubmit(signer, { app_id: 2 })
  if (submittedTx instanceof AvailError) throw submittedTx
  console.log(
    `Tx Hash: ${submittedTx.txHash}, Account Address: ${submittedTx.accountId}, Used Options: ${JSON.stringify(submittedTx.signatureOptions)}`,
  )

  // Fetching Transaction Receipt
  const receipt = (await submittedTx.receipt(false))!
  if (receipt instanceof AvailError) throw receipt
  console.log(
    `Block Hash: ${receipt.blockRef.hash}, Block Height: ${receipt.blockRef.height}, Tx Hash: ${receipt.txRef.hash}, Tx Index: $${receipt.txRef.index}`,
  )

  // Fetching Block State
  const blockState = await receipt.blockState()
  if (blockState instanceof AvailError) throw blockState
  switch (blockState) {
    case "Included":
      console.log("Block is included but not finalized")
      break
    case "Finalized":
      console.log("Block is finalized")
      break
    case "Discarded":
      console.log("Block is discarded")
      break
    case "DoesNotExist":
      console.log("Block does not exist")
      break
  }

  // Fetching and displaying Transaction Events
  const events = await receipt.events()
  if (events instanceof AvailError) throw events
  for (const event of events.events) {
    console.log(`Pallet Index: ${event.palletId}, Variant Index: ${event.variantId}`)

    const decodedEvent = interfaces.IEvent.decode(avail.dataAvailability.events.DataSubmitted, event.data!)
    if (decodedEvent != null) {
      console.log(`Who: ${decodedEvent.who}, Data Hash: ${decodedEvent.dataHash}`)
    }
  }

  // Fetching the same transaction from the block
  const tx = await receipt.tx(avail.dataAvailability.tx.SubmitData)
  if (tx instanceof AvailError) throw tx
  assertEq(new TextDecoder().decode(tx.call.data), "abc")

  process.exit(0)
}

main()
