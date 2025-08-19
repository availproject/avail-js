import { RpcError } from "./rpc/utils"

export default class ClientError extends Error {
  constructor(
    public message: string,
    public code?: number,
  ) {
    super(message)
  }

  static fromRpcError(value: RpcError): ClientError {
    return new ClientError(`Rpc Error. Code: ${value.code}, Message: ${value.message}, Data: ${value.data}`)
  }
}
