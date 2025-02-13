import { Account } from "../src/sdk/account"
import { Block, Pallets, SDK } from "./../src/index"

const main = async () => {
  const sdk = await SDK.New(SDK.localEndpoint())


  /*   const block = await Block.New(sdk.client, "0x0b0de21828b4d6de4845508d9b96141879414f81861c0dadc4b98c41f4552f07")
    const txs = block.transactions()
    for (const tx of txs) {
  
      console.log("SS58 Address:", tx.ss58Address(), "Nonce:", tx.nonce(), "Tip:", tx.tip()?.toString(), "App Id:", tx.appId(), "Era:", tx.mortality()?.toHuman(), "MultiAddress:", tx.multiAddress()?.toHuman())
      console.log("Pallet Name:", tx.palletName(), "Call Name:", tx.callName(), "Pallet Index:", tx.palletIndex(), "Call Index:", tx.callIndex())
      tx.nonce()
    } */

  const tx = sdk.tx.dataAvailability.createApplicationKey("Key315223")
  const details = await tx.executeWaitForInclusion(Account.alice())
  console.log(`Tx Hash: ${details.txHash}, Tx Index: ${details.txIndex}, Block Hash: ${details.blockHash}, Block Number: ${details.blockNumber}`);
  const ok = details.isSuccessful()
  if (ok == undefined) {
    console.log("Cannot know")
  } else if (ok) {
    console.log("OK")
  } else {
    console.log("Failed")
  }

  if (details.events != null) {
    for (const ev of details.events.iter()) {
      console.log("Pallet Index:", ev.palletIndex(), "Event Index:", ev.eventIndex())
      const res = ev.decode(Pallets.DataAvailabilityEvents.ApplicationKeyCreated)
      if (res != undefined) {
        console.log(res.id)
      }
    }
  } else {
    console.log("No ewvents")
  }



  /*   const watcher = new Watcher(sdk.client, txHash, WaitFor.BlockInclusion)
    await watcher.run()
    console.log("a") */


  process.exit()
}
main()
