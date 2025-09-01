import * as submission from "./submission"
import * as opaqueDecoded from "./opaque_decoded"
import * as staking from "./staking"
import * as balances from "./balances"
import * as da from "./da"
import * as multisig from "./multisig"
import * as proxy from "./proxy"
import * as utility from "./utility"
import * as identity from "./identity"
import * as nominationPools from "./nomination_pools"

export default async function runTests() {
  // await submission.default()
  // opaqueDecoded.default()
  //await pallets.default()

  await staking.default()
  await balances.default()
  await da.default()
  await multisig.default()
  await proxy.default()
  await utility.default()
  await identity.default()
  await nominationPools.default()
}
