import { Client } from "../src/sdk"
import { ClientError } from "../src/sdk/error"
import { Duration, sleep } from "../src/sdk/utils"
import EncoderDecoderTests from "./encoder_decoder"
import TransactionTests from "./transaction"
import TransactionsTests from "./transactions"

const main = async () => {
  EncoderDecoderTests()
  await TransactionTests()
  await TransactionsTests()
  process.exit()
}

main()

export function isOk<T>(value: T | ClientError): T {
  if (value instanceof ClientError) throw value
  return value
}

export function isNotNull<T>(value: T | null): T {
  if (value == null) throw new Error("Value is null")
  return value
}

export function isOkAndNotNull<T>(value: T | ClientError | null): T {
  if (value instanceof ClientError) throw value
  if (value == null) throw new Error("Value is null")
  return value
}

export function isNotOk<T>(value: T | ClientError): ClientError {
  if (!(value instanceof ClientError)) {
    throw new Error("value is NOT an instance of ClientError")
  }
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

export function assertTrue(v: boolean, message?: string) {
  if (!v) {
    throw new Error(`Failure. ${message}`)
  }
}

export function throwOnError<T>(value: T | ClientError): T {
  if (value instanceof ClientError) throw value
  return value
}

export async function waitForBlock(client: Client, height: number, useBestBlock: boolean) {
  while (true) {
    const ref = useBestBlock ? isOk(await client.best.blockRef()) : isOk(await client.finalized.blockRef())
    if (height > ref.height) {
      await sleep(Duration.fromSecs(1))
      continue
    }
    return
  }
}
