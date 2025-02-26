import { assert_eq, assert_ne } from "."
import { SDK, Account, BN, H256, Block, Filter, Pallets } from "./../src/index"

export async function runTestExtrinsic() {
  const sdk = await SDK.New(SDK.localEndpoint)

  // Balances
  const balancesHash = await runBalances(sdk)

  // Data Availability
  const daHash = await runDA(sdk)

  // System
  const systemHash = await runSystem(sdk)

  // utility
  const utilityHash = await runUtility(sdk)

  // wait for new block
  const blockHash = await waitForNewBlock(sdk)
  const block = await Block.New(sdk.client, blockHash)
  await checkBalances(balancesHash, block)
  await checkDA(daHash, block)
  await checkSystem(systemHash, block)
  await checkUtility(utilityHash, block)

  // proxy
  //const proxyHash = await runProxy(sdk)
}


async function runBalances(sdk: SDK): Promise<H256[]> {
  const randomAccount = Account.generate()
  const account = Account.ferdie()
  const nonce = await Account.nonce(sdk.client, account.address)

  const tx1 = sdk.tx.balances.transferAllowDeath(randomAccount.address, SDK.oneAvail())
  const tx2 = sdk.tx.balances.transferKeepAlive(Account.alice().address, SDK.oneAvail())
  const tx3 = sdk.tx.balances.transferAll(Account.alice().address, false)

  const hash1 = await tx1.execute(account, { nonce: nonce })
  const hash2 = await tx2.execute(account, { nonce: nonce + 1 })
  const hash3 = await tx3.execute(account, { nonce: nonce + 2 })

  return [hash1, hash2, hash3]
}

async function checkBalances(hashes: H256[], block: Block) {
  {
    const tx = block.transactions({ txHash: hashes[0] })[0]
    const txEvents = tx.events()
    if (txEvents == undefined) throw Error()

    assert_eq(txEvents.find(Pallets.BalancesEvents.Withdraw).length, 1)
    assert_eq(txEvents.find(Pallets.BalancesEvents.Endowed).length, 1)
    assert_eq(txEvents.find(Pallets.BalancesEvents.Transfer).length, 1)
    assert_eq(txEvents.find(Pallets.BalancesEvents.Deposit).length, 3)
    assert_eq(txEvents.find(Pallets.SystemEvents.NewAccount).length, 1)
    assert_eq(txEvents.find(Pallets.SystemEvents.ExtrinsicSuccess).length, 1)

    assert_ne(tx.decode(Pallets.BalancesCalls.TransferAllowDeath), undefined)
  }

  {
    const tx = block.transactions({ txHash: hashes[1] })[0]
    const txEvents = tx.events()
    if (txEvents == undefined) throw Error()
    assert_eq(txEvents.find(Pallets.SystemEvents.ExtrinsicSuccess).length, 1)
    assert_ne(tx.decode(Pallets.BalancesCalls.TransferKeepAlive), undefined)
  }

  {
    const tx = block.transactions({ txHash: hashes[2] })[0]
    const txEvents = tx.events()
    if (txEvents == undefined) throw Error()
    assert_eq(txEvents.find(Pallets.SystemEvents.ExtrinsicSuccess).length, 1)
    assert_eq(txEvents.find(Pallets.SystemEvents.KilledAccount).length, 1)

    assert_ne(tx.decode(Pallets.BalancesCalls.TransferAll), undefined)
  }
}

async function runDA(sdk: SDK): Promise<H256[]> {
  const account = Account.alice()
  const nonce = await Account.nonce(sdk.client, account.address)

  const key = "SomeKeyTest" + Math.ceil(Math.random() * 1_000_000_00)
  const tx1 = sdk.tx.dataAvailability.createApplicationKey(key)
  const tx2 = sdk.tx.dataAvailability.submitData("My Data")

  const hash1 = await tx1.execute(account, { nonce: nonce })
  const hash2 = await tx2.execute(account, { app_id: 5, nonce: nonce + 1 })

  return [hash1, hash2]
}

async function checkDA(hashes: H256[], block: Block) {
  {
    const tx = block.transactions({ txHash: hashes[0] })[0]
    const events = tx.events()?.find(Pallets.DataAvailabilityEvents.ApplicationKeyCreated)
    if (events == undefined) throw Error()
    assert_eq(events?.length, 1)
    assert_ne(tx.decode(Pallets.DataAvailabilityCalls.CreateApplicationKey), undefined)
  }

  {
    const tx = block.transactions({ txHash: hashes[1] })[0]
    const events = tx.events()?.find(Pallets.DataAvailabilityEvents.DataSubmitted)
    if (events == undefined) throw Error()
    assert_eq(events?.length, 1)
    assert_ne(tx.decode(Pallets.DataAvailabilityCalls.SubmitData), undefined)
  }
}

