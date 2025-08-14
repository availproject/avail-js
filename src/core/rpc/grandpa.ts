import { call } from "./utils"
import { GeneralError } from "./../index"

/// Cannot Throw
export async function blockJustification(endpoint: string, at: number): Promise<string | null | GeneralError> {
  const res = await call(endpoint, "grandpa_blockJustification", [at])
  if (res instanceof GeneralError) return res
  if (res == null) return res
  if (typeof res !== "string") return new GeneralError("Justification is not string")

  return res
}

/// Cannot Throw
export async function blockJustificationJson(endpoint: string, at: number): Promise<string | null | GeneralError> {
  const res = await call(endpoint, "grandpa_blockJustificationJson", [at])
  if (res instanceof GeneralError) return res
  if (res == null) return res
  if (typeof res !== "string") return new GeneralError("Justification is not string")

  return res
}
