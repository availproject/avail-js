import { eqJson, isOk, isOkNotNull } from ".."
import { Client, MAINNET_ENDPOINT, TURING_ENDPOINT } from "../../src/sdk"
import { proxy } from "../../src/sdk/types/pallets"
import { ICall } from "../../src/sdk/interface"
import { AccountId } from "../../src/sdk/types"
import { ModuleError } from "../../src/sdk/types/metadata"

export default async function runTests() {
  await tx_test()
  await event_test()
}

async function tx_test() {
  const client = isOk(await Client.create(MAINNET_ENDPOINT))
  {
    const block = client.block(1076139)

    // Add Proxy
    const submittable = client.tx.proxy.addProxy(
      "0xa6668ecbef4f8b0c64e294a9addc0fb267ec02cb0e0c3f74f3a45b8f1043c774",
      "NonTransfer",
      0,
    )
    const expectedCall = ICall.decode(proxy.tx.AddProxy, submittable.call.method.toU8a())!
    const actualTx = isOkNotNull(await block.ext.get(proxy.tx.AddProxy, 1))
    eqJson(actualTx.call, expectedCall)
  }

  {
    const block = client.block(1439619)

    // Create Pure
    const submittable = client.tx.proxy.createPure("Any", 0, 0)
    const expectedCall = ICall.decode(proxy.tx.CreatePure, submittable.call.method.toU8a())!
    const actualTx = isOkNotNull(await block.ext.get(proxy.tx.CreatePure, 1))
    eqJson(actualTx.call, expectedCall)
  }

  {
    const block = client.block(1776412)

    // Proxy
    const call = client.tx.staking.nominate([
      "0xc51d936c502bb72e4735619eeed59b3840cdbed6f414bb5da2b5bd977273d663",
      "0x3c243cc085dea34f4f2a1f40ad0740f1423aef957b5b35accc677cf2f4023130",
      "0x12ce9da1bfb72b90ae0060b2ce3ebc653b66d28e04f4821642dab6aefc9f5c2e",
      "0x209a04aa4a6eada5605b38d6bc87056e44a7c79fa31927ff73eb99df69329137",
      "0x0690d90d894580414030216c58faffc65e45b3257c264ffece9a6cf7369f1cb9",
      "0x3c0e5853201324a59630e80e15cd0049c637d1e68ae51a1d190e6f083263ad79",
      "0x4c86609864155fb79dd4939d4b5e09e5a8bd5032ca648a308575ecda7e182f72",
    ])
    const submittable = client.tx.proxy.proxy(
      "0xaabd39bb20728ec512a104178c2244703ae900eb3368ddcd3f8dbf6ed6151696",
      null,
      call,
    )
    const expectedCall = ICall.decode(proxy.tx.Proxy, submittable.call.method.toU8a())!
    const actualTx = isOkNotNull(await block.ext.get(proxy.tx.Proxy, 1))
    eqJson(actualTx.call, expectedCall)
  }

  {
    const block = client.block(790393)

    // Remove Proxy
    const submittable = client.tx.proxy.removeProxy(
      "0x685302266408090333837daf4c1fee2b23c5a7f055b61f6e8d16ad6662b28b39",
      "Staking",
      0,
    )
    const expectedCall = ICall.decode(proxy.tx.RemoveProxy, submittable.call.method.toU8a())!
    const actualTx = isOkNotNull(await block.ext.get(proxy.tx.RemoveProxy, 1))
    eqJson(actualTx.call, expectedCall)
  }
}

async function event_test() {
  {
    const client = isOk(await Client.create(TURING_ENDPOINT))
    const block = client.block(2279940)

    // ProxyAdded
    const events = isOkNotNull(await block.event.ext(1))
    const event = events.find(proxy.events.ProxyAdded, true)
    const expected = new proxy.events.ProxyAdded(
      AccountId.from("5Ev2jfLbYH6ENZ8ThTmqBX58zoinvHyqvRMvtoiUnLLcv1NJ", true),
      AccountId.from("5H9Wh9UPU2kGZRCMLmEDKhhMxh1PLgBefMUgpLgGzFvjKkKw", true),
      "Governance",
      25,
    )
    eqJson(event, expected)
  }

  {
    const client = isOk(await Client.create(TURING_ENDPOINT))
    const block = client.block(2279951)

    // PureCreated
    const events = isOkNotNull(await block.event.ext(1))
    const event = events.find(proxy.events.PureCreated, true)
    const expected = new proxy.events.PureCreated(
      AccountId.from("5EYj7miFkQ8EFNbEdg7MfeG8dHKWHBoLXCrmoTXWZwMpmxAs", true),
      AccountId.from("5Ev2jfLbYH6ENZ8ThTmqBX58zoinvHyqvRMvtoiUnLLcv1NJ", true),
      "Any",
      10,
    )
    eqJson(event, expected)
  }

  {
    const client = isOk(await Client.create(MAINNET_ENDPOINT))
    const block = client.block(1841067)

    // ProxyExecuted
    const events = isOkNotNull(await block.event.ext(1))
    const event = events.find(proxy.events.ProxyExecuted, true)
    const expected = new proxy.events.ProxyExecuted("Ok")
    eqJson(event, expected)
  }

  {
    const client = isOk(await Client.create(TURING_ENDPOINT))
    const block = client.block(2279971)

    // ProxyExecuted Failed
    const events = isOkNotNull(await block.event.ext(1))
    const event = events.find(proxy.events.ProxyExecuted, true)
    const expected = new proxy.events.ProxyExecuted({
      Err: { Module: new ModuleError(40, new Uint8Array([1, 0, 0, 0])) },
    })
    eqJson(event, expected)
  }

  {
    const client = isOk(await Client.create(TURING_ENDPOINT))
    const block = client.block(2279990)

    // ProxyRemoved
    const events = isOkNotNull(await block.event.ext(1))
    const event = events.find(proxy.events.ProxyRemoved, true)
    const expected = new proxy.events.ProxyRemoved(
      AccountId.from("5Ev2jfLbYH6ENZ8ThTmqBX58zoinvHyqvRMvtoiUnLLcv1NJ", true),
      AccountId.from("5H9Wh9UPU2kGZRCMLmEDKhhMxh1PLgBefMUgpLgGzFvjKkKw", true),
      "Any",
      0,
    )
    eqJson(event, expected)
  }
}
