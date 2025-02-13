import { Block, SDK, utils, WaitFor, Watcher } from "./../src/index"

const main = async () => {
  const sdk = await SDK.New(SDK.localEndpoint())


  /*   const block = await Block.New(sdk.client, "0x0b0de21828b4d6de4845508d9b96141879414f81861c0dadc4b98c41f4552f07")
    const txs = block.transactions()
    for (const tx of txs) {
  
      console.log("SS58 Address:", tx.ss58Address(), "Nonce:", tx.nonce(), "Tip:", tx.tip()?.toString(), "App Id:", tx.appId(), "Era:", tx.mortality()?.toHuman(), "MultiAddress:", tx.multiAddress()?.toHuman())
      console.log("Pallet Name:", tx.palletName(), "Call Name:", tx.callName(), "Pallet Index:", tx.palletIndex(), "Call Index:", tx.callIndex())
      tx.nonce()
    } */

  const tx = sdk.tx.dataAvailability.submitData("Data")
  const details = await tx.executeWaitForFinalization(SDK.alice())
  console.log(`Tx Hash: ${details.txHash}, Tx Index: ${details.txIndex}, Block Hash: ${details.blockHash}, Block Number: ${details.blockNumber}`);

  /*   const watcher = new Watcher(sdk.client, txHash, WaitFor.BlockInclusion)
    await watcher.run()
    console.log("a") */


  process.exit()
}
main()
