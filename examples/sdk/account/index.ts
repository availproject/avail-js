import { Keyring } from "@polkadot/api"
import { Client, core } from "../../../src/sdk"
import { assertEq, isOk } from "./../index"

async function main() {
  await core.misc.polkadot.cryptoWaitReady()
  await keyringPairExamples()

  process.exit()
}

main().catch((e) => console.log(e))

async function keyringPairExamples() {
  // Creating Keypair from mnemonic seed
  const development = "5DfhGyQdFobKM8NsWvEeAKk5EQQgYe9AydgJ7rMB6E1EqRzV"
  const keyringPair = new Keyring({ type: "sr25519" }).addFromUri("bottoma drive obey lake curtainaa")
  console.log(keyringPair.address)
}
