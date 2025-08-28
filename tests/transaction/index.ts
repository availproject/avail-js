import * as submission from "./submission"
import * as opaqueDecoded from "./opaque_decoded"
import * as pallets from "./pallets"

export default async function runTests() {
  await submission.default()
  opaqueDecoded.default()
  await pallets.default()
}
