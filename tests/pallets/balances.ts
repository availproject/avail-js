import { assertEqJson, isOkAndNotNull, isNotNull, isOk, assertEq } from ".."
import { Client, ClientError, MAINNET_ENDPOINT, TURING_ENDPOINT } from "../../src/sdk"
import { balances } from "../../src/sdk/types/pallets"
import { ICall } from "../../src/sdk/interface"
import { AccountId, BN } from "../../src/sdk/types"

export default async function runTests() {
  await tx_test()
  await event_test()
}

async function tx_test() {
  const client = await Client.create(MAINNET_ENDPOINT)
  if (client instanceof ClientError) throw client

  const blockClient = client.blockClient()
  {
    // TransferAll
    const submittable = client.tx.balances.transferAll(
      "0x28806db1fa697e9c4967d8bd8ee78a994dfea2887486c39969a7d16bfebbf36f",
      false,
    )
    const expectedCall = ICall.decode(balances.tx.TransferAll, submittable.call.method.toU8a())!
    const [actualCall] = isOkAndNotNull(await blockClient.transactionStatic(balances.tx.TransferAll, 1828050, 1))
    assertEqJson(actualCall, expectedCall)
  }

  {
    // TransferAllowDeath
    const submittable = client.tx.balances.transferAllowDeath(
      "0x0d584a4cbbfd9a4878d816512894e65918e54fae13df39a6f520fc90caea2fb0",
      new BN("2010899374608366600109698"),
    )
    const expectedCall = ICall.decode(balances.tx.TransferAllowDeath, submittable.call.method.toU8a())!
    const [actualCall] = isOkAndNotNull(await blockClient.transactionStatic(balances.tx.TransferAllowDeath, 1828972, 1))
    assertEqJson(actualCall, expectedCall)
  }

  {
    // TransferKeepAlive
    const submittable = client.tx.balances.transferKeepAlive(
      "0x00d6fb2b0c83e1bbf6938265912d900f57c9bee67bd8a8cb18ec50fefbf47931",
      new BN("616150000000000000000"),
    )
    const expectedCall = ICall.decode(balances.tx.TransferKeepAlive, submittable.call.method.toU8a())!
    const [actualCall] = isOkAndNotNull(await blockClient.transactionStatic(balances.tx.TransferKeepAlive, 1828947, 1))
    assertEqJson(actualCall, expectedCall)
  }
}

async function event_test() {
  const client = isOk(await Client.create(MAINNET_ENDPOINT))
  const eventClient = client.eventClient()

  {
    const events = isOkAndNotNull(await eventClient.transactionEvents(1861163, 1))
    {
      // Withdraw
      const event = events.find(balances.events.Withdraw, true)
      const expected = new balances.events.Withdraw(
        AccountId.from("5GTefZ16Yy5AwMEgeRFDLo6cG3ayy4DVPpFDkjCuvSJJMt3i", true),
        new BN("125294783490551801"),
      )
      assertEqJson(event, expected)
    }

    {
      // Endowed
      const event = events.find(balances.events.Endowed, true)
      const expected = new balances.events.Endowed(
        AccountId.from("0xb96a560df143b2e49f989a4e2c4786e7abf7400c9fe39427d84f83b22a2d4e0b", true),
        new BN("3744383889315788884073"),
      )
      assertEqJson(event, expected)
    }

    {
      // Transfer
      const event = events.find(balances.events.Transfer, true)
      const expected = new balances.events.Transfer(
        AccountId.from("0xc270d5832919913ab755e7cc1823811588e8c2f79f8b68e908800014fd96881c", true),
        AccountId.from("0xb96a560df143b2e49f989a4e2c4786e7abf7400c9fe39427d84f83b22a2d4e0b", true),
        new BN("3744383889315788884073"),
      )
      assertEqJson(event, expected)
    }

    {
      // Deposit
      const deposits = isOk(events.findAll(balances.events.Deposit))
      const expected = new balances.events.Deposit(
        AccountId.from("0x6d6f646c70792f74727372790000000000000000000000000000000000000000", true),
        new BN("100235826792441440"),
      )
      assertEq(deposits.length, 3)
      assertEqJson(deposits[1], expected)
    }
  }

  {
    // Reserved
    const events = isOkAndNotNull(await eventClient.transactionEvents(1861590, 1))
    const event = events.find(balances.events.Reserved, true)
    const expected = new balances.events.Reserved(
      AccountId.from("0x4c4062701850428210b0bb341c92891c2cd8f67c5e66326991f8ee335de2394a", true),
      new BN("2100000000000000000"),
    )
    assertEqJson(event, expected)
  }

  {
    // Unreserved
    const events = isOkAndNotNull(await eventClient.transactionEvents(1861592, 1))
    const event = events.find(balances.events.Unreserved, true)
    const expected = new balances.events.Unreserved(
      AccountId.from("0x4c4062701850428210b0bb341c92891c2cd8f67c5e66326991f8ee335de2394a", true),
      new BN("2100000000000000000"),
    )
    assertEqJson(event, expected)
  }

  {
    // Unlocked
    const events = isOkAndNotNull(await eventClient.transactionEvents(1861592, 1))
    const event = events.find(balances.events.Unlocked, true)
    const expected = new balances.events.Unlocked(
      AccountId.from("0x248fa9bcba295608e1a3d36455a536ac4e4011e8366d8f56effb732b30dc372b", true),
      new BN("77000000000000000000000"),
    )
    assertEqJson(event, expected)
  }

  {
    const client = isOk(await Client.create(TURING_ENDPOINT))
    const eventClient = client.eventClient()

    // Locked
    const events = isOkAndNotNull(await eventClient.transactionEvents(2280015, 1))
    const event = events.find(balances.events.Locked, true)
    const expected = new balances.events.Locked(
      AccountId.from("5Ev2jfLbYH6ENZ8ThTmqBX58zoinvHyqvRMvtoiUnLLcv1NJ", true),
      new BN("24347340768494881376"),
    )
    assertEqJson(event, expected)
  }
}
