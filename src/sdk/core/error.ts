import { RpcError } from "./rpc/utils"

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
