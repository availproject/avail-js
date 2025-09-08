import { RpcError } from "./rpc/utils"

export class ClientError extends Error {
  constructor(public message: string) {
    super(message)
  }

  static from(value: RpcError | Error): ClientError {
    if ("code" in value) {
      return new ClientError(`Rpc Error. Code: ${value.code}, Message: ${value.message}, Data: ${value.data}`)
    }
    return new ClientError(value.message)
  }

  toString(): string {
    return `${this.message}`
  }
}
