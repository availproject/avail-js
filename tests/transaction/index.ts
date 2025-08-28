import * as submission from "./submission"
import * as opaqueDecoded from "./opaque_decoded"
import * as pallets from "./pallets"
import * as staking from "./staking"

export default async function runTests() {
  // await submission.default()
  // opaqueDecoded.default()
  //await pallets.default()
  await staking.default()
}
