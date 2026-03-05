import { RpcError } from "../../errors/sdk-error"
import { SessionKeys } from "./../types"
import { rpcCall } from "./raw"

export async function rotateKeys(endpoint: string): Promise<SessionKeys> {
  const res = await rpcCall(endpoint, "author_rotateKeys", [])
  if (typeof res !== "string") throw new RpcError("Rotate Keys is not string")

  return SessionKeys.from(res)
}
