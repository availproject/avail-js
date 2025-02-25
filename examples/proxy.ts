import { Account, Pallets, SDK, AccountId } from "./../src/index"
import { assert_eq } from "."

export async function runProxy() {
  await runProxyNormal()
  await runProxyPure()
  await runProxyFailure()

  console.log("runProxy finished correctly")
}

export async function runProxyNormal() {
  const sdk = await SDK.New(SDK.localEndpoint)

  const proxyAccount = Account.bob()
  const mainAccount = Account.ferdie()

  // Creating Proxy
  {
    const tx = sdk.tx.proxy.addProxy(proxyAccount.address, "Any", 0)
    const res = await tx.executeWaitForInclusion(mainAccount, {})
    assert_eq(res.isSuccessful(), true)
    if (res.events == undefined) throw Error()

    const event = res.events.findFirst(Pallets.ProxyEvents.ProxyAdded)
    if (event == undefined) throw Error()
    console.log(`Delegatee: ${event.delegatee.toSS58()}, Delegator: ${event.delegator.toSS58()}, ProxyType: ${event.proxyType.toString()}, Delay: ${event.delay}`)
  }

  // Executing the Proxy.Proxy() call
  {
    const call = sdk.tx.balances.transferKeepAlive(proxyAccount.address, SDK.oneAvail()).tx
    const tx = sdk.tx.proxy.proxy(mainAccount.address, null, call)
    const res = await tx.executeWaitForInclusion(proxyAccount, {})
    assert_eq(res.isSuccessful(), true)
    if (res.events == undefined) throw Error()

    const event = res.events.findFirst(Pallets.ProxyEvents.ProxyExecuted)
    if (event == undefined) throw Error()
    assert_eq(event.result.variantIndex, 0)
    console.log(`Result: ${event.result.toString()}`)
  }

  // Removing Proxy
  {
    const tx = sdk.tx.proxy.removeProxy(proxyAccount.address, "Any", 0)
    const res = await tx.executeWaitForInclusion(mainAccount, {})
    assert_eq(res.isSuccessful(), true)
    if (res.events == undefined) throw Error()

    const event = res.events.findFirst(Pallets.ProxyEvents.ProxyRemoved)
    if (event == undefined) throw Error()
    console.log(`Delegatee: ${event.delegatee.toSS58()}, Delegator: ${event.delegator.toSS58()}, ProxyType: ${event.proxyType.toString()}, Delay: ${event.delay}`)
  }

  console.log("runProxyNormal finished correctly")
}

export async function runProxyPure() {
  const sdk = await SDK.New(SDK.localEndpoint)
  const mainAccount = Account.bob()

  const proxyType = "Any"
  const index = 0
  let proxyAccountId: AccountId

  // Creating Pure Proxy
  {
    const tx = sdk.tx.proxy.createPure(proxyType, 0, index)
    const res = await tx.executeWaitForInclusion(mainAccount, {})
    assert_eq(res.isSuccessful(), true)
    if (res.events == undefined) throw Error()

    const event = res.events.findFirst(Pallets.ProxyEvents.PureCreated)
    if (event == undefined) throw Error()
    console.log(`Pure: ${event.pure.toSS58()}, Who: ${event.who.toSS58()}, ProxyType: ${event.proxyType.toString()}, Index: ${event.disambiguationIndex}`)
    proxyAccountId = event.pure
  }

  // Executing the Proxy.Proxy() call
  {
    const key = "" + Math.ceil(Math.random() * 1_000_000_00)
    const call = sdk.tx.dataAvailability.createApplicationKey(key).tx
    const tx = sdk.tx.proxy.proxy(proxyAccountId, null, call)
    const res = await tx.executeWaitForInclusion(mainAccount, {})
    assert_eq(res.isSuccessful(), true)
    if (res.events == undefined) throw Error()

    const event = res.events.findFirst(Pallets.ProxyEvents.ProxyExecuted)
    if (event == undefined) throw Error()
    assert_eq(event.result.variantIndex, 0)
    console.log(`Result: ${event.result.toString()}`)
  }

  console.log("runProxyPure finished correctly")
}

export async function runProxyFailure() {
  const sdk = await SDK.New(SDK.localEndpoint)

  const proxyAccount = Account.bob()
  const mainAccount = Account.ferdie()

  // Creating Proxy
  {
    const tx = sdk.tx.proxy.addProxy(proxyAccount.address, "NonTransfer", 0)
    const res = await tx.executeWaitForInclusion(mainAccount, {})
    assert_eq(res.isSuccessful(), true)
    if (res.events == undefined) throw Error()
  }

  // Executing the Proxy.Proxy() call
  {
    const call = sdk.tx.balances.transferKeepAlive(proxyAccount.address, SDK.oneAvail()).tx
    const tx = sdk.tx.proxy.proxy(mainAccount.address, null, call)
    const res = await tx.executeWaitForInclusion(proxyAccount, {})
    assert_eq(res.isSuccessful(), true)
    if (res.events == undefined) throw Error()

    const event = res.events.findFirst(Pallets.ProxyEvents.ProxyExecuted)
    if (event == undefined) throw Error()
    assert_eq(event.result.variantIndex, 1)
    console.log(`Result: ${event.result.toString()}`)
  }

  // Removing Proxy
  {
    const tx = sdk.tx.proxy.removeProxy(proxyAccount.address, "NonTransfer", 0)
    const res = await tx.executeWaitForInclusion(mainAccount, {})
    assert_eq(res.isSuccessful(), true)
    if (res.events == undefined) throw Error()
  }

  console.log("runProxyFailure finished correctly")
}