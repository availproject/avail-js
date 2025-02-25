import { SDK, Account, BN } from "./../src/index"

export async function runTestExtrinsic() {
  const sdk = await SDK.New(SDK.turingEndpoint)

  // Balances
  await runBalances(sdk)

  // Data Availability
  await runDA(sdk)

  // System
  await runSystem(sdk)

  // utility
  await runUtility(sdk)

  // proxy
  await runProxy(sdk)
}
async function runBalances(sdk: SDK) {
  const randomAccount = Account.generate()
  const account = Account.ferdie()
  const nonce = await Account.nonce(sdk.client, account.address)

  const tx1 = sdk.tx.balances.transferAllowDeath(randomAccount.address, SDK.oneAvail())
  const tx2 = sdk.tx.balances.transferKeepAlive(randomAccount.address, SDK.oneAvail())
  const tx3 = sdk.tx.balances.transferAll(Account.alice().address, false)

  await tx1.execute(account, { nonce: nonce })
  await tx2.execute(account, { nonce: nonce + 1 })
  await tx3.execute(account, { nonce: nonce + 2 })
}

async function runDA(sdk: SDK) {
  const account = Account.alice()
  const nonce = await Account.nonce(sdk.client, account.address)

  const key = "SomeKeyTest" + Math.ceil(Math.random() * 1_000_000_00)
  const tx1 = sdk.tx.dataAvailability.createApplicationKey(key)
  const tx2 = sdk.tx.dataAvailability.submitData("My Data")

  await tx1.execute(account, { nonce: nonce })
  await tx2.execute(account, { app_id: 5, nonce: nonce + 1 })
}

async function runSystem(sdk: SDK) {
  const account = Account.alice()
  const nonce = await Account.nonce(sdk.client, account.address)

  const tx1 = sdk.tx.system.remark("MyRemark")
  const tx2 = sdk.tx.system.remarkWithEvent("MyRemarkWithEvent")

  await tx1.execute(account, { nonce: nonce })
  await tx2.execute(account, { nonce: nonce + 1 })
}

async function runUtility(sdk: SDK) {
  const account = Account.alice()
  const nonce = await Account.nonce(sdk.client, account.address)

  const value1 = SDK.oneAvail()
  const value2 = SDK.oneAvail().mul(new BN("100000000"))
  const destBob = "5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty"
  const destCharlie = "5FLSigC9HGRKVhB9FiEo4Y3koPsNmBmLJbpXg2mp1hXcS59Y"

  const call1 = sdk.tx.balances.transferKeepAlive(destBob, value1)
  const call2 = sdk.tx.balances.transferKeepAlive(destCharlie, value1)
  const calls = [call1.tx, call2.tx]

  //
  // Happy Path
  //

  // Batch call
  {
    const tx = sdk.tx.utility.batch(calls)
    await tx.execute(Account.alice(), { nonce: nonce })
  }

  // Batch All call
  {
    const tx = sdk.tx.utility.batchAll(calls)
    await tx.execute(Account.alice(), { nonce: nonce + 1 })
  }

  // Force Batch call
  {
    const tx = sdk.tx.utility.forceBatch(calls)
    await tx.execute(Account.alice(), { nonce: nonce + 2 })
  }

  //
  //	Things differ when we introduce a call that will fail
  //

  const call3 = sdk.tx.balances.transferKeepAlive(destBob, value2)
  const call4 = sdk.tx.balances.transferKeepAlive(destCharlie, value1)
  calls.push(call3.tx)
  calls.push(call4.tx)

  // Batch call
  {
    const tx = sdk.tx.utility.batch(calls)
    await tx.execute(Account.alice(), { nonce: nonce + 3 })
  }

  // Batch All call
  {
    const tx = sdk.tx.utility.batchAll(calls)
    await tx.execute(Account.alice(), { nonce: nonce + 4 })
  }

  // Force Batch call
  {
    const tx = sdk.tx.utility.forceBatch(calls)
    await tx.execute(Account.alice(), { nonce: nonce + 5 })
  }
}

async function runProxy(sdk: SDK) {
  const proxyAccount = Account.bob()
  const mainAccount = Account.alice()
  const mainAccountNonce = await Account.nonce(sdk.client, mainAccount.address)
  const proxyAccountNonce = await Account.nonce(sdk.client, proxyAccount.address)
  const proxyType = "Any"
  const index = 0

  // Normal Proxy
  {
    // Creating Proxy
    {
      const tx = sdk.tx.proxy.addProxy(proxyAccount.address, "Any", 0)
      await tx.execute(mainAccount, { nonce: mainAccountNonce })
    }

    // Executing the Proxy.Proxy() call
    {
      const call = sdk.tx.balances.transferKeepAlive(proxyAccount.address, SDK.oneAvail()).tx
      const tx = sdk.tx.proxy.proxy(mainAccount.address, null, call)
      await tx.execute(proxyAccount, { nonce: proxyAccountNonce })
    }
  }

  // Proxy Failure
  {
    // Creating Proxy
    {
      const tx = sdk.tx.proxy.createPure(proxyType, 0, index)
      await tx.execute(mainAccount, { nonce: mainAccountNonce + 2 })
    }
  }

  // Failure Proxy
  {
    const proxyAccount = Account.charlie()
    const mainAccount = Account.dave()
    const mainAccountNonce = await Account.nonce(sdk.client, mainAccount.address)
    const proxyAccountNonce = await Account.nonce(sdk.client, proxyAccount.address)

    // Creating Proxy
    {
      const tx = sdk.tx.proxy.addProxy(proxyAccount.address, "NonTransfer", 0)
      await tx.execute(mainAccount, { nonce: mainAccountNonce })
    }

    // Executing the Proxy.Proxy() call
    {
      const call = sdk.tx.balances.transferKeepAlive(proxyAccount.address, SDK.oneAvail()).tx
      const tx = sdk.tx.proxy.proxy(mainAccount.address, null, call)
      await tx.execute(proxyAccount, { nonce: proxyAccountNonce })
    }
  }

  // Normal Proxy 2
  {
    const proxyAccount = Account.generate()
    const mainAccount = Account.eve()
    const mainAccountNonce = await Account.nonce(sdk.client, mainAccount.address)

    // Creating Proxy
    {
      const tx = sdk.tx.proxy.addProxy(proxyAccount.address, "Any", 0)
      await tx.execute(mainAccount, { nonce: mainAccountNonce })
    }

    // Removing Proxy
    {
      const tx = sdk.tx.proxy.removeProxy(proxyAccount.address, "Any", 0)
      await tx.execute(mainAccount, { nonce: mainAccountNonce + 1 })
    }
  }
}
