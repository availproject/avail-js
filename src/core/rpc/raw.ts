import { RpcError, TransportError } from "../../errors/sdk-error"
import type { RpcErrorPayload } from "../../errors/rpc-payload"

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
    throw new TransportError(e instanceof Error ? e.message : String(e), { cause: e })
  }
}

export async function rpcCall(endpoint: string, method: string, params?: any): Promise<any | null> {
  const response = await rpcRawCall(endpoint, method, params)
  if (response.error != null) {
    throw new RpcError(response.error.message, {
      details: { rpcCode: response.error.code, rpcData: response.error.data },
      cause: response.error,
    })
  }

  return response.result
}

export interface RpcResponse {
  jsonrpc: string
  result: any | null
  error: RpcErrorPayload | null
  id: number
}
