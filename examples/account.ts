import { runAccountBalance } from "./account_balance"
import { runAccountCreation } from "./account_creation"
import { runAccountNonce } from "./account_nonce"

const main = async () => {
  await runAccountNonce()
}

main().then((_v) => {
  process.exit()
})
