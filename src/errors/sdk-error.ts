import type { ErrorCode } from "./codes"
import { ErrorCode as Codes } from "./codes"
import type { ErrorOperation } from "./operations"

export class SdkError extends Error {
  readonly code: ErrorCode
  readonly operation?: ErrorOperation
  readonly causeValue?: unknown
  readonly details?: Record<string, unknown>

  constructor(
    code: ErrorCode,
    message: string,
    options?: { operation?: ErrorOperation; cause?: unknown; details?: Record<string, unknown> },
  ) {
    super(message)
    this.name = "SdkError"
    this.code = code
    this.operation = options?.operation
    this.causeValue = options?.cause
    this.details = options?.details
  }
}

export class ValidationError extends SdkError {
  constructor(
    message: string,
    options?: { operation?: ErrorOperation; cause?: unknown; details?: Record<string, unknown> },
  ) {
    super(Codes.Validation, message, options)
    this.name = "ValidationError"
  }
}

export class TransportError extends SdkError {
  constructor(
    message: string,
    options?: { operation?: ErrorOperation; cause?: unknown; details?: Record<string, unknown> },
  ) {
    super(Codes.Transport, message, options)
    this.name = "TransportError"
  }
}

export class RpcError extends SdkError {
  constructor(
    message: string,
    options?: { operation?: ErrorOperation; cause?: unknown; details?: Record<string, unknown> },
  ) {
    super(Codes.Rpc, message, options)
    this.name = "RpcError"
  }
}

export class NotFoundError extends SdkError {
  constructor(
    message: string,
    options?: { operation?: ErrorOperation; cause?: unknown; details?: Record<string, unknown> },
  ) {
    super(Codes.NotFound, message, options)
    this.name = "NotFoundError"
  }
}

export class TimeoutError extends SdkError {
  constructor(
    message: string,
    options?: { operation?: ErrorOperation; cause?: unknown; details?: Record<string, unknown> },
  ) {
    super(Codes.Timeout, message, options)
    this.name = "TimeoutError"
  }
}

export class DecodeError extends SdkError {
  constructor(
    message: string,
    options?: { operation?: ErrorOperation; cause?: unknown; details?: Record<string, unknown> },
  ) {
    super(Codes.Decode, message, options)
    this.name = "DecodeError"
  }
}

export class EnumDecodeError extends SdkError {
  constructor(
    message: string,
    options?: { operation?: ErrorOperation; cause?: unknown; details?: Record<string, unknown> },
  ) {
    super(Codes.EnumDecode, message, options)
    this.name = "EnumDecodeError"
  }
}

export class HashComputationError extends SdkError {
  constructor(
    message: string,
    options?: { operation?: ErrorOperation; cause?: unknown; details?: Record<string, unknown> },
  ) {
    super(Codes.HashComputation, message, options)
    this.name = "HashComputationError"
  }
}

export function isRetryableError(error: unknown): boolean {
  if (!(error instanceof SdkError)) {
    return false
  }

  return error.code === Codes.Transport || error.code === Codes.Rpc || error.code === Codes.Timeout
}
