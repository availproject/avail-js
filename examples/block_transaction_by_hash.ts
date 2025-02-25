import { assert_eq } from "."
import { SDK, Block, Pallets } from "./../src/index"

export async function runBlockTransactionByHash() {
  const sdk = await SDK.New(SDK.turingEndpoint)

  const block = await Block.New(sdk.client, "0x94746ba186876d7407ee618d10cb6619befc59eeb173cacb00c14d1ff492fc58")
  const txHash = "0x19c486e107c926ff4af3fa9b1d95aaba130cb0bc89515d0f5b523ef6bac06338"
  const blockTxs = block.transactions({ txHash: txHash })
  assert_eq(blockTxs.length, 1)
  const tx = blockTxs[0]

  // Printout Transaction filtered by Tx Hash
  assert_eq(tx.txHash().toString(), txHash)
  console.log(`Pallet Name: ${tx.palletName()}, Pallet Index: ${tx.palletIndex()}, Call Name: ${tx.callName()}, Call Index: ${tx.callIndex()}, Tx hash: ${tx.txHash()}, Tx Index: ${tx.txIndex()}`)

  // Convert from Block Transaction to Specific Transaction
  const decodedCall = tx.decode(Pallets.BalancesCalls.TransferKeepAlive)
  if (decodedCall == undefined) throw Error()
  console.log(`Dest: ${decodedCall.dest.toString()}, Value: ${decodedCall.value.toString()}`)

  // Printout all Transaction Events
  const txEvents = tx.events()
  if (txEvents == undefined) throw Error()
  assert_eq(txEvents.len(), 7)

  for (const event of txEvents.iter()) {
    console.log(`Pallet Name: ${event.palletName()}, Pallet Index: ${event.palletIndex()}, Event Name: ${event.eventName()}, Event Index: ${event.eventIndex()}, Tx Index: ${event.txIndex()}`)
  }

  // Find Transfer event
  const event = txEvents.findFirst(Pallets.BalancesEvents.Transfer)
  if (event == undefined) throw Error()
  console.log(`From: ${event.from}, To: ${event.to}, Amount: ${event.amount.toString()}`)

  console.log("runBlockTransactionByHash finished correctly")
}
