import { Keyring } from "@polkadot/api"
import { Struct } from "@polkadot/types-codec"
import { Index } from "@polkadot/types/interfaces"
import { BN, KeyringPair, Client } from "."

export interface AccountData extends Struct {
  free: BN
  reserved: BN
  frozen: BN
  flags: BN
}

export interface AccountInfo extends Struct {
  nonce: BN
  consumers: BN
  providers: BN
  sufficients: BN
  data: AccountData
}

export class Account {
  static alice(): KeyringPair {
    return new Keyring({ type: "sr25519" }).addFromUri("//Alice")
  }

  static bob(): KeyringPair {
    return new Keyring({ type: "sr25519" }).addFromUri("//Bob")
  }

  static charlie(): KeyringPair {
    return new Keyring({ type: "sr25519" }).addFromUri("//Charlie")
  }

  static async nonce(client: Client, address: string): Promise<number> {
    const r = await client.api.rpc.system.accountNextIndex<Index>(address)
    return r.toNumber()
  }

  static async balance(client: Client, address: string): Promise<AccountData> {
    const info = await client.api.query.system.account<AccountInfo>(address)
    return info.data
  }

  static async info(client: Client, address: string): Promise<AccountInfo> {
    return await client.api.query.system.account<AccountInfo>(address)
  }


  static async fetchAppKeys(client: Client, address: string): Promise<[string, number][]> {
    const appKeys: [string, number][] = []
    const decoder = new TextDecoder("utf-8")
    const entries = await client.api.query.dataAvailability.appKeys.entries()
    entries.forEach((entry: any) => {
      if (entry[1].isSome) {
        const { owner, id } = entry[1].unwrap()
        if (owner.toString() == address) {
          appKeys.push([decoder.decode(entry[0].slice(49)), parseInt(id.toString())])
        }
      }
    })

    return appKeys.sort((a, b) => a[1] - b[1])
  }

  static async fetchAppIds(client: Client, address: string): Promise<number[]> {
    return (await Account.fetchAppKeys(client, address)).map((e) => e[1])
  }
}