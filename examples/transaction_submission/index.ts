import { Client, LOCAL_ENDPOINT, GeneralError } from "./../../src"
import { avail, alice, EventCodec } from "../../src/core"
import { assertEq } from "./../index"

const main = async () => {
  const client = await Client.create(LOCAL_ENDPOINT)
  if (client instanceof GeneralError) throw new Error(client.value)
  const signer = alice()

  // Transaction Creation
  const submittableTx = client.tx().dataAvailability().submitData("abc")

  // Transaction Submission
  const submittedTx = await submittableTx.signAndSubmit(signer, { app_id: 2 })
  if (submittedTx instanceof GeneralError) throw new Error(submittedTx.value)
  console.log(
    `Tx Hash: ${submittedTx.txHash}, Account Address: ${submittedTx.accountId}, Used Options: ${submittedTx.options}`,
  )

  // Fetching Transaction Receipt
  const receipt = (await submittedTx.receipt(false))!
  if (receipt instanceof GeneralError) throw new Error(receipt.value)
  console.log(
    `Block Hash: ${receipt.blockRef.hash}, Block Height: ${receipt.blockRef.height}, Tx Hash: ${receipt.txRef.hash}, Tx Index: $${receipt.txRef.index}`,
  )

  // Fetching Block State
  const blockState = await receipt.blockState()
  if (blockState instanceof GeneralError) throw new Error(blockState.value)
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
  if (events instanceof GeneralError) throw new Error(events.value)
  for (const event of events) {
    console.log(`Pallet Index: ${event.emitted_index[0]}, Variant Index: ${event.emitted_index[1]}`)

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
  if (blockTx instanceof GeneralError) throw new Error(blockTx.value)
  assertEq(new TextDecoder().decode(blockTx[0].call.data), "abc")

  process.exit(0)
}

main()
