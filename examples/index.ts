import { runAccount } from "./account"
import { runBatch } from "./batch"
import { runBlock } from "./block"
import { runDataSubmission } from "./data_submission"
import { runTransaction } from "./transaction"

const main = async () => {
  await runTransaction()
}

main().then((_v) => {
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