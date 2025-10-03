export class AvailError extends Error {
  constructor(public message: string) {
    super(message)
  }

  static from(value: RpcError | Error): AvailError {
    if ("code" in value) {
      return new AvailError(`Rpc Error. Code: ${value.code}, Message: ${value.message}, Data: ${value.data}`)
    }
    return new AvailError(value.message)
  }

  toString(): string {
    return `${this.message}`
  }
}

export interface RpcError {
  code: number
  message: string
  data: string | null
}

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
