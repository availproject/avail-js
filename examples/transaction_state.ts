import { assert_eq } from "."
import { Account, Metadata, SDK } from "./../src/index"

export async function runTransactionState() {
  const sdk = await SDK.New(SDK.localEndpoint)
  const account = Account.alice()

  const tx = sdk.tx.dataAvailability.submitData("My Data")
  const txhash = await tx.execute(account, { app_id: 1 })

  let states: Metadata.TransactionState[] = []
  while (true) {
    states = await sdk.client.transactionState(txhash)
    if (states.length != 0) {
      break
    }

    await sleep(1_000)
  }

  assert_eq(states.length, 1)
  for (const state of states) {
    console.log(
      `Block Hash: ${state.blockHash.toHuman()}, Block Height: ${state.blockHeight}, Tx Hash: ${state.txHash.toHuman()}, Tx Index: ${state.txIndex}`,
    )
    console.log(
      `Pallet Index: ${state.palletIndex}, Call Index: ${state.callIndex}, Tx Successful: ${state.txSuccess}, Is Finalized: ${state.isFinalized}`,
    )
  }

  console.log("runTransactionState finished correctly")
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
