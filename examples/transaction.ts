import { runTransactionExecute } from "./transaction_execute";
import { runTransactionExecuteAndWatchFinalization } from "./transaction_execute_and_watch_finalization";
import { runTransactionExecuteAndWatchInclusion } from "./transaction_execute_and_watch_inclusion";
import { runTransactionOptions } from "./transaction_options";
import { runTransactionPayment } from "./transaction_payment";

export async function runTransaction() {
  await runTransactionExecute()
  await runTransactionExecuteAndWatchInclusion()
  await runTransactionExecuteAndWatchFinalization()
  await runTransactionOptions()
  await runTransactionPayment()

  console.log("runTransaction finished correctly")
}
