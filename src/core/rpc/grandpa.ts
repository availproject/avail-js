import { call } from "./utils"
import { GeneralError } from "./../index"

export async function blockJustification(endpoint: string, at: number): Promise<string | null | GeneralError> {
  const res = await call(endpoint, "grandpa_blockJustification", [at])
  if (res instanceof GeneralError) return res

  return res as string
}

export async function blockJustificationJson(endpoint: string, at: number): Promise<string | null | GeneralError> {
  const res = await call(endpoint, "grandpa_blockJustificationJson", [at])
  if (res instanceof GeneralError) return res

  return res as string
}
