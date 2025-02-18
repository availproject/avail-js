import { runBlockDataSubmissionAll } from "./block_data_submission_all"
import { runBlockDataSubmissionByAppId } from "./block_data_submission_by_app_id"
import { runBlockDataSubmissionByHash } from "./block_data_submission_by_hash"
import { runBlockDataSubmissionByIndex } from "./block_data_submission_by_index"
import { runBlockDataSubmissionBySigner } from "./block_data_submission_by_signer"
import { runBlockEvents } from "./block_events"
import { runBlockTransactionAll } from "./block_transaction_all"
import { runBlockTransactionByAppId } from "./block_transaction_by_app_id"
import { runBlockTransactionByHash } from "./block_transaction_by_hash"
import { runBlockTransactionByIndex } from "./block_transaction_by_index"
import { runBlockTransactionBySigner } from "./block_transaction_by_signer"

export async function runBlock() {
  await runBlockDataSubmissionAll()
  await runBlockDataSubmissionByAppId()
  await runBlockDataSubmissionByHash()
  await runBlockDataSubmissionByIndex()
  await runBlockDataSubmissionBySigner()
  await runBlockEvents()
  await runBlockTransactionAll()
  await runBlockTransactionByAppId()
  await runBlockTransactionBySigner()
  await runBlockTransactionByHash()
  await runBlockTransactionByIndex()

  console.log("runBlock finished correctly")
}
