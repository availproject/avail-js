import { runBlockDataSubmissionAll } from "./block_data_submission_all"
import { runBlockDataSubmissionByAppId } from "./block_data_submission_by_app_id"
import { runBlockDataSubmissionByHash } from "./block_data_submission_by_hash"
import { runBlockDataSubmissionByIndex } from "./block_data_submission_by_index"
import { runBlockDataSubmissionBySigner } from "./block_data_submission_by_signer"
import { runBlockEvents } from "./block_events"

export async function runBlock() {
  // await runBlockDataSubmissionAll()
  // await runBlockDataSubmissionByAppId()
  // await runBlockDataSubmissionByHash()
  // await runBlockDataSubmissionByIndex()
  // await runBlockDataSubmissionBySigner()
  await runBlockEvents()

  console.log("runBlock finished correctly")
}
