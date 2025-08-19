import { assertEq } from ".."
import ClientError from "../../../src/sdk/error"
import { EventCodec } from "../../../src/sdk/interface"
import { avail, Client, LOCAL_ENDPOINT } from "./../../../src/sdk"
import { alice } from "./../../../src/sdk/accounts"

const main = async () => {
  const client = await Client.create(LOCAL_ENDPOINT)
  if (client instanceof ClientError) throw client
  const signer = alice()

  // Transaction Creation
  const submittableTx = client.tx().dataAvailability.submitData("abc")

  // Transaction Submission
  const submittedTx = await submittableTx.signAndSubmit(signer, { app_id: 2 })
  if (submittedTx instanceof ClientError) throw submittedTx
  console.log(
    `Tx Hash: ${submittedTx.txHash}, Account Address: ${submittedTx.accountId}, Used Options: ${submittedTx.options}`,
  )

  // Fetching Transaction Receipt
  const receipt = (await submittedTx.receipt(false))!
  if (receipt instanceof ClientError) throw receipt
  console.log(
    `Block Hash: ${receipt.blockRef.hash}, Block Height: ${receipt.blockRef.height}, Tx Hash: ${receipt.txRef.hash}, Tx Index: $${receipt.txRef.index}`,
  )

  // Fetching Block State
  const blockState = await receipt.blockState()
  if (blockState instanceof ClientError) throw blockState
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
  const events = await receipt.txEvents()
  if (events instanceof ClientError) throw events
  for (const event of events) {
    console.log(`Pallet Index: ${event.palletId}, Variant Index: ${event.variantId}`)

    const decodedEvent = EventCodec.decodeHex(avail.dataAvailability.events.DataSubmitted, event.encoded!)
    if (decodedEvent != null) {
      console.log(`Who: ${decodedEvent.who}, Data Hash: ${decodedEvent.dataHash}`)
    }
  }

  // Fetching the same transaction from the block
  const blockClient = client.blockClient()
  const blockTx = (await blockClient.transactionStatic(
    avail.dataAvailability.tx.SubmitData,
    receipt.blockRef.hash,
    receipt.txRef.index,
  ))!
  if (blockTx instanceof ClientError) throw blockTx
  assertEq(new TextDecoder().decode(blockTx[0].call.data), "abc")

  process.exit(0)
}

main()
