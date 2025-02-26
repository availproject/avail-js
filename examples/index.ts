import { runAccount } from "./account"
import { runBatch } from "./batch"
import { runBlock } from "./block"
import { runDataSubmission } from "./data_submission"
import { runMultisig } from "./multisig"
import { runProxy } from "./proxy"
import { runRpc } from "./rpc"
import { runStorage } from "./storage"
import { runTestExtrinsic } from "./test_extrinsic"
import { runTransaction } from "./transaction"
import { runValidator } from "./validator"

const main = async () => {
  // await runAccount()
  // await runBatch()
  // await runBlock()
  // await runDataSubmission()
  // await runMultisig()
  // await runProxy()
  // await runRpc()
  // await runStorage()
  // await runTransaction()
  await runValidator()
}

main().catch((v) => {
  console.log(v)
  process.exit(1)
}).then((_v) => {
  process.exit()
})


export function assert_eq<T>(v1: T, v2: T, message?: string) {
  if (v1 !== v2) {
    throw new Error(`Failure. Actual ${v1}, Expected: ${v2}. ${message}`)
  }
}

export function assert_ne<T>(v1: T, v2: T, message?: string) {
  if (v1 === v2) {
    throw new Error(`Failure. Actual ${v1}, Expected: ${v2}. ${message}`)
  }
}

export function assert_true(v: boolean, message?: string) {
  if (!v) {
    throw new Error(`Failure. ${message}`)
  }
}

export function throw_error(message?: string) {
  throw new Error(`Failure. ${message}`)
}