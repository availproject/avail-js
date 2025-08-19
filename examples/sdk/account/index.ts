import { AccountId, cryptoWaitReady, Keyring } from "../../../src/sdk/types"
import { Client, TURING_ENDPOINT } from "./../../../src/sdk"
import { assertEq, isOk } from "./../index"

async function main() {
  await cryptoWaitReady()
  await keyringPairExamples()
  await accountIdExamples()
  await accountInformation()

  process.exit()
}

main().finally(process.exit(0))

async function keyringPairExamples() {
  // Creating Keypair from mnemonic seed
  const development = "5DfhGyQdFobKM8NsWvEeAKk5EQQgYe9AydgJ7rMB6E1EqRzV"
  const keyringPair = new Keyring({ type: "sr25519" }).addFromUri(
    "bottom drive obey lake curtain smoke basket hold race lonely fit walk",
  )
  assertEq(keyringPair.address, development)

  // Creating Keypair from mnemonic seed with hard derivation
  const alice = "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY"
  const keyringPairAlice = new Keyring({ type: "sr25519" }).addFromUri(
    "bottom drive obey lake curtain smoke basket hold race lonely fit walk//Alice",
  )
  assertEq(keyringPairAlice.address, alice)

  const aliceStash = "5GNJqTPyNqANBkUVMN1LPPrxXnFouWXoe2wNSmmEoLctxiZY"
  const keyringPairAliceStash = new Keyring({ type: "sr25519" }).addFromUri(
    "bottom drive obey lake curtain smoke basket hold race lonely fit walk//Alice//stash",
  )
  assertEq(keyringPairAliceStash.address, aliceStash)

  // Creating Keypair from Raw Seed
  const address = "5HVSLMgPW5ZNi8755scgY7dnCK39ZYEhYnNFUpggqog2sN76"
  const keyringPairRaw = new Keyring({ type: "sr25519" }).addFromUri(
    "0x2246b68b2f9050f1eb38e44f1f0abd065b5694cc88dd44695af19b1e5fff344f",
  )
  assertEq(keyringPairRaw.address, address)
}

async function accountIdExamples() {
  // Account Id from String
  const alice = AccountId.fromSS58("5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY")
  assertEq(alice.toSS58(), "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY")

  // Account Id from Keypair
  const keyringPair = new Keyring({ type: "sr25519" }).addFromUri("//Alice")
  assertEq(AccountId.fromSS58(keyringPair.address).toSS58(), "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY")

  // Account Id from Raw
  const raw = new AccountId(
    new Uint8Array([
      212, 53, 147, 199, 21, 253, 211, 28, 97, 20, 26, 189, 4, 169, 159, 214, 130, 44, 133, 88, 133, 76, 205, 227, 154,
      86, 132, 231, 165, 109, 162, 125,
    ]),
  )
  assertEq(raw.toSS58(), "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY")

  // Account Id to SS58 Address
  assertEq(alice.toSS58(), "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY")
}

async function accountInformation() {
  let client = isOk(await Client.create(TURING_ENDPOINT))

  // Account Balance
  const address = "5DUhCbe3dcrGEFkUn7fjSvd1DpCqUfg6X9tMmKCwLpSfHKCS"
  const finalizedBlockHash = isOk(await client.finalized.blockHash())

  const _balance1 = isOk(await client.balance(address, finalizedBlockHash))
  const _balance2 = isOk(await client.best.blockBalance(address))
  const balance3 = isOk(await client.finalized.blockBalance(address))
  console.log(
    `Address: ${address}, Free: ${balance3.free.toString()}, Reserved: ${balance3.reserved.toString()}, Frozen: ${balance3.frozen.toString()}`,
  )

  // Account Nonce
  const address2 = "5HN2ZfzS6i87nxxv7Rbugob4KaYGD2B4xNq3ECkHfCkDZrTK"
  const _nonce1 = isOk(await client.nonce(address2))
  const _nonce2 = isOk(await client.blockNonce(address2, finalizedBlockHash))
  const _nonce3 = isOk(await client.best.blockNonce(address2))
  const nonce4 = isOk(await client.finalized.blockNonce(address2))
  console.log(`Address: ${address2}, Nonce: ${nonce4}`)

  // Account Info
  const address3 = "5Hn8x2fstQmcqLg4C8pEiLWdAJhGaRv8jfYRUrnHeiMALvAX"
  const _accountInfo1 = isOk(await client.accountInfo(address3, finalizedBlockHash))
  const _accountInfo2 = isOk(await client.best.blockAccountInfo(address3))
  const accountInfo3 = isOk(await client.finalized.blockAccountInfo(address3))
  console.log(`Address: ${address3}, Nonce: ${accountInfo3.nonce}, Free Balance: ${accountInfo3.data.free.toString()}`)
}
