import { assert_eq } from "."
import { SDK, Block, Pallets } from "./../src/index"

export async function runBlockTransactionBySigner() {
  const sdk = await SDK.New(SDK.turingEndpoint)

  const block = await Block.New(sdk.client, "0x94746ba186876d7407ee618d10cb6619befc59eeb173cacb00c14d1ff492fc58")
  const singer = "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY"
  const blockTxs = block.transactions({ txSigner: singer })
  assert_eq(blockTxs.length, 5)

  // Printout Block Transactions filtered By Signer
  for (const tx of blockTxs) {
    assert_eq(tx.ss58Address(), singer)
    console.log(`Pallet Name: ${tx.palletName()}, Pallet Index: ${tx.palletIndex()}, Call Name: ${tx.callName()}, Call Index: ${tx.callIndex()}, Tx hash: ${tx.txHash()}, Tx Index: ${tx.txIndex()}`)
  }

  // Convert from Block Transaction to Specific Transaction
  // TODO


  // Printout all Transaction Events
  const txEvents = blockTxs[0].events()
  if (txEvents == undefined) throw Error()
  assert_eq(txEvents.len(), 7)

  for (const event of txEvents.iter()) {
    console.log(`Pallet Name: ${event.palletName()}, Pallet Index: ${event.palletIndex()}, Event Name: ${event.eventName()}, Event Index: ${event.eventIndex()}, Tx Index: ${event.txIndex()}`)
  }

  // Find ApplicationKeyCreated event
  const event = txEvents.findFirst(Pallets.DataAvailabilityEvents.ApplicationKeyCreated)
  if (event == undefined) throw Error()
  console.log(`Owner: ${event.id}, Key: ${event.keyToString()}, App Id: ${event.id}`)

  console.log("runBlockTransactionBySigner finished correctly")
}
