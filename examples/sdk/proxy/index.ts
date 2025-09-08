import { ClientError } from "../../../src/sdk/error"
import { AccountId } from "../../../src/sdk/types/metadata"
import { proxy } from "../../../src/sdk/types/pallets"
import { Client, LOCAL_ENDPOINT, ONE_AVAIL } from "./../../../src/sdk"
import * as Accounts from "./../../../src/sdk/accounts"
import { assertEq, assertTrue } from "./../index"

export async function main() {
  await runProxyNormal()
  await runProxyPure()
  await runProxyFailure()

  process.exit()
}

export async function runProxyNormal() {
  const client = await Client.create(LOCAL_ENDPOINT)
  if (client instanceof ClientError) throw client

  const proxyAccount = Accounts.bob()
  const mainAccount = Accounts.ferdie()

  // Creating Proxy
  {
    const tx = client.tx.proxy.addProxy(proxyAccount.address, "Any", 0)
    const submitted = await tx.signAndSubmit(mainAccount)
    if (submitted instanceof ClientError) throw submitted

    const receipt = await submitted.receipt(true)
    if (receipt instanceof ClientError) throw receipt
    if (receipt == null) throw new Error("Failed to find transaction")

    const events = await receipt.txEvents()
    if (events instanceof ClientError) throw events
    assertTrue(events.isExtrinsicSuccessPresent())

    const event = events.find(proxy.events.ProxyAdded, true)
    console.log(
      `Delegatee: ${event.delegatee.toSS58()}, Delegator: ${event.delegator.toSS58()}, ProxyType: ${event.proxyType.toString()}, Delay: ${event.delay}`,
    )
  }

  // Executing the Proxy.Proxy() call
  {
    const call = client.tx.balances.transferKeepAlive(proxyAccount.address, ONE_AVAIL)
    const tx = client.tx.proxy.proxy(mainAccount.address, null, call)
    const submitted = await tx.signAndSubmit(proxyAccount)
    if (submitted instanceof ClientError) throw submitted

    const receipt = await submitted.receipt(true)
    if (receipt instanceof ClientError) throw receipt
    if (receipt == null) throw new Error("Failed to find transaction")

    const events = await receipt.txEvents()
    if (events instanceof ClientError) throw events
    assertTrue(events.isExtrinsicSuccessPresent())
    assertEq(events.proxyExecutedSuccessfully(), true)
  }

  // Removing Proxy
  {
    const tx = client.tx.proxy.removeProxy(proxyAccount.address, "Any", 0)
    const submitted = await tx.signAndSubmit(mainAccount)
    if (submitted instanceof ClientError) throw submitted

    const receipt = await submitted.receipt(true)
    if (receipt instanceof ClientError) throw receipt
    if (receipt == null) throw new Error("Failed to find transaction")

    const events = await receipt.txEvents()
    if (events instanceof ClientError) throw events
    assertTrue(events.isExtrinsicSuccessPresent())

    const event = events.find(proxy.events.ProxyRemoved, true)
    console.log(
      `Delegatee: ${event.delegatee.toSS58()}, Delegator: ${event.delegator.toSS58()}, ProxyType: ${event.proxyType.toString()}, Delay: ${event.delay}`,
    )
  }
}

export async function runProxyPure() {
  const client = await Client.create(LOCAL_ENDPOINT)
  if (client instanceof ClientError) throw client

  const mainAccount = Accounts.bob()

  const proxyType = "Any"
  const index = 0
  let proxyAccountId: AccountId

  // Creating Pure Proxy
  {
    const tx = client.tx.proxy.createPure(proxyType, 0, index)
    const submitted = await tx.signAndSubmit(mainAccount)
    if (submitted instanceof ClientError) throw submitted

    const receipt = await submitted.receipt(true)
    if (receipt instanceof ClientError) throw receipt
    if (receipt == null) throw new Error("Failed to find transaction")

    const events = await receipt.txEvents()
    if (events instanceof ClientError) throw events
    assertTrue(events.isExtrinsicSuccessPresent())

    const event = events.find(proxy.events.PureCreated, true)
    console.log(
      `Pure: ${event.pure.toSS58()}, Who: ${event.who.toSS58()}, ProxyType: ${event.proxyType.toString()}, Index: ${event.disambiguationIndex}`,
    )
    proxyAccountId = event.pure
  }

  // Executing the Proxy.Proxy() call
  {
    const key = "" + Math.ceil(Math.random() * 1_000_000_00)
    const call = client.tx.dataAvailability.createApplicationKey(key)
    const tx = client.tx.proxy.proxy(proxyAccountId, null, call)

    const submitted = await tx.signAndSubmit(mainAccount)
    if (submitted instanceof ClientError) throw submitted

    const receipt = await submitted.receipt(true)
    if (receipt instanceof ClientError) throw receipt
    if (receipt == null) throw new Error("Failed to find transaction")

    const events = await receipt.txEvents()
    if (events instanceof ClientError) throw events
    assertTrue(events.isExtrinsicSuccessPresent())
    assertEq(events.proxyExecutedSuccessfully(), true)
  }
}

export async function runProxyFailure() {
  const client = await Client.create(LOCAL_ENDPOINT)
  if (client instanceof ClientError) throw client

  const proxyAccount = Accounts.bob()
  const mainAccount = Accounts.ferdie()

  // Creating Proxy
  {
    const tx = client.tx.proxy.addProxy(proxyAccount.address, "NonTransfer", 0)
    const submitted = await tx.signAndSubmit(mainAccount)
    if (submitted instanceof ClientError) throw submitted

    const receipt = await submitted.receipt(true)
    if (receipt instanceof ClientError) throw receipt
    if (receipt == null) throw new Error("Failed to find transaction")

    const events = await receipt.txEvents()
    if (events instanceof ClientError) throw events
    assertTrue(events.isExtrinsicSuccessPresent())
    assertTrue(events.isPresent(proxy.events.ProxyAdded))
  }

  // Executing the Proxy.Proxy() call
  {
    const call = client.tx.balances.transferKeepAlive(proxyAccount.address, ONE_AVAIL)
    const tx = client.tx.proxy.proxy(mainAccount.address, null, call)
    const submitted = await tx.signAndSubmit(proxyAccount)
    if (submitted instanceof ClientError) throw submitted

    const receipt = await submitted.receipt(true)
    if (receipt instanceof ClientError) throw receipt
    if (receipt == null) throw new Error("Failed to find transaction")

    const events = await receipt.txEvents()
    if (events instanceof ClientError) throw events
    assertTrue(events.isExtrinsicSuccessPresent())
    assertEq(events.proxyExecutedSuccessfully(), true)
  }

  // Removing Proxy
  {
    const tx = client.tx.proxy.removeProxy(proxyAccount.address, "NonTransfer", 0)
    const submitted = await tx.signAndSubmit(mainAccount)
    if (submitted instanceof ClientError) throw submitted

    const receipt = await submitted.receipt(true)
    if (receipt instanceof ClientError) throw receipt
    if (receipt == null) throw new Error("Failed to find transaction")

    const events = await receipt.txEvents()
    if (events instanceof ClientError) throw events
    assertTrue(events.isExtrinsicSuccessPresent())
    assertTrue(events.isPresent(proxy.events.ProxyRemoved))
  }
}

main()
