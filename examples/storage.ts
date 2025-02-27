import { assert_eq, assert_true } from "."
import { Pallets, SDK } from "./../src/index"

export async function runStorage() {
  const sdk = await SDK.New(SDK.turingEndpoint)
  const storageAt = await sdk.client.storageAt("0x9e813bb85fca217f8f3967bd4b550b05f7d559412571ca1dd621aa37343b300b")

  // Simple Storage
  {
    const value = await Pallets.StakingStorage.MinValidatorBond.fetch(storageAt)
    assert_eq(value.toString(), "100000000000000000000000")
  }

  // Simple Storage that can return null
  {
    const value = await Pallets.StakingStorage.CurrentEra.fetch(storageAt)
    assert_true(value != null && value == 301)
  }

  // Fetch Map Storage
  {
    const key = "5C869t2dWzmmYkE8NT1oocuEEdwqNnAm2XhvnuHcavNUcTTT"
    const entry = await Pallets.SystemStorage.Account.fetch(storageAt, key)
    assert_eq(entry.key.toSS58(), key)
    assert_eq(entry.value.nonce, 11)
  }

  // Fetch Map Storage 2
  {
    const key = "Reserved-3"
    const entry = await Pallets.DataAvailabilityStorage.AppKeys.fetch(storageAt, key)
    if (entry == undefined) throw Error()
    assert_eq(entry.value.appId, 3)
    assert_eq(entry.value.owner.toSS58(), "5CK87QdvhcSJvVa7ZACcEfd5i7J1GqoqbEFB2kzNn3Ms13fE")
  }

  // Fetch All Map Storage
  {
    const entires = await Pallets.DataAvailabilityStorage.AppKeys.fetchAll(storageAt)
    assert_eq(entires.length, 232)
  }

  console.log("runStorage finished correctly")
}