async function runSystem(sdk: SDK): Promise<H256[]> {
  const account = Account.alice()
  const nonce = await Account.nonce(sdk.client, account.address)

  const tx1 = sdk.tx.system.remark("MyRemark")
  const tx2 = sdk.tx.system.remarkWithEvent("MyRemarkWithEvent")

  const hash1 = await tx1.execute(account, { nonce: nonce })
  const hash2 = await tx2.execute(account, { nonce: nonce + 1 })

  return [hash1, hash2]
}

async function checkSystem(hashes: H256[], block: Block) {
  {
    const tx = block.transactions({ txHash: hashes[0] })[0]
    const txEvents = tx.events()
    if (txEvents == undefined) throw Error()
    assert_eq(txEvents.find(Pallets.SystemEvents.ExtrinsicSuccess).length, 1)
    assert_ne(tx.decode(Pallets.SystemCalls.Remark), undefined)
  }

  {
    const tx = block.transactions({ txHash: hashes[1] })[0]
    const txEvents = tx.events()
    if (txEvents == undefined) throw Error()
    assert_eq(txEvents.find(Pallets.SystemEvents.ExtrinsicSuccess).length, 1)
    assert_eq(txEvents.find(Pallets.SystemEvents.Remarked).length, 1)
    assert_ne(tx.decode(Pallets.SystemCalls.RemarkWithEvent), undefined)
  }
}

async function runUtility(sdk: SDK): Promise<H256[]> {
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
  const tx1 = sdk.tx.utility.batch(calls)
  const hash1 = await tx1.execute(Account.alice(), { nonce: nonce })

  // Batch All call
  const tx2 = sdk.tx.utility.batchAll(calls)
  const hash2 = await tx2.execute(Account.alice(), { nonce: nonce + 1 })

  // Force Batch call
  const tx3 = sdk.tx.utility.forceBatch(calls)
  const hash3 = await tx3.execute(Account.alice(), { nonce: nonce + 2 })

  //
  //	Things differ when we introduce a call that will fail
  //

  const call3 = sdk.tx.balances.transferKeepAlive(destBob, value2)
  const call4 = sdk.tx.balances.transferKeepAlive(destCharlie, value1)
  calls.push(call3.tx)
  calls.push(call4.tx)

  // Batch call
  const tx4 = sdk.tx.utility.batch(calls)
  const hash4 = await tx4.execute(Account.alice(), { nonce: nonce + 3 })

  // Batch All call
  const tx5 = sdk.tx.utility.batchAll(calls)
  const hash5 = await tx5.execute(Account.alice(), { nonce: nonce + 4 })

  // Force Batch call
  const tx6 = sdk.tx.utility.forceBatch(calls)
  const hash6 = await tx6.execute(Account.alice(), { nonce: nonce + 5 })

  return [hash1, hash2, hash3, hash4, hash5, hash6]
}

async function checkUtility(hashes: H256[], block: Block) {
  {
    const tx = block.transactions({ txHash: hashes[0] })[0]
    const txEvents = tx.events()
    if (txEvents == undefined) throw Error()
    assert_eq(txEvents.find(Pallets.UtilityEvents.ItemCompleted).length, 2)
    assert_eq(txEvents.find(Pallets.UtilityEvents.BatchCompleted).length, 1)
    assert_eq(txEvents.find(Pallets.SystemEvents.ExtrinsicSuccess).length, 1)
  }

  {
    const tx = block.transactions({ txHash: hashes[1] })[0]
    const txEvents = tx.events()
    if (txEvents == undefined) throw Error()
    assert_eq(txEvents.find(Pallets.UtilityEvents.ItemCompleted).length, 2)
    assert_eq(txEvents.find(Pallets.UtilityEvents.BatchCompleted).length, 1)
    assert_eq(txEvents.find(Pallets.SystemEvents.ExtrinsicSuccess).length, 1)
  }

  {
    const tx = block.transactions({ txHash: hashes[2] })[0]
    const txEvents = tx.events()
    if (txEvents == undefined) throw Error()
    assert_eq(txEvents.find(Pallets.UtilityEvents.ItemCompleted).length, 2)
    assert_eq(txEvents.find(Pallets.UtilityEvents.BatchCompleted).length, 1)
    assert_eq(txEvents.find(Pallets.SystemEvents.ExtrinsicSuccess).length, 1)
  }

  {
    const tx = block.transactions({ txHash: hashes[3] })[0]
    const txEvents = tx.events()
    if (txEvents == undefined) throw Error()
    assert_eq(txEvents.find(Pallets.UtilityEvents.ItemCompleted).length, 2)
    assert_eq(txEvents.find(Pallets.UtilityEvents.BatchInterrupted).length, 1)
    assert_eq(txEvents.find(Pallets.SystemEvents.ExtrinsicSuccess).length, 1)
  }

  {
    const tx = block.transactions({ txHash: hashes[4] })[0]
    const txEvents = tx.events()
    if (txEvents == undefined) throw Error()
    assert_eq(txEvents.find(Pallets.SystemEvents.ExtrinsicFailed).length, 1)
  }

  {
    const tx = block.transactions({ txHash: hashes[5] })[0]
    const txEvents = tx.events()
    if (txEvents == undefined) throw Error()
    assert_eq(txEvents.find(Pallets.UtilityEvents.ItemCompleted).length, 3)
    assert_eq(txEvents.find(Pallets.UtilityEvents.ItemFailed).length, 1)
    assert_eq(txEvents.find(Pallets.UtilityEvents.BatchCompletedWithErrors).length, 1)
    assert_eq(txEvents.find(Pallets.SystemEvents.ExtrinsicSuccess).length, 1)
  }
}


