import { AvailError, RpcError } from "../error"

export async function rpcRawCall(endpoint: string, method: string, params?: any): Promise<RpcResponse> {
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
    throw new AvailError(e instanceof Error ? e.message : String(e))
  }
}

export async function rpcCall(endpoint: string, method: string, params?: any): Promise<any | null> {
  const response = await rpcRawCall(endpoint, method, params)
  if (response.error != null) return AvailError.from(response.error)

  return response.result
}

export interface RpcResponse {
  jsonrpc: string
  result: any | null
  error: RpcError | null
  id: number
}
