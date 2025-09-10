import { eqJson, isOkNotNull, isOk, eq } from "."
import { alice, bob, charlie, eve } from "../src/sdk/accounts"
import { BlockExtrinsic } from "../src/sdk/block"
import { SubmitData } from "../src/sdk/types/pallets/dataAvailability/tx"
import { avail, Client, ClientError, MAINNET_ENDPOINT, TURING_ENDPOINT } from "./../src/sdk"

export default async function runTests() {
  const client = isOk(await Client.create(TURING_ENDPOINT))

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

  {
    const tx_hash = "0xb0f4382fbfe14836db4b73b301df8b97e2260f5a02076b3f0e42424b354a78f4"
    const tx: BlockExtrinsic<SubmitData> = isOkNotNull(
      await block.ext.get(avail.dataAvailability.tx.SubmitData, tx_hash),
    )
    eq(tx.palletId, 29)
    eq(tx.variantId, 1)
    eq(tx.txHash.toHex(), tx_hash)
    eq(tx.txIndex, 1)
    eq(tx.ss58Address, "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY")
    // App Id, Nonce, Tip
    eq(tx.signed?.txExtra.appId, 1)
    eq(tx.signed?.txExtra.nonce, 5300)
    eq(tx.signed?.txExtra.tip.toString(), "0")
  }

  {
    const txs: BlockExtrinsic<SubmitData>[] = isOk(await block.ext.all(avail.dataAvailability.tx.SubmitData))
    eq(txs.length, 5)
    eq(txs[0].ss58Address, "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY")
  }

  {
    const txs = isOk(await block.ext.all(avail.dataAvailability.tx.SubmitData))
    eq(txs.length, 5)
  }

  {
    const address = "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY"
    const txs = isOk(await block.ext.all(avail.dataAvailability.tx.SubmitData, { ss58Address: address }))
    eq(txs.length, 2)
    txs.forEach((x) => eq(x.ss58Address, address))
  }

  {
    const txs = isOk(await block.ext.all(avail.dataAvailability.tx.SubmitData, { appId: 1 }))
    eq(txs.length, 3)
    txs.forEach((x) => eq(x.signed?.txExtra.appId, 1))
  }

  {
    const txs = isOk(
      await block.ext.all(avail.dataAvailability.tx.SubmitData, {
        appId: 1,
        ss58Address: "5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty",
      }),
    )
    eq(txs.length, 1)
    eq(txs[0].ss58Address, "5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty")
    eq(txs[0].signed?.txExtra.appId, 1)
  }

  /*   {
      // Can be transaction hash or transaction index
      const tx_hash = "0x336feb88364f50eecb48eda0c170790bc30b64d3295ac1865706113a301bf33d"
      const tx = isOkNotNull(await block.tx.get(avail.dataAvailability.tx.SubmitData, tx_hash))
  
      console.log(`${tx.call.data.length}`)
    }
  
    {
      const tx = isOkNotNull(await block.tx.first(avail.dataAvailability.tx.SubmitData))
      console.log(`${tx.call.data.length}`)
    } */
}
