import { ClientError } from "./../../src/sdk/error"

export function assertEq<T>(v1: T, v2: T, message?: string) {
  if (v1 !== v2) {
    throw new Error(`Failure. Actual ${v1}, Expected: ${v2}. ${message}`)
  }
}

export function assertNe<T>(v1: T, v2: T, message?: string) {
  if (v1 === v2) {
    throw new Error(`Failure. Actual ${v1}, Expected: ${v2}. ${message}`)
  }
}

export function assertTrue(v: boolean, message?: string) {
  if (!v) {
    throw new Error(`Failure. ${message}`)
  }
}

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
