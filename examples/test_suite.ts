import { assert_eq, assert_ne } from "."
import { SDK, Account, BN, H256, Block, Pallets, AccountId, KeyringPair, TransactionDetails, Metadata, utils } from "./../src/index"

export async function runTestExtrinsic() {
  const sdk = await SDK.New(SDK.localEndpoint)

  await waitForNewBlock(sdk)

  // Round 1

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

  const tx = sdk.tx.balances.transferKeepAlive(Account.ferdie().address, SDK.oneAvail().mul(new BN(10_000_000)))
  await tx.executeWaitForInclusion(Account.alice(), {})

  // Round 2

  // Proxy
  await runAndCheckProxy(sdk)
  await runAncCheckMultisig(sdk)
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

async function runAndCheckProxy(sdk: SDK) {
  const proxyAccount1 = Account.bob()
  const mainAccount1 = Account.alice()
  const proxyAccount2 = Account.charlie()
  const mainAccount2 = Account.eve()
  const mainAccount3 = Account.dave()
  const proxyType = "Any"
  const index = 0
  let pureProxyAccount = new AccountId(new Uint8Array(32))

  // Create Proxies
  {
    const tx1 = sdk.tx.proxy.addProxy(proxyAccount1.address, "Any", 0)
    const hash1 = await tx1.execute(mainAccount1, { nonce: await Account.nonce(sdk.client, mainAccount1.address) })

    const tx2 = sdk.tx.proxy.addProxy(proxyAccount2.address, "NonTransfer", 0)
    const hash2 = await tx2.execute(mainAccount2, { nonce: await Account.nonce(sdk.client, mainAccount2.address) })

    const tx3 = sdk.tx.proxy.createPure(proxyType, 0, index)
    const details = await tx3.executeWaitForInclusion(mainAccount3, { nonce: await Account.nonce(sdk.client, mainAccount3.address) })
    const hash3 = details.txHash
    const blockHash = details.blockHash

    // Check
    const block = await Block.New(sdk.client, blockHash)

    {
      const tx = block.transactions({ txHash: hash1 })[0]
      const txEvents = tx.events()
      if (txEvents == undefined) throw Error()
      assert_eq(txEvents.find(Pallets.ProxyEvents.ProxyAdded).length, 1)
      assert_eq(txEvents.find(Pallets.SystemEvents.ExtrinsicSuccess).length, 1)
    }

    {
      const tx = block.transactions({ txHash: hash2 })[0]
      const txEvents = tx.events()
      if (txEvents == undefined) throw Error()
      assert_eq(txEvents.find(Pallets.ProxyEvents.ProxyAdded).length, 1)
      assert_eq(txEvents.find(Pallets.SystemEvents.ExtrinsicSuccess).length, 1)
    }

    {
      const tx = block.transactions({ txHash: hash3 })[0]
      const txEvents = tx.events()
      if (txEvents == undefined) throw Error()
      assert_eq(txEvents.find(Pallets.ProxyEvents.PureCreated).length, 1)
      assert_eq(txEvents.find(Pallets.SystemEvents.ExtrinsicSuccess).length, 1)
      pureProxyAccount = txEvents.find(Pallets.ProxyEvents.PureCreated)[0].pure
    }
  }


  // Fund Pure
  const tx = sdk.tx.balances.transferKeepAlive(pureProxyAccount.toSS58(), SDK.oneAvail().mul(new BN(10)))
  await tx.executeWaitForInclusion(Account.alice(), {})


  // Execute Proxies
  {
    const call1 = sdk.tx.balances.transferKeepAlive(proxyAccount1.address, SDK.oneAvail()).tx
    const tx1 = sdk.tx.proxy.proxy(mainAccount1.address, null, call1)
    const hash1 = await tx1.execute(proxyAccount1, { nonce: await Account.nonce(sdk.client, proxyAccount1.address) })

    const call2 = sdk.tx.balances.transferKeepAlive(proxyAccount2.address, SDK.oneAvail()).tx
    const tx2 = sdk.tx.proxy.proxy(mainAccount2.address, null, call2)
    const hash2 = await tx2.execute(proxyAccount2, { nonce: await Account.nonce(sdk.client, proxyAccount2.address) })

    const call3 = sdk.tx.balances.transferKeepAlive(mainAccount3.address, SDK.oneAvail()).tx
    const tx3 = sdk.tx.proxy.proxy(pureProxyAccount.toSS58(), null, call3)
    const details = await tx3.executeWaitForInclusion(mainAccount3, { nonce: await Account.nonce(sdk.client, mainAccount3.address) })
    const hash3 = details.txHash
    const blockHash = details.blockHash


    // Check
    const block = await Block.New(sdk.client, blockHash)

    {
      const tx = block.transactions({ txHash: hash1 })[0]
      const txEvents = tx.events()
      if (txEvents == undefined) throw Error()
      assert_eq(txEvents.find(Pallets.ProxyEvents.ProxyExecuted).length, 1)
      assert_eq(txEvents.find(Pallets.SystemEvents.ExtrinsicSuccess).length, 1)
      assert_eq(txEvents.find(Pallets.ProxyEvents.ProxyExecuted)[0].result.variantIndex, 0)
    }

    {
      const tx = block.transactions({ txHash: hash2 })[0]
      const txEvents = tx.events()
      if (txEvents == undefined) throw Error()
      assert_eq(txEvents.find(Pallets.ProxyEvents.ProxyExecuted).length, 1)
      assert_eq(txEvents.find(Pallets.SystemEvents.ExtrinsicSuccess).length, 1)
      assert_eq(txEvents.find(Pallets.ProxyEvents.ProxyExecuted)[0].result.variantIndex, 1)
    }

    {
      const tx = block.transactions({ txHash: hash3 })[0]
      const txEvents = tx.events()
      if (txEvents == undefined) throw Error()
      assert_eq(txEvents.find(Pallets.ProxyEvents.ProxyExecuted).length, 1)
      assert_eq(txEvents.find(Pallets.SystemEvents.ExtrinsicSuccess).length, 1)
      assert_eq(txEvents.find(Pallets.ProxyEvents.ProxyExecuted)[0].result.variantIndex, 0)
    }
  }

  // Remove Proxies
  {
    const tx1 = sdk.tx.proxy.removeProxy(proxyAccount1.address, "Any", 0)
    const hash1 = await tx1.execute(mainAccount1, { nonce: await Account.nonce(sdk.client, mainAccount1.address) })

    const tx2 = sdk.tx.proxy.removeProxy(proxyAccount2.address, "NonTransfer", 0)
    const details = await tx2.executeWaitForInclusion(mainAccount2, { nonce: await Account.nonce(sdk.client, mainAccount2.address) })
    const hash2 = details.txHash
    const blockHash = details.blockHash

    // Check
    const block = await Block.New(sdk.client, blockHash)

    {
      const tx = block.transactions({ txHash: hash1 })[0]
      const txEvents = tx.events()
      if (txEvents == undefined) throw Error()
      assert_eq(txEvents.find(Pallets.ProxyEvents.ProxyRemoved).length, 1)
      assert_eq(txEvents.find(Pallets.SystemEvents.ExtrinsicSuccess).length, 1)
    }

    {
      const tx = block.transactions({ txHash: hash2 })[0]
      const txEvents = tx.events()
      if (txEvents == undefined) throw Error()
      assert_eq(txEvents.find(Pallets.ProxyEvents.ProxyRemoved).length, 1)
      assert_eq(txEvents.find(Pallets.SystemEvents.ExtrinsicSuccess).length, 1)
    }
  }
}

async function runAncCheckMultisig(sdk: SDK) {
  // Multisig Signatures
  const [alice, bob, charlie] = [Account.alice(), Account.bob(), Account.charlie()]

  // Create Multisig Account
  const threshold = 3
  const multisigAddress = utils.generateMultisig([alice.address, bob.address, charlie.address], threshold)
  await fundMultisigAccount(sdk, alice, multisigAddress)

  // Define what action will be taken by the multisig account
  const amount = SDK.oneAvail()
  const call = sdk.tx.balances.transferKeepAlive(multisigAddress, amount)
  // Data needed for multisig approval and execution
  const callHash = call.tx.method.hash.toString()
  const callData = call.tx.unwrap().toHex()
  const maxWeight = (await call.paymentQueryCallInfo()).weight

  // Create New Multisig
  const call1signatures = utils.sortMultisigAddresses([bob.address, charlie.address])
  const firstResult = await firstApproval(sdk, alice, threshold, call1signatures, callHash, maxWeight)

  // check 
  {
    const block = await Block.New(sdk.client, firstResult.blockHash)
    const tx = block.transactions({ txHash: firstResult.txHash })[0]
    const txEvents = tx.events()
    if (txEvents == undefined) throw Error()
    assert_eq(txEvents.find(Pallets.MultisigEvents.NewMultisig).length, 1)
    assert_eq(txEvents.find(Pallets.SystemEvents.ExtrinsicSuccess).length, 1)
  }

  // Approve existing Multisig
  const timepoint: Metadata.TimepointBlocknumber = { height: firstResult.blockNumber, index: firstResult.txIndex }
  const call2signatures = utils.sortMultisigAddresses([alice.address, charlie.address])
  const secondResult = await nextApproval(sdk, bob, threshold, call2signatures, timepoint, callHash, maxWeight)

  // check 
  {
    const block = await Block.New(sdk.client, secondResult.blockHash)
    const tx = block.transactions({ txHash: secondResult.txHash })[0]
    const txEvents = tx.events()
    if (txEvents == undefined) throw Error()
    assert_eq(txEvents.find(Pallets.MultisigEvents.MultisigApproval).length, 1)
    assert_eq(txEvents.find(Pallets.SystemEvents.ExtrinsicSuccess).length, 1)
  }

  // Execute Multisig
  const call3signatures = utils.sortMultisigAddresses([alice.address, bob.address])
  const thirdResult = await lastApproval(sdk, charlie, threshold, call3signatures, timepoint, callData, maxWeight)

  // check 
  {
    const block = await Block.New(sdk.client, thirdResult.blockHash)
    const tx = block.transactions({ txHash: thirdResult.txHash })[0]
    const txEvents = tx.events()
    if (txEvents == undefined) throw Error()
    assert_eq(txEvents.find(Pallets.MultisigEvents.MultisigExecuted).length, 1)
    assert_eq(txEvents.find(Pallets.SystemEvents.ExtrinsicSuccess).length, 1)
    assert_eq(txEvents.find(Pallets.MultisigEvents.MultisigExecuted)[0].result.variantIndex, 0)
  }

}

async function waitForNewBlock(sdk: SDK): Promise<H256> {
  const details = await sdk.tx.system.remark("STOP").executeWaitForInclusion(Account.eve(), {})
  return details.blockHash
}

async function firstApproval(
  sdk: SDK,
  account: KeyringPair,
  threshold: number,
  otherSignatures: string[],
  callHash: string,
  maxWeight: Metadata.Weight,
): Promise<TransactionDetails> {
  const tx = sdk.tx.multisig.approveAsMulti(threshold, otherSignatures, null, callHash, maxWeight)
  const res = await tx.executeWaitForInclusion(account, {})
  assert_eq(res.isSuccessful(), true)
  if (res.events == undefined) throw Error()

  return res
}

async function nextApproval(
  sdk: SDK,
  account: KeyringPair,
  threshold: number,
  otherSignatures: string[],
  timepoint: Metadata.TimepointBlocknumber,
  callHash: string,
  maxWeight: Metadata.Weight,
): Promise<TransactionDetails> {
  const tx = sdk.tx.multisig.approveAsMulti(threshold, otherSignatures, timepoint, callHash, maxWeight)
  const res = await tx.executeWaitForInclusion(account, {})
  assert_eq(res.isSuccessful(), true)
  return res
}

async function lastApproval(
  sdk: SDK,
  account: KeyringPair,
  threshold: number,
  otherSignatures: string[],
  timepoint: Metadata.TimepointBlocknumber,
  callData: string,
  maxWeight: Metadata.Weight,
): Promise<TransactionDetails> {
  const tx = sdk.tx.multisig.asMulti(threshold, otherSignatures, timepoint, callData, maxWeight)
  const res = await tx.executeWaitForInclusion(account, {})
  assert_eq(res.isSuccessful(), true)

  return res
}


async function fundMultisigAccount(sdk: SDK, alice: KeyringPair, multisigAddress: string): Promise<string> {
  const amount = SDK.oneAvail().mul(new BN(100)) // 100 Avail
  const tx = sdk.tx.balances.transferKeepAlive(multisigAddress, amount)
  const res = await tx.executeWaitForInclusion(alice, {})
  assert_eq(res.isSuccessful(), true)

  return multisigAddress
}