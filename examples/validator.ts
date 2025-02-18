import { SDK, Account, Pallets, Block } from "./../src/index"

export async function runValidator() {
  const sdk = await SDK.New(SDK.localEndpoint)

  const storageAt = await sdk.client.storageAt()
  //const elem = await Pallets.SystemStorage.ParentHash.fetch(storageAt)
  //console.log(elem.toString())

  /*   const block = await Block.New(sdk.client, "0xb2b3ef1553d9067b2c7d3b4eb6fac800343816202c744ca20520dc73506362d7")
    const blockEvents = block.events;
    if (blockEvents == undefined) throw Error()
  
    const events = blockEvents.find(Pallets.SystemEvents.KilledAccount)
    //if (events == undefined) throw Error()
    for (const event of events) {
      console.log(event.account.toSS58())
    }
   */

  const account = Account.generate()
  const minValidatorBond = SDK.oneAvail()
  const sessionKeys = await sdk.client.rotateKeys()
  console.log(sessionKeys)
  const setKeysTx = sdk.tx.session.setKeys(sessionKeys, new Uint8Array())
  await setKeysTx.execute(Account.alice(), {})


  /*   // Bond minValidatorBond or 1 AVAIL token
    const minValidatorBond: BN = ((await api.query.staking.minValidatorBond()) as any) || SDK.oneAvail()
  
    // Bond
    const bondTx = sdk.tx.staking.bond(minValidatorBond, "Staked")
    const _res1 = (await bondTx.executeWaitForInclusion(account)).throwOnFault()
  
    // Generate Session Keys
    const keysBytes = await api.rpc.author.rotateKeys()
    const keys = utils.deconstruct_session_keys(keysBytes.toString())
  
    // Set Keys
    const setKeysTx = sdk.tx.session.setKeys(keys)
    const _res2 = (await setKeysTx.executeWaitForInclusion(account)).throwOnFault()
  
    // Validate
    const validateTx = sdk.tx.staking.validate(50, false)
    const _res3 = (await validateTx.executeWaitForInclusion(account)).throwOnFault()
    */
} 
