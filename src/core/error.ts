import { RpcError } from "./rpc/utils"

export class GeneralError {
  public constructor(
    public value: string,
    public code?: number,
  ) {}

  toError(): Error {
    return new Error(this.value)
  }

  static fromRpcError(value: RpcError): GeneralError {
    return new GeneralError(`Rpc Error. Code: ${value.code}, Message: ${value.message}, Data: ${value.data}`)
  }
}
