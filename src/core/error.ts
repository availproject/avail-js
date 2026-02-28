import { ErrorCode as Codes } from "../errors/codes"
import { SdkError } from "../errors/sdk-error"

export class AvailError extends SdkError {
  constructor(
    message: string,
    options?: { code?: (typeof Codes)[keyof typeof Codes]; cause?: unknown; data?: string | null },
  ) {
    super(options?.code ?? Codes.Unknown, message, {
      cause: options?.cause,
      details: options?.data === undefined ? undefined : { data: options.data },
    })
    this.name = "AvailError"
  }

  static from(value: RpcErrorShape | Error): AvailError {
    if ("code" in value) {
      return new AvailError(value.message, {
        code: Codes.Rpc,
        data: value.data,
        cause: value,
      })
    }
    return new AvailError(value.message, { code: Codes.Transport, cause: value })
  }
}

export interface RpcErrorShape {
  code: number
  message: string
  data: string | null
}

export type RpcError = RpcErrorShape

export class Json {
  static parseString(value: any): string | AvailError {
    if (value == null || value == undefined) return new AvailError("Undefined value")
    if (typeof value !== "string") return new AvailError("Value is not string")
    return value
  }

  static parseNumber(value: any): number | AvailError {
    if (value == null || value == undefined) return new AvailError("Undefined value")
    if (typeof value !== "number") return new AvailError("Value is not number")
    return value
  }
}
