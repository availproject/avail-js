import { SDK, Account, Pallets } from "./../src/index"

export async function runAccountBalance() {
  const sdk = await SDK.New(SDK.localEndpoint)

  // Via Storage RPC
  const storageAt = await sdk.client.storageAt()
  const storage = await Pallets.SystemStorage.Account.fetch(storageAt, "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY")
  console.log("Free Balance: ", storage.value.accountData.free.toString())
  console.log("Reserved Balance: ", storage.value.accountData.reserved.toString())
  console.log("Frozen Balance: ", storage.value.accountData.frozen.toString())

  // Via Abstraction
  const balance = await Account.balance(sdk.client, "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY")
  console.log("Free Balance: ", balance.free.toString())
  console.log("Reserved Balance: ", balance.reserved.toString())
  console.log("Frozen Balance: ", balance.frozen.toString())

  console.log("runAccountBalance finished correctly")
}
