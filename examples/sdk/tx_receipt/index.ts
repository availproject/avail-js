import { assertEq } from ".."
import { avail, Client, ClientError, MAINNET_ENDPOINT, TransactionReceipt } from "./../../../src/sdk"

const main = async () => {
  const client = await Client.create(MAINNET_ENDPOINT)
  if (client instanceof ClientError) throw client

  const receipt = await TransactionReceipt.from(
    client,
    "0x67d2672ae0804677495a0cfe2cf445ed2ce00ea08cfcf18b766501ae20a55a02",
    1865670,
    1865670 + 32,
  )
  if (receipt instanceof ClientError) throw receipt
  if (receipt == null) throw new Error("Failed to find transaction")

  console.log(
    `Block Hash: ${receipt.blockRef.hash}, Block Height: ${receipt.blockRef.height}, Transaction Hash: ${receipt.txRef.hash}, Transaction Index: ${receipt.txRef.index}`,
  )
  console.log(`Block State: ${await receipt.blockState()}`)

  assertEq(receipt.blockRef.hash.toString(), "0x2c9c5002e98cb8fa94ee4f894b7d5521a362f47160dcdc1d2e0edcaeb3a89e7e")
  assertEq(receipt.blockRef.height, 1865675)
  assertEq(receipt.txRef.hash.toString(), "0x67d2672ae0804677495a0cfe2cf445ed2ce00ea08cfcf18b766501ae20a55a02")
  assertEq(receipt.txRef.index, 1)

  // Fetching Transaction
  const tx = await receipt.tx(avail.dataAvailability.tx.SubmitData)
  if (tx instanceof ClientError) return tx

  console.log(`SS58 Address: ${tx.ss58Address}, AppId: ${tx.appId}, Nonce: ${tx.nonce}`)
  console.log(`Data Submission length: ${tx.call.data.length}`)
  assertEq(tx.ss58Address, "5EZZm8AKzZw8ti9PSmTZdXCgNEeaE3vs5sNxqkQ6u5NhG8kT")
  assertEq(tx.appId, 31)
  assertEq(tx.nonce, 158660)
  assertEq(tx.call.data.length, 3846)

  // Fetching Events
  const events = await receipt.txEvents()
  if (events instanceof ClientError) return events
  assertEq(events.isExtrinsicSuccessPresent(), true)

  const event = events.find(avail.dataAvailability.events.DataSubmitted)
  if (event == null) return new Error("Failed to find DataSubmitted event")

  console.log(`Data Hash: ${event.dataHash}, Who: ${event.who.toSS58()}`)
  assertEq(event.dataHash.toString(), "0x62e506cffac310a010507268d8604643d380692df5278192d8f84840074ff6cf")
  assertEq(event.who.toSS58(), "5EZZm8AKzZw8ti9PSmTZdXCgNEeaE3vs5sNxqkQ6u5NhG8kT")

  // Fetching Transaction as generic one
  const geneticTx = await receipt.txGeneric()
  if (geneticTx instanceof ClientError) return geneticTx
  console.log(
    `Pallet Id: ${geneticTx.palletId}, Variant Id: ${geneticTx.variantId}, (Hex and Scale encoded) Call Data Length: ${geneticTx.data?.length}`,
  )

  process.exit(0)
}

main()
