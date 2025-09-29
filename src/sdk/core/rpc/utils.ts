import { AvailError } from "../error"

/// Cannot Throw
export async function callRaw(endpoint: string, method: string, params?: any): Promise<RpcResponse | AvailError> {
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
    return new AvailError(e.toString())
  }
}

/// Cannot Throw
export async function call(endpoint: string, method: string, params?: any): Promise<any | null | AvailError> {
  const response = await callRaw(endpoint, method, params)
  if (response instanceof AvailError) return response
  if (response.error != null) return AvailError.from(response.error)

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
