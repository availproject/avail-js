import { ClientError } from "../error"

/// Cannot Throw
export async function callRaw(endpoint: string, method: string, params?: any): Promise<RpcResponse | ClientError> {
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
    return new ClientError(e.toString())
  }
}

/// Cannot Throw
export async function call(endpoint: string, method: string, params?: any): Promise<any | null | ClientError> {
  const response = await callRaw(endpoint, method, params)
  if (response instanceof ClientError) return response
  if (response.error != null) return ClientError.fromRpcError(response.error)

  return response.result
}

export interface RpcResponse {
  jsonrpc: string
  result: any | null
  error: RpcError | null
  id: number
}

export interface RpcError {
  code: number
  message: string
  data: string | null
}

export class Json {
  static parseString(value: any): string | ClientError {
    if (value == null || value == undefined) return new ClientError("Undefined value")
    if (typeof value !== "string") return new ClientError("Value is not string")
    return value
  }

  static parseNumber(value: any): number | ClientError {
    if (value == null || value == undefined) return new ClientError("Undefined value")
    if (typeof value !== "number") return new ClientError("Value is not number")
    return value
  }
}
