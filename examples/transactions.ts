import { SDK, Block, Events, CallData } from "./../src/index"

export async function run() {
  const sdk = await SDK.New(SDK.localEndpoint())
  const api = sdk.api

  const account = SDK.alice()

  const dest = "5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty"
  const value = SDK.oneAvail()
  const tx = sdk.tx.balances.transferKeepAlive(dest, value)
  const res = (await tx.executeWaitForInclusion(account)).throwOnFault()

  const block = await Block.New(api, res.blockHash)

  // transactionAll, transactionBySigner, transactionByIndex, transactionByHash, transactionByAppId
  for (const [index, tx] of block.transactionAll().entries()) {
    console.log(`Tx Pallet name: ${tx.method.section}, Tx Name: ${tx.method.method}, Tx Hash: ${tx.hash.toHex()}`)

    const eventRecords = await Events.fetchEvents(api, res.blockHash, index)
    for (const eventRecord of eventRecords) {
      console.log(`\tEvent Pallet name: ${eventRecord.event.section}, Event Name: ${eventRecord.event.method}`)
    }
    const balance_tx = CallData.Balances.TransferKeepAlive.decode(tx)
    if (balance_tx != null) {
      console.log(`Transfer dest: ${balance_tx.dest}, value: ${balance_tx.value}`)
    }
  }
}

/*
  Example Output:
  
  Tx Pallet name: timestamp, Tx Name: set, Tx Hash: 0x4238af6b9f1eac602746b7c5fac3ed3a6091d856c5c4f225df25209fbcc1008f
          Event Pallet name: system, Event Name: ExtrinsicSuccess
  Tx Pallet name: balances, Tx Name: transferKeepAlive, Tx Hash: 0x87bb12642a9a1b43a22a1f3f31fdd8bf536b4e81e3bb2ef8f3231a576a8d8f0c
          Event Pallet name: balances, Event Name: Withdraw
          Event Pallet name: balances, Event Name: Transfer
          Event Pallet name: balances, Event Name: Deposit
          Event Pallet name: balances, Event Name: Deposit
          Event Pallet name: balances, Event Name: Deposit
          Event Pallet name: transactionPayment, Event Name: TransactionFeePaid
          Event Pallet name: system, Event Name: ExtrinsicSuccess
  Transfer dest: 5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty, value: 1000000000000000000
  Tx Pallet name: vector, Tx Name: failedSendMessageTxs, Tx Hash: 0x92cdb77314063a01930b093516d19a453399710cc8ae635ff5ab6cf76b26f218
          Event Pallet name: system, Event Name: ExtrinsicSuccess
*/
