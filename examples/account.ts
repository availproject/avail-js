import { runAccountBalance } from "./account_balance"
import { runAccountCreation } from "./account_creation"
import { runAccountNonce } from "./account_nonce"

export async function runAccount() {
  await runAccountBalance()
  await runAccountCreation()
  await runAccountNonce()

  console.log("runAccount finished correctly")
}
