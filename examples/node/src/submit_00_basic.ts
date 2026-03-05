import { avail, bob, Client, H256, LOCAL_ENDPOINT } from "avail-js-sdk" // Global import

/**
 * Example to connect to a chain and get the ApiPromise.
 */
const main = async () => {
  const client = await Client.connect(LOCAL_ENDPOINT)
  const signer = bob()

  // Submitting a transaction
  //
  // The typical flow is: build a call, submit it, then wait for a receipt. The simplest path
  // is .submit() which signs and sends the transaction in one RPC call. It returns a
  // SubmittedTransaction handle that we can use to track the transaction's progress.
  const tx = client.tx().dataAvailability().submitData(2, "Hello Avail!")
  const submitted = await tx.submit(signer)
  console.log(`Ext Hash: ${submitted.extHash}`)

  // Waiting for inclusion
  //
  // After submission we usually want to wait until the transaction lands in a block. There
  // are three methods on SubmittedTransaction, each giving a different level of detail:
  //
  // .findReceipt(opts)  - returns a FindReceiptOutcome enum (Found / NotFound / TimedOut)
  // .receipt(opts)       - same but returns the receipt directly or an error
  // .outcome(opts)       - returns (TransactionReceipt, BlockEvents) in one shot
  //
  // The opts parameter accepts a BlockQueryMode directly (Finalized or Best) or a WaitOption
  // for finer control over timeout duration.
  const receipt = await submitted.receipt({ mode: "finalized" })
  const timestamp = await receipt.timestamp()
  console.log(`Included: height=${receipt.blockHeight}, hash=${receipt.blockHeight}, timestamp=${timestamp}`)

  // Pre-submission inspection
  //
  // Before submitting we can estimate fees and inspect weight without actually sending
  // anything to the chain. Both methods accept an optional block hash to pin the estimation
  // to a specific state root — pass None for the latest.
  //
  // .estimateCallFees(at)                    - fee estimate from the unsigned call
  // .estimateExtrinsicFees(signer, opts, at) - fee estimate from the fully signed extrinsic
  // .callInfo(at)                            - runtime dispatch info including weight
  const tx2 = client.tx().dataAvailability().submitData(2, "Fee check")
  const fee = await tx2.estimateCallFees()
  console.log!(`Fee: ${fee}`)

  const weight = (await tx2.callInfo()).weight
  console.log(`Weight: ${weight.refTime}`)

  // Convenience: submit and wait in one call
  //
  // If you don't need the intermediate SubmittedTransaction handle, these two methods combine
  // submission and waiting into a single call:
  //
  // .submitAndWaitForReceipt(signer, opts, wait) - returns TransactionReceipt
  // .submitAndWaitForOutcome(signer, opts, wait) - returns (TransactionReceipt, BlockEvents)
  //
  // The outcome variant is handy when you want to check events (e.g. ExtrinsicSuccess) right away.
  const tx3 = client.tx().dataAvailability().submitData(2, "Full flow")
  const outcome = await tx3.submitAndWaitForOutcome(signer, {}, { mode: "best" })
  console.log(`Height: ${outcome.receipt.blockHeight}, Success: ${outcome.events.isExtrinsicSuccessPresent()}`)

  // Reading back the submitted data
  //
  // Once we have a receipt we can decode the extrinsic that was included in the block. This
  // gives us back the original call with its parameters.
  let ext = await outcome.receipt.extrinsic(avail.dataAvailability.tx.SubmitData)
  console.log(`Data: ${ext.call.data}`)

  process.exit(0)
}
main()
