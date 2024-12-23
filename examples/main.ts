import * as AccountNonce from "./account_nonce"
import * as TransactionPayment from "./transaction_payment"
import * as Batch from "./batch"
import * as Block from "./block"
import * as DataSubmission from "./data_submission"
import * as Events from "./events"
import * as H256 from "./h256"
import * as Rpc from "./rpc"
import * as Storage from "./storage"
import * as TransactionOptions from "./transaction_options"
import * as Transactions from "./transactions"
import * as TxInterface from "./tx_interface/index"
import * as Validator from "./validator"
import * as Multisig from "./multisig"

async function main() {
  await AccountNonce.run()
  await TransactionPayment.run()
  await Batch.run()
  await Block.run()
  await DataSubmission.run()
  await Events.run()
  await H256.run()
  await Rpc.run()
  await Storage.run()
  await TransactionOptions.run()
  await Transactions.run()
  await TxInterface.run()
  await Validator.run()
  await Multisig.run()
}

main()
  .catch((e) => {
    console.log(e)
    process.exit(1)
  })
  .then(() => {
    process.exit(0)
  })
