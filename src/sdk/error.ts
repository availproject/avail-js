import { RpcError } from "./rpc/utils"

export class ClientError extends Error {
  constructor(
    public message: string,
    public code?: number,
  ) {
    super(message)
  }

  static fromRpcError(value: RpcError): ClientError {
    return new ClientError(`Rpc Error. Code: ${value.code}, Message: ${value.message}, Data: ${value.data}`)
  }

  toString(): string {
    return `Client Error. Code: ${this.code}, Message: ${this.message}`
  }
}
