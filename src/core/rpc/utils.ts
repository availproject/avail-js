import { GeneralError } from "../index"

/// Cannot Throw
export async function callRaw(endpoint: string, method: string, params?: any): Promise<RpcResponse | GeneralError> {
  try {
    const content = {
      id: 1,
      jsonrpc: "2.0",
      method: method,
      params: params,
    }

    const response = await fetch(endpoint, {
      method: "POST",
      body: JSON.stringify(content),
      headers: { "Content-Type": "application/json" },
    })

    const jsonResponse = (await response.json()) as RpcResponse
    return jsonResponse
  } catch (e: any) {
    return new GeneralError(e.toString())
  }
}

/// Cannot Throw
export async function call(endpoint: string, method: string, params?: any): Promise<any | null | GeneralError> {
  const response = await callRaw(endpoint, method, params)
  if (response instanceof GeneralError) return response
  if (response.error != null) return GeneralError.fromRpcError(response.error)

  return response.result
}

export type RpcResponse = {
  jsonrpc: string
  result: any | null
  error: RpcError | null
  id: number
}

export type RpcError = { code: number; message: string; data: string | null }

export class Json {
  static parseString(value: any): string | GeneralError {
    if (value == null || value == undefined) return new GeneralError("Undefined value")
    if (typeof value !== "string") return new GeneralError("Value is not string")
    return value
  }

  static parseNumber(value: any): number | GeneralError {
    if (value == null || value == undefined) return new GeneralError("Undefined value")
    if (typeof value !== "number") return new GeneralError("Value is not number")
    return value
  }
}
