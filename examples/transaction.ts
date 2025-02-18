import { runTransactionExecute } from "./transaction_execute";
import { runTransactionExecuteAndWatchFinalization } from "./transaction_execute_and_watch_finalization";
import { runTransactionExecuteAndWatchInclusion } from "./transaction_execute_and_watch_inclustion";

export async function runTransaction() {
  await runTransactionExecute()
  // await runTransactionExecuteAndWatchInclusion()
  // await runTransactionExecuteAndWatchFinalization()
  console.log("runTransaction finished correctly")
}
