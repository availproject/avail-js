import { AvailError, Client, LOCAL_ENDPOINT } from "avail-js"
import { accounts, avail, ONE_AVAIL } from "avail-js/core"
import { AccountId } from "avail-js/core/metadata"

export async function main() {
  await runProxyNormal()
  await runProxyPure()
  await runProxyFailure()

  process.exit()
}

export async function runProxyNormal() {
  const client = await Client.create(LOCAL_ENDPOINT)
  if (client instanceof AvailError) throw client

  const proxyAccount = accounts.bob()
  const mainAccount = accounts.ferdie()

  // Creating Proxy
  {
    const tx = client.tx().proxy().addProxy(proxyAccount.address, "Any", 0)
    const submitted = await tx.signAndSubmit(mainAccount)
    if (submitted instanceof AvailError) throw submitted

    const receipt = await submitted.receipt(true)
    if (receipt instanceof AvailError) throw receipt
    if (receipt == null) throw new Error("Failed to find transaction")

    const events = await receipt.events()
    if (events instanceof AvailError) throw events
    if (!events.isExtrinsicSuccessPresent()) throw "Extrinsic failed"

    const event = events.first(avail.proxy.events.ProxyAdded)
    if (event == null) throw "ProxyAdded event not found"
    console.log(
      `Delegatee: ${event.delegatee.toSS58()}, Delegator: ${event.delegator.toSS58()}, ProxyType: ${event.proxyType.toString()}, Delay: ${event.delay}`,
    )
  }

  // Executing the Proxy.Proxy() call
  {
    const call = client.tx().balances().transferKeepAlive(proxyAccount.address, ONE_AVAIL)
    const tx = client.tx().proxy().proxy(mainAccount.address, null, call)
    const submitted = await tx.signAndSubmit(proxyAccount)
    if (submitted instanceof AvailError) throw submitted

    const receipt = await submitted.receipt(true)
    if (receipt instanceof AvailError) throw receipt
    if (receipt == null) throw new Error("Failed to find transaction")

    const events = await receipt.events()
    if (events instanceof AvailError) throw events
    if (!events.isExtrinsicSuccessPresent()) throw "Extrinsic failed"
    if (events.proxyExecutedSuccessfully() !== true) throw "Proxy execution failed"
  }

  // Removing Proxy
  {
    const tx = client.tx().proxy().removeProxy(proxyAccount.address, "Any", 0)
    const submitted = await tx.signAndSubmit(mainAccount)
    if (submitted instanceof AvailError) throw submitted

    const receipt = await submitted.receipt(true)
    if (receipt instanceof AvailError) throw receipt
    if (receipt == null) throw new Error("Failed to find transaction")

    const events = await receipt.events()
    if (events instanceof AvailError) throw events
    if (!events.isExtrinsicSuccessPresent()) throw "Extrinsic failed"

    const event = events.first(avail.proxy.events.ProxyRemoved)
    if (event == null) throw "ProxyRemoved event not found"
    console.log(
      `Delegatee: ${event.delegatee.toSS58()}, Delegator: ${event.delegator.toSS58()}, ProxyType: ${event.proxyType.toString()}, Delay: ${event.delay}`,
    )
  }
}

