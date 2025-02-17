import { AccountId } from "../src/sdk/account"
import { Account, cryptoWaitReady } from "./../src/index"

export async function runAccountCreation() {
  await cryptoWaitReady()

  // Use `new` to create an account from uri
  const alice = Account.new("//Alice")
  console.log("Alice Address: ", alice.address)

  // Use `generate` to generate a random account
  const generated = Account.generate()
  console.log("Generated Address: ", generated.address)

  // There are predefined testing accounts available to be used on local dev networks.
  console.log("Alice Address: ", Account.alice().address)
  console.log("Bob Address: ", Account.bob().address)
  console.log("Charlie Address: ", Account.charlie().address)
  console.log("Eve Address: ", Account.eve().address)
  console.log("Ferdie Address: ", Account.ferdie().address)

  // SS58 address from Keyring
  console.log("SS58 address: ", alice.address)

  // Account Id from keyring, ss58 address or accountID32
  const rawAccount = alice.publicKey
  console.log("Raw Account Id: ", rawAccount)
  const accountId1 = new AccountId(rawAccount)
  console.log("Account Id SS58 address: ", accountId1.toSS58())
  const accountId2 = AccountId.fromSS58(alice.address)
  console.log("Account Id SS58 address: ", accountId2.toSS58())

  console.log("runAccountCreation finished correctly")
}
