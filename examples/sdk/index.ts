import ClientError from "./../../src/sdk/error"

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

export function throwOnError2<T>(value: T | ClientError): asserts value is Exclude<T, ClientError> {
  if (value instanceof ClientError) throw value
}

export function throwOnError<T>(value: T | ClientError): T {
  throwOnError2(value)
  return value
}

export function isOk<T>(value: T | ClientError): T {
  throwOnError2(value)
  return value
}
