import { SDK } from "./../src/index"

export async function run() {
  const sdk = await SDK.New(SDK.localEndpoint())
  const api = sdk.api

  // dataAvailability.appKeys
  {
    const appKeyName = "Reserved-1"
    const entry = await api.query.dataAvailability.appKeys(appKeyName)
    console.log("appKeys")
    if (!entry.isEmpty) {
      const appKey = JSON.parse(entry.toString())
      console.log(`App Key owner: ${appKey.owner}, id: ${appKey.id}`)
    }

    /*
      Output
      App Key owner: 5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY, id: 1
    */
  }

  // dataAvailability.appKeys.entries
  {
    const appKeys: [string, string, number][] = []
    const decoder = new TextDecoder("utf-8")
    const entries = await api.query.dataAvailability.appKeys.entries()
    console.log("appKeys entries")

    entries.forEach((entry: any) => {
      if (entry[1].isSome) {
        const { owner, id } = entry[1].unwrap()
        appKeys.push([decoder.decode(entry[0].slice(49)), owner, parseInt(id.toString())])
      }
    })

    appKeys
      .sort((a, b) => a[2] - b[2])
      .forEach((e) => console.log(`App Key name: ${e[0]}, owner: ${e[1]}, id: ${e[2]}`))

    /*
      Output
      App Key name: Avail, owner: 5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY, id: 0
      App Key name: Reserved-1, owner: 5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY, id: 1
      App Key name: Reserved-2, owner: 5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY, id: 2
      App Key name: Reserved-3, owner: 5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY, id: 3
      App Key name: Reserved-4, owner: 5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY, id: 4
      App Key name: Reserved-5, owner: 5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY, id: 5
      App Key name: Reserved-6, owner: 5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY, id: 6
      App Key name: Reserved-7, owner: 5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY, id: 7
      App Key name: Reserved-8, owner: 5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY, id: 8
      App Key name: Reserved-9, owner: 5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY, id: 9
      App Key name: My JS Key, owner: 5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY, id: 10
      App Key name: My Key Custom, owner: 5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY, id: 11
      App Key name: My Key, owner: 5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY, id: 12
      App Key name: My Key Http, owner: 5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY, id: 13
    */
  }

  // dataAvailability.nextAppId
  {
    const entry = await api.query.dataAvailability.nextAppId()
    console.log("nextAppId")
    if (!entry.isEmpty) {
      console.log(`Next App Id: ${parseInt(entry.toString())}`)
    }

    /*
      Output
      Next App Id: 14
    */
  }

  // staking.activeEra
  {
    const entry: any = await api.query.staking.activeEra()
    console.log("activeEra")
    console.log("Index: " + entry.__internal__raw.index.toNumber(0))
    console.log("Start: " + entry.__internal__raw.start.toString())

    /*
      Output
      Index: 18
      Start: 1734907578000
    */
  }

  // staking.bonded
  {
    const entry = await api.query.staking.bonded("5GNJqTPyNqANBkUVMN1LPPrxXnFouWXoe2wNSmmEoLctxiZY")
    console.log("bonded")
    if (!entry.isEmpty) {
      console.log(`Bonded Stash: ${entry.toString()}`)
    }

    /*
      Output
      Bonded Stash: 5GNJqTPyNqANBkUVMN1LPPrxXnFouWXoe2wNSmmEoLctxiZY
    */
  }

  // staking.bonded.entries
  {
    const entries = await api.query.staking.bonded.entries()
    console.log("bonded entries")
    for (const [key, value] of entries) {
      console.log("Key: " + key.toHuman())
      console.log("Value: " + value.toString())
    }

    /*
      Output
      Key: [ '5GNJqTPyNqANBkUVMN1LPPrxXnFouWXoe2wNSmmEoLctxiZY' ]
      Value: 5GNJqTPyNqANBkUVMN1LPPrxXnFouWXoe2wNSmmEoLctxiZY
    */
  }

  // system.account.entries
  {
    const entries = await api.query.system.account.entries()
    console.log("account entries")
    for (const [key, value] of entries) {
      const entry: any = value
      console.log(key.toHuman())
      console.log("Nonce: " + entry.nonce.toNumber())
      console.log("Consumers: " + entry.consumers.toNumber())
      console.log("Providers: " + entry.providers.toNumber())
      console.log("Sufficients: " + entry.sufficients.toNumber())
      console.log("Free: " + entry.data.free.toString())
      console.log("Reserved: " + entry.data.reserved.toString())
      console.log("Frozen: " + entry.data.frozen.toString())
      console.log("Flags: " + entry.data.flags.toString())
    }

    /*
      Output
      [ '5FCfAonRZgTFrTd9HREEyeJjDpT397KMzizE6T3DvebLFE7n' ]
      Nonce: 0
      Consumers: 0
      Providers: 1
      Sufficients: 0
      Free: 10000000000000000000000000
      Reserved: 0
      Frozen: 0
      Flags: 170141183460469231731687303715884105728
      [ '5CiPPseXPECbkjWCa6MnjNokrgYjMqmKndv2rSnekmSK2DjL' ]
      Nonce: 0
      Consumers: 0
      Providers: 1
      Sufficients: 0
      Free: 10000000000000000000000000
      Reserved: 0
      Frozen: 0
      Flags: 170141183460469231731687303715884105728
      ...
    */
  }

  // system.account
  {
    const entry: any = await api.query.system.account("5GNJqTPyNqANBkUVMN1LPPrxXnFouWXoe2wNSmmEoLctxiZY")
    console.log("account")
    console.log("Nonce: " + entry.nonce.toNumber())
    console.log("Consumers: " + entry.consumers.toNumber())
    console.log("Providers: " + entry.providers.toNumber())
    console.log("Sufficients: " + entry.sufficients.toNumber())
    console.log("Free: " + entry.data.free.toString())
    console.log("Reserved: " + entry.data.reserved.toString())
    console.log("Frozen: " + entry.data.frozen.toString())
    console.log("Flags: " + entry.data.flags.toString())

    /*
      Output
      Nonce: 0
      Consumers: 3
      Providers: 1
      Sufficients: 0
      Free: 10000001160509051331989212
      Reserved: 0
      Frozen: 100000000000000000000000
      Flags: 170141183460469231731687303715884105728
      ...
    */
  }
}
