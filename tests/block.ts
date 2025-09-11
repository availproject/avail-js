import { Client, TURING_ENDPOINT } from "./../src/sdk"
import { BlockExtrinsic, BlockRawExtrinsic, BlockSignedExtrinsic } from "../src/sdk/block"
import { eqJson, isOkNotNull, isOk, eq, isTrue, neq } from "."
import { SubmitData } from "../src/sdk/types/pallets/dataAvailability/tx"
import { Set } from "../src/sdk/types/pallets/timestamp/tx"
import { SignedExtrinsic } from "../src/sdk/transaction"

export default async function runTests() {
  const client = isOk(await Client.create(TURING_ENDPOINT))
  const blockHeight = 2288374

  // const submittable_01 = client.tx.dataAvailability.submitData("Test Data 1")
  // const submittable_02 = client.tx.dataAvailability.submitData("Test Data 2")
  // const submittable_03 = client.tx.dataAvailability.createApplicationKey("Awesome Key")

  // await submittable_01.signAndSubmit(alice(), { app_id: 1 })
  // await submittable_02.signAndSubmit(alice(), { app_id: 1 })
  // await submittable_01.signAndSubmit(bob(), { app_id: 1 })
  // await submittable_01.signAndSubmit(bob(), { app_id: 2 })
  // await submittable_01.signAndSubmit(eve(), { app_id: 2 })
  // await submittable_03.signAndSubmit(eve(), { app_id: 0 })

  // Can be block hash or block number
  const block = client.block(2288374)

  // Get All Data Submissions
  {
    const txs: BlockSignedExtrinsic<SubmitData>[] = isOk(await block.sxt.all(SubmitData))
    eq(txs.length, 5)
    eq(txs[0].ss58Address, "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY") // Alice
    eq(txs[4].ss58Address, "5HGjWAeFDfFCWPsjFQdVV2Msvz2XtMktvgocEZcCj68kUMaw") // Eve
    eq(txs[0].appId, 1)
    eq(txs[4].appId, 2)
    eqJson(txs[0].call.data, new TextEncoder().encode("Test Data 1"))
  }

  // Count
  {
    const submitDataCount = isOk(await block.sxt.count(SubmitData))
    eq(submitDataCount, 5)
  }

  // Get All Data Submissions with App Id 1
  {
    const appId = 1
    const txs: BlockSignedExtrinsic<SubmitData>[] = isOk(await block.sxt.all(SubmitData, { appId }))
    txs.forEach((x) => eq(x.appId, appId))
    eq(txs.length, 3)
    eq(txs[0].ss58Address, "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY") // Alice
    eq(txs[2].ss58Address, "5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty") // Bob
  }

  //  Get All Data Submissions with App Id 1 by Alice
  {
    const appId = 1
    const ss58Address = "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY"
    const txs: BlockSignedExtrinsic<SubmitData>[] = isOk(await block.sxt.all(SubmitData, { appId, ss58Address }))
    txs.forEach((x) => eq(x.appId, appId))
    txs.forEach((x) => eq(x.ss58Address, ss58Address))
    eq(txs.length, 2)
    eqJson(txs[0].call.data, new TextEncoder().encode("Test Data 1"))
    eqJson(txs[1].call.data, new TextEncoder().encode("Test Data 2"))
  }

  // Get Data Submission with specific Transaction Hash or Transaction Index
  {
    const txHash = "0x95bcf85d52fe45eacd02044522bbd433d41477799dc5d43eecc446bf50f722c0"
    const txIndex = 4
    const tx1: BlockSignedExtrinsic<SubmitData> = isOkNotNull(await block.sxt.get(SubmitData, txHash))
    const tx2: BlockSignedExtrinsic<SubmitData> = isOkNotNull(await block.sxt.get(SubmitData, txIndex))
    isTrue(tx1.txIndex == 4 && tx1.txIndex == tx2.txIndex)
    isTrue(tx1.txHash.toHex() == txHash && tx1.txHash.toHex() == tx2.txHash.toHex())
  }

  // Works the same with first/last/all
  {
    const txHash = "0x95bcf85d52fe45eacd02044522bbd433d41477799dc5d43eecc446bf50f722c0"
    const txIndex = 4
    const tx1: BlockSignedExtrinsic<SubmitData> = isOkNotNull(
      await block.sxt.first(SubmitData, { filter: { TxHash: [txHash] } }),
    )
    const tx2: BlockSignedExtrinsic<SubmitData> = isOkNotNull(
      await block.sxt.first(SubmitData, { filter: { TxIndex: [txIndex] } }),
    )
    isTrue(tx1.txIndex == 4 && tx1.txIndex == tx2.txIndex)
    isTrue(tx1.txHash.toHex() == txHash && tx1.txHash.toHex() == tx2.txHash.toHex())
  }

  // First Last
  {
    const first: BlockSignedExtrinsic<SubmitData> = isOkNotNull(await block.sxt.first(SubmitData))
    const last: BlockSignedExtrinsic<SubmitData> = isOkNotNull(await block.sxt.last(SubmitData))
    eq(first.txIndex, 1)
    eq(first.ss58Address, "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY") // Alice
    eq(last.txIndex, 5)
    eq(last.ss58Address, "5HGjWAeFDfFCWPsjFQdVV2Msvz2XtMktvgocEZcCj68kUMaw") // Eve
  }

  // Fetch Non Signed and Signed Extrinsics
  {
    const set: BlockExtrinsic<Set> = isOkNotNull(await block.ext.first(Set))
    const submitData: BlockExtrinsic<SubmitData> = isOkNotNull(await block.ext.first(SubmitData))
    eq(set.call.now.toString(), "1757506660000")
    eq(set.signature, null)
    eq(set.txIndex, 0)
    neq(submitData.signature, null)
    eq(submitData.txIndex, 1)
  }

  // Fetch Raw Extrinsic
  {
    const ext: BlockRawExtrinsic = isOkNotNull(await block.rxt.first({ filter: { PalletCall: [[29, 1]] } }))
    eq(ext.txHash.toHex(), "0xb0f4382fbfe14836db4b73b301df8b97e2260f5a02076b3f0e42424b354a78f4")
    eq(ext.palletId, 29)
    eq(ext.variantId, 1)
    eq(ext.signerPayload?.appId, 1) // Signature data decoded by the RPC

    if (ext.data == null) throw new Error()
    const tx = isOk(SignedExtrinsic.decode(SubmitData, ext.data))
    eq(tx.signature.extra.appId, 1)
  }

  // {
  //   const tx_hash = "0xb0f4382fbfe14836db4b73b301df8b97e2260f5a02076b3f0e42424b354a78f4"
  //   const tx: BlockExtrinsic<SubmitData> = isOkNotNull(
  //     await block.ext.get(SubmitData, tx_hash),
  //   )
  //   eq(tx.palletId, 29)
  //   eq(tx.variantId, 1)
  //   eq(tx.txHash.toHex(), tx_hash)
  //   eq(tx.txIndex, 1)
  //   eq(tx.ss58Address, "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY")
  //   // App Id, Nonce, Tip
  //   eq(tx.signed?.txExtra.appId, 1)
  //   eq(tx.signed?.txExtra.nonce, 5300)
  //   eq(tx.signed?.txExtra.tip.toString(), "0")
  // }

  /*   {
      const txs: BlockExtrinsic<SubmitData>[] = isOk(await block.ext.all(SubmitData))
      eq(txs.length, 5)
      eq(txs[0].ss58Address, "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY")
    }
  
    {
      const txs = isOk(await block.ext.all(SubmitData))
      eq(txs.length, 5)
    }
  
    {
      const address = "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY"
      const txs = isOk(await block.ext.all(SubmitData, { ss58Address: address }))
      eq(txs.length, 2)
      txs.forEach((x) => eq(x.ss58Address, address))
    }
  
    {
      const txs = isOk(await block.ext.all(SubmitData, { appId: 1 }))
      eq(txs.length, 3)
      txs.forEach((x) => eq(x.signed?.txExtra.appId, 1))
    }
  
    {
      const txs = isOk(
        await block.ext.all(SubmitData, {
          appId: 1,
          ss58Address: "5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty",
        }),
      )
      eq(txs.length, 1)
      eq(txs[0].ss58Address, "5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty")
      eq(txs[0].signed?.txExtra.appId, 1)
    } */

  /*   {
      // Can be transaction hash or transaction index
      const tx_hash = "0x336feb88364f50eecb48eda0c170790bc30b64d3295ac1865706113a301bf33d"
      const tx = isOkNotNull(await block.tx.get(SubmitData, tx_hash))
  
      console.log(`${tx.call.data.length}`)
    }
  
    {
      const tx = isOkNotNull(await block.tx.first(SubmitData))
      console.log(`${tx.call.data.length}`)
    } */
}