async function runProxy(sdk: SDK): Promise<H256[]> {
  const proxyAccount = Account.bob()
  const mainAccount = Account.alice()
  const mainAccountNonce = await Account.nonce(sdk.client, mainAccount.address)
  const proxyAccountNonce = await Account.nonce(sdk.client, proxyAccount.address)
  const proxyType = "Any"
  const index = 0
  const hash: H256[] = []

  // Normal Proxy
  {
    // Creating Proxy
    const tx1 = sdk.tx.proxy.addProxy(proxyAccount.address, "Any", 0)
    const hash1 = await tx1.execute(mainAccount, { nonce: mainAccountNonce })
    sleep(250)

    // Executing the Proxy.Proxy() call
    const call2 = sdk.tx.balances.transferKeepAlive(proxyAccount.address, SDK.oneAvail()).tx
    const tx2 = sdk.tx.proxy.proxy(mainAccount.address, null, call2)
    const hash2 = await tx2.execute(proxyAccount, { nonce: proxyAccountNonce })
    sleep(250)

    // Removing Proxy
    const tx7 = sdk.tx.proxy.removeProxy(proxyAccount.address, "Any", 0)
    const hash7 = await tx7.execute(mainAccount, { nonce: mainAccountNonce + 1 })
    sleep(250)

    hash.push(hash1, hash2, hash7)

  }

  // Pure Proxy
  {
    // Creating Proxy
    const tx3 = sdk.tx.proxy.createPure(proxyType, 0, index)
    const hash3 = await tx3.execute(mainAccount, { nonce: mainAccountNonce + 2 })
    sleep(250)

    hash.push(hash3)
  }

  // Failure Proxy
  {
    const proxyAccount = Account.charlie()
    const mainAccount = Account.dave()
    const mainAccountNonce = await Account.nonce(sdk.client, mainAccount.address)
    const proxyAccountNonce = await Account.nonce(sdk.client, proxyAccount.address)

    // Creating Proxy
    const tx4 = sdk.tx.proxy.addProxy(proxyAccount.address, "NonTransfer", 0)
    const hash4 = await tx4.execute(mainAccount, { nonce: mainAccountNonce })
    sleep(250)

    // Executing the Proxy.Proxy() call
    const call5 = sdk.tx.balances.transferKeepAlive(proxyAccount.address, SDK.oneAvail()).tx
    const tx5 = sdk.tx.proxy.proxy(mainAccount.address, null, call5)
    const hash5 = await tx5.execute(proxyAccount, { nonce: proxyAccountNonce })
    sleep(250)

    // Removing Proxy
    const tx7 = sdk.tx.proxy.removeProxy(proxyAccount.address, "NonTransfer", 0)
    const hash7 = await tx7.execute(mainAccount, { nonce: mainAccountNonce + 1 })

    hash.push(hash4, hash5, hash7)
  }

  /*   // Normal Proxy 2
    {
      const proxyAccount = Account.generate()
      const mainAccount = Account.eve()
      const mainAccountNonce = await Account.nonce(sdk.client, mainAccount.address)
  
      // Creating Proxy
      const tx6 = sdk.tx.proxy.addProxy(proxyAccount.address, "Any", 0)
      const hash6 = await tx6.execute(mainAccount, { nonce: mainAccountNonce })
  
      // Removing Proxy
      const tx7 = sdk.tx.proxy.removeProxy(proxyAccount.address, "Any", 0)
      const hash7 = await tx7.execute(mainAccount, { nonce: mainAccountNonce + 1 })
  
      hash.push(hash6, hash7)
    } */

  return hash
}


function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitForNewBlock(sdk: SDK): Promise<H256> {
  const details = await sdk.tx.system.remark("").executeWaitForInclusion(Account.eve(), {})
  return details.blockHash
}