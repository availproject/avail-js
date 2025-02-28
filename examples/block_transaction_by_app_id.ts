import { assert_eq } from "."
import { SDK, Block, Pallets } from "./../src/index"

export async function runBlockTransactionByAppId() {
  const sdk = await SDK.New(SDK.turingEndpoint)

  const block = await Block.New(sdk.client, "0x94746ba186876d7407ee618d10cb6619befc59eeb173cacb00c14d1ff492fc58")
  const appId = 2
  const blockTxs = block.transactions({ appId: appId })
  assert_eq(blockTxs.length, 2)

  // Printout Block Transactions filtered By App Id
  for (const tx of blockTxs) {
    assert_eq(tx.appId(), appId)
    console.log(
      `Pallet Name: ${tx.palletName()}, Pallet Index: ${tx.palletIndex()}, Call Name: ${tx.callName()}, Call Index: ${tx.callIndex()}, Tx hash: ${tx.txHash()}, Tx Index: ${tx.txIndex()}`,
    )
  }

  // Convert from Block Transaction to Specific Transaction
  const decodedCall = blockTxs[0].decode(Pallets.DataAvailabilityCalls.SubmitData)
  if (decodedCall == undefined) throw Error()
  console.log(`Data: ${new TextDecoder().decode(decodedCall.data)}`)

  // Printout all Transaction Events
  const txEvents = blockTxs[0].events()
  if (txEvents == undefined) throw Error()
  assert_eq(txEvents.len(), 7)

  for (const event of txEvents.iter()) {
    console.log(
      `Pallet Name: ${event.palletName()}, Pallet Index: ${event.palletIndex()}, Event Name: ${event.eventName()}, Event Index: ${event.eventIndex()}, Tx Index: ${event.txIndex()}`,
    )
  }

  // Find DataSubmitted event
  const event = txEvents.findFirst(Pallets.DataAvailabilityEvents.DataSubmitted)
  if (event == undefined) throw Error()
  console.log(`Who: ${event.who}, DataHash: ${event.dataHash}`)

  console.log("runBlockTransactionByAppId finished correctly")
}
