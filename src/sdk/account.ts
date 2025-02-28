import { Keyring } from "@polkadot/api"
import { Struct } from "@polkadot/types-codec"
import { encodeAddress } from "@polkadot/util-crypto"
import { Index } from "@polkadot/types/interfaces"
import { BN, KeyringPair, Client, Metadata } from "."

export interface AccountInfo extends Struct {
  nonce: BN
  consumers: BN
  providers: BN
  sufficients: BN
  data: Metadata.AccountData
}

export class Account {
  static new(uri: string): KeyringPair {
    return new Keyring({ type: "sr25519" }).addFromUri(uri)
  }

  static generate(): KeyringPair {
    const array: Uint8Array = new Uint8Array(32)
    for (let i = 0; i < 32; i++) {
      array[i] = Math.floor(Math.random() * 256)
    }
    return new Keyring({ type: "sr25519" }).addFromSeed(array)
  }

  static toSS58(value: Uint8Array | string): string {
    return encodeAddress(value)
  }

  static alice(): KeyringPair {
    return new Keyring({ type: "sr25519" }).addFromUri("//Alice")
  }

  static bob(): KeyringPair {
    return new Keyring({ type: "sr25519" }).addFromUri("//Bob")
  }

  static charlie(): KeyringPair {
    return new Keyring({ type: "sr25519" }).addFromUri("//Charlie")
  }

  static dave(): KeyringPair {
    return new Keyring({ type: "sr25519" }).addFromUri("//Dave")
  }

  static eve(): KeyringPair {
    return new Keyring({ type: "sr25519" }).addFromUri("//Eve")
  }

  static ferdie(): KeyringPair {
    return new Keyring({ type: "sr25519" }).addFromUri("//Ferdie")
  }

  static async nonce(client: Client, accountId: Metadata.AccountId | string): Promise<number> {
    const address = accountId instanceof Metadata.AccountId ? accountId.toSS58() : accountId
    const r = await client.api.rpc.system.accountNextIndex<Index>(address)
    return r.toNumber()
  }

  static async balance(client: Client, accountId: Metadata.AccountId | string): Promise<Metadata.AccountData> {
    const address = accountId instanceof Metadata.AccountId ? accountId.toSS58() : accountId
    const info = await client.api.query.system.account<AccountInfo>(address)
    return info.data
  }

  static async info(client: Client, accountId: Metadata.AccountId | string): Promise<AccountInfo> {
    const address = accountId instanceof Metadata.AccountId ? accountId.toSS58() : accountId
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
