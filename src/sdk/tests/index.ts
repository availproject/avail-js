import { AvailError } from "../."

export function isOk<T>(value: T | AvailError): T {
  if (value instanceof AvailError) throw value
  return value
}

export function isNotNull<T>(value: T | null): T {
  if (value == null) throw new Error("Value is null")
  return value
}

export function isOkNotNull<T>(value: T | AvailError | null): T {
  if (value instanceof AvailError) throw value
  if (value == null) throw new Error("Value is null")
  return value
}

export function isNotOk<T>(value: T | AvailError): AvailError {
  if (!(value instanceof AvailError)) {
    throw new Error("value is NOT an instance of AvailError")
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

export function json(value: any): string {
  return JSON.stringify(value)
}
