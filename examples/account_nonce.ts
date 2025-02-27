import { SDK, Account, Pallets } from "./../src/index"

export async function runAccountNonce() {
  const sdk = await SDK.New(SDK.turingEndpoint)

  // Via RPC
  const nonce1 = await sdk.client.api.rpc.system.accountNextIndex("5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY")
  console.log("Nonce: ", nonce1.toNumber())

  // Via Storage RPC
  const storageAt = await sdk.client.storageAt()
  const storage = await Pallets.SystemStorage.Account.fetch(storageAt, "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY")
  console.log("Nonce: ", storage.value.nonce)

  // Via Abstraction
  const nonce2 = await Account.nonce(sdk.client, "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY")
  console.log("Nonce: ", nonce2)

  console.log("runAccountNonce finished correctly")
}
