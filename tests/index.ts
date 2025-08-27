import ClientError from "../src/sdk/error"
import EncoderDecoderTests from "./encoder_decoder"
import TransactionTests from "./transaction"
import TransactionsTests from "./transactions"

const main = async () => {
  EncoderDecoderTests()
  TransactionTests()
  await TransactionsTests()
  process.exit()
}

main()

export function isOk<T>(value: T | ClientError): T {
  throwOnError2(value)
  return value
}

export function assertEq<T>(v1: T, v2: T, message?: string) {
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

export function throwOnError2<T>(value: T | ClientError): asserts value is Exclude<T, ClientError> {
  if (value instanceof ClientError) throw value
}

export function throwOnError<T>(value: T | ClientError): T {
  throwOnError2(value)
  return value
}
