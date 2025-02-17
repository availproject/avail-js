import { runAccount } from "./account"
import { runBatch } from "./batch"

export function assert_eq<T>(v1: T, v2: T, message?: string) {
  if (v1 != v2) {
    throw new Error(`Failure. Actual ${v1}, Expected: ${v2}. ${message}`)
  }
}

export function assert_true(v: boolean, message?: string) {
  if (!v) {
    throw new Error(`Failure. ${message}`)
  }
}

const main = async () => {
  await runBatch()
}

main().then((_v) => {
  process.exit()
})
