import { BN } from "@polkadot/util"
import { ApiPromise } from "@polkadot/api"
import { H256 } from "."

export interface AccountBalance {
  free: BN
  reserved: BN
  frozen: BN
  flags: BN
}

export async function fetchNonceState(api: ApiPromise, address: string, blockHash?: H256): Promise<number> {
  if (blockHash) {
    const apiAt = await api.at(blockHash)
    const r: any = await apiAt.query.system.account(address)
    return parseInt(r.nonce.toString())
  } else {
    const r: any = await api.query.system.account(address)
    return parseInt(r.nonce.toString())
  }
}

export async function fetchNonceNode(api: ApiPromise, address: string): Promise<number> {
  const r: any = await api.rpc.system.accountNextIndex(address)
  return parseInt(r.toString())
}

export async function fetchBalance(api: ApiPromise, address: string): Promise<AccountBalance> {
  const r: any = await api.query.system.account(address)
  return { free: r.data.free, reserved: r.data.reserved, frozen: r.data.frozen, flags: r.data.flags }
}

export async function fetchAppKeys(api: ApiPromise, address: string): Promise<[string, number][]> {
  const appKeys: [string, number][] = []
  const decoder = new TextDecoder("utf-8")
  const entries = await api.query.dataAvailability.appKeys.entries()
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

export async function fetchAppIds(api: ApiPromise, address: string): Promise<number[]> {
  return (await fetchAppKeys(api, address)).map((e) => e[1])
}
