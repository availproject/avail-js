import { callRaw, RpcError } from "./utils"
import { GeneralError } from "./../index"

export async function blockJustification(
  endpoint: string,
  at: number,
): Promise<blockJustificationTypes.RpcResponse | GeneralError> {
  const params = [at]
  const res = await callRaw(endpoint, "grandpa_blockJustification", params)
  if (res instanceof GeneralError) return res

  return {
    result: res.result,
    error: res.error,
  }
}

export async function blockJustificationJson(
  endpoint: string,
  at: number,
): Promise<blockJustificationJsonTypes.RpcResponse | GeneralError> {
  const params = [at]
  const res = await callRaw(endpoint, "grandpa_blockJustificationJson", params)
  if (res instanceof GeneralError) return res

  return {
    result: res.result,
    error: res.error,
  }
}

export namespace blockJustificationTypes {
  export type RpcResponse = {
    result: String | null
    error: RpcError | null
  }
}

export namespace blockJustificationJsonTypes {
  export type RpcResponse = {
    result: String | null
    error: RpcError | null
  }
}
