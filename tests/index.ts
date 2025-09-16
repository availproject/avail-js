import { Client } from "../src/sdk"
import { ClientError } from "../src/sdk/error"
import { Duration, sleep } from "../src/sdk/utils"
import EncoderDecoderTests from "./encoder_decoder"
import TransactionTests from "./pallets"
import TransactionsTests from "./transactions"
import BlocksTest from "./blocks"
import BlockTest from "./block"

const main = async () => {
  await TransactionTests()
  //await BlocksTest()
  //await BlockTest()

  // EncoderDecoderTests()
  // await TransactionsTests()
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

export function isOkNotNull<T>(value: T | ClientError | null): T {
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

export function eq<T>(v1: T, v2: T, message?: string) {
  if (v1 !== v2) {
    throw new Error(`Failure. \nActual:   ${v1}, \nExpected: ${v2}. ${message}`)
  }
}

export function eqJson(v1: any, v2: any) {
  const actual = json(v1)
  const expected = json(v2)
  if (actual != expected) {
    throw new Error(`Failure. \nActual:   ${actual}, \nExpected: ${expected}`)
  }
}

export function neq<T>(v1: T, v2: T, message?: string) {
  if (v1 === v2) {
    throw new Error(`Failure. Actual ${v1}, Expected: ${v2}. ${message}`)
  }
}

export function isTrue(v: boolean, message?: string) {
  if (!v) {
    throw new Error(`Failure. ${message}`)
  }
}

export async function waitForBlock(client: Client, height: number, useBestBlock: boolean) {
  while (true) {
    const ref = useBestBlock ? isOk(await client.best.blockInfo()) : isOk(await client.finalized.blockInfo())
    if (height > ref.height) {
      await sleep(Duration.fromSecs(1))
      continue
    }
    return
  }
}

export function json(value: any): string {
  return JSON.stringify(value)
}
