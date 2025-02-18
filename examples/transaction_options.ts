import { assert_eq } from "."
import { Account, Block, SDK } from "./../src/index"

export async function runTransactionOptions() {
  await nonce()
  await app_id()
  await tip()
  await mortality()

  console.log("runTransactionOptions finished correctly")
}

export async function nonce() {
  const sdk = await SDK.New(SDK.localEndpoint)
  const account = Account.alice()
  const nonce = await Account.nonce(sdk.client, account.address)

  const tx = sdk.tx.dataAvailability.submitData("Data")
  const res = await tx.executeWaitForInclusion(account, { nonce: nonce, app_id: 1 })
  if (res.isSuccessful() !== true) throw Error()

  const block = await Block.New(sdk.client, res.blockHash)
  const blockTx = block.transactions({ txIndex: res.txIndex })
  assert_eq(blockTx.length, 1)
  assert_eq(blockTx[0].nonce(), nonce)

  console.log("runTransactionOptionsNonce finished correctly")
}

export async function app_id() {
  const sdk = await SDK.New(SDK.localEndpoint)
  const account = Account.alice()
  const appId = 5

  const tx = sdk.tx.dataAvailability.submitData("Data")
  const res = await tx.executeWaitForInclusion(account, { app_id: appId })
  if (res.isSuccessful() !== true) throw Error()

  const block = await Block.New(sdk.client, res.blockHash)
  const blockTx = block.transactions({ txIndex: res.txIndex })
  assert_eq(blockTx.length, 1)
  assert_eq(blockTx[0].appId(), appId)

  console.log("runTransactionOptionsAppId finished correctly")
}

export async function tip() {
  const sdk = await SDK.New(SDK.localEndpoint)
  const account = Account.alice()
  const tip = SDK.oneAvail()

  const tx = sdk.tx.dataAvailability.submitData("Data")
  const res = await tx.executeWaitForInclusion(account, { tip: tip })
  if (res.isSuccessful() !== true) throw Error()

  const block = await Block.New(sdk.client, res.blockHash)
  const blockTx = block.transactions({ txIndex: res.txIndex })
  assert_eq(blockTx.length, 1)
  assert_eq(blockTx[0].tip()?.toString(), tip.toString())

  console.log("runTransactionOptionsTips finished correctly")
}


export async function mortality() {
  const sdk = await SDK.New(SDK.localEndpoint)
  const account = Account.alice()
  const mortality = 16

  const tx = sdk.tx.dataAvailability.submitData("Data")
  const res = await tx.executeWaitForInclusion(account, { mortality: mortality })
  if (res.isSuccessful() !== true) throw Error()

  const block = await Block.New(sdk.client, res.blockHash)
  const blockTx = block.transactions({ txIndex: res.txIndex })
  assert_eq(blockTx.length, 1)
  assert_eq(blockTx[0].mortality()?.asMortalEra.period.toNumber(), mortality)

  console.log("runTransactionOptionsMortality finished correctly")
}