export async function runProxyPure() {
  const client = await Client.create(LOCAL_ENDPOINT)
  if (client instanceof AvailError) throw client

  const mainAccount = accounts.bob()

  const proxyType = "Any"
  const index = 0
  let proxyAccountId: AccountId

  // Creating Pure Proxy
  {
    const tx = client.tx().proxy().createPure(proxyType, 0, index)
    const submitted = await tx.signAndSubmit(mainAccount)
    if (submitted instanceof AvailError) throw submitted

    const receipt = await submitted.receipt(true)
    if (receipt instanceof AvailError) throw receipt
    if (receipt == null) throw new Error("Failed to find transaction")

    const events = await receipt.events()
    if (events instanceof AvailError) throw events
    if (!events.isExtrinsicSuccessPresent()) throw "Extrinsic failed"

    const event = events.first(avail.proxy.events.PureCreated)
    if (event == null) throw "PureCreated event not found"
    console.log(
      `Pure: ${event.pure.toSS58()}, Who: ${event.who.toSS58()}, ProxyType: ${event.proxyType.toString()}, Index: ${event.disambiguationIndex}`,
    )
    proxyAccountId = event.pure
  }

  // Executing the Proxy.Proxy() call
  {
    const key = "" + Math.ceil(Math.random() * 1_000_000_00)
    const call = client.tx().dataAvailability().createApplicationKey(key)
    const tx = client.tx().proxy().proxy(proxyAccountId, null, call)

    const submitted = await tx.signAndSubmit(mainAccount)
    if (submitted instanceof AvailError) throw submitted

    const receipt = await submitted.receipt(true)
    if (receipt instanceof AvailError) throw receipt
    if (receipt == null) throw new Error("Failed to find transaction")

    const events = await receipt.events()
    if (events instanceof AvailError) throw events
    if (!events.isExtrinsicSuccessPresent()) throw "Extrinsic failed"
    if (events.proxyExecutedSuccessfully() !== true) throw "Proxy execution failed"
  }
}

export async function runProxyFailure() {
  const client = await Client.create(LOCAL_ENDPOINT)
  if (client instanceof AvailError) throw client

  const proxyAccount = accounts.bob()
  const mainAccount = accounts.ferdie()

  // Creating Proxy
  {
    const tx = client.tx().proxy().addProxy(proxyAccount.address, "NonTransfer", 0)
    const submitted = await tx.signAndSubmit(mainAccount)
    if (submitted instanceof AvailError) throw submitted

    const receipt = await submitted.receipt(true)
    if (receipt instanceof AvailError) throw receipt
    if (receipt == null) throw new Error("Failed to find transaction")

    const events = await receipt.events()
    if (events instanceof AvailError) throw events
    if (!events.isExtrinsicSuccessPresent()) throw "Extrinsic failed"
    if (!events.isPresent(avail.proxy.events.ProxyAdded)) throw "ProxyAdded event is missing"
  }

  // Executing the Proxy.Proxy() call
  {
    const call = client.tx().balances().transferKeepAlive(proxyAccount.address, ONE_AVAIL)
    const tx = client.tx().proxy().proxy(mainAccount.address, null, call)
    const submitted = await tx.signAndSubmit(proxyAccount)
    if (submitted instanceof AvailError) throw submitted

    const receipt = await submitted.receipt(true)
    if (receipt instanceof AvailError) throw receipt
    if (receipt == null) throw new Error("Failed to find transaction")

    const events = await receipt.events()
    if (events instanceof AvailError) throw events
    if (!events.isExtrinsicSuccessPresent()) throw "Extrinsic failed"
    if (events.proxyExecutedSuccessfully() !== false) throw "Proxy execution succeeded"
  }

  // Removing Proxy
  {
    const tx = client.tx().proxy().removeProxy(proxyAccount.address, "NonTransfer", 0)
    const submitted = await tx.signAndSubmit(mainAccount)
    if (submitted instanceof AvailError) throw submitted

    const receipt = await submitted.receipt(true)
    if (receipt instanceof AvailError) throw receipt
    if (receipt == null) throw new Error("Failed to find transaction")

    const events = await receipt.events()
    if (events instanceof AvailError) throw events
    if (!events.isExtrinsicSuccessPresent()) throw "Extrinsic failed"
    if (!events.isPresent(avail.proxy.events.ProxyRemoved)) throw "ProxyRemoved event is missing"
  }
}

main().catch((e) => console.log(e))

/* 
  Expected Output:

  Delegatee: 5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty, Delegator: 5CiPPseXPECbkjWCa6MnjNokrgYjMqmKndv2rSnekmSK2DjL, ProxyType: Any, Delay: 0
  Delegatee: 5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty, Delegator: 5CiPPseXPECbkjWCa6MnjNokrgYjMqmKndv2rSnekmSK2DjL, ProxyType: Any, Delay: 0
  Pure: 5ExmaXZXfJgFXKz15TgrW6HvwgVjYJhDfDHPVWK2r61RH6W2, Who: 5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty, ProxyType: Any, Index: 0
*/
