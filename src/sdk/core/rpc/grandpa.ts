import { AvailError } from "../error"
import { AvailHeader } from "../types"
import { call } from "./utils"
import { AuthorityId, AuthoritySignature } from "@polkadot/types/interfaces"

/// Cannot Throw
export async function blockJustification(endpoint: string, at: number): Promise<string | null | AvailError> {
  const res = await call(endpoint, "grandpa_blockJustification", [at])
  if (res instanceof AvailError) return res
  if (res == null) return res
  if (typeof res !== "string") return new AvailError("Justification is not string")

  return res
}

/// Cannot Throw
export async function blockJustificationJson(
  endpoint: string,
  at: number,
): Promise<GrandpaJustification | null | AvailError> {
  const res = await call(endpoint, "grandpa_blockJustificationJson", [at])
  if (res instanceof AvailError) return res
  if (res == null) return res

  return res as GrandpaJustification
}

export interface GrandpaJustification {
  round: number
  commit: GrandpaCommit
  votes_ancestries: AvailHeader[]
}

export interface GrandpaCommit {
  target_hash: string
  target_number: number
  precommits: GrandpaSignedPrecommit[]
}

export interface GrandpaSignedPrecommit {
  precommit: GrandpaPrecommit
  signature: AuthoritySignature
  id: AuthorityId
}

export interface GrandpaPrecommit {
  target_hash: string
  target_number: number
}
