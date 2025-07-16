import { initialize } from "../chain"
import { Transactions } from "./sdk_transactions"
import { BN, Client } from "."

export class SDK {
  client: Client
  tx: Transactions

  static async New(endpoint: string, useHttpProvider?: boolean): Promise<SDK> {
    const api = await initialize(endpoint, undefined, useHttpProvider)
    return new SDK(new Client(api))
  }

  private constructor(client: Client) {
    this.client = client
    this.tx = new Transactions(client)
  }

  static oneAvail(): BN {
    return new BN(10).pow(new BN(18))
  }

  static localEndpoint: string = "ws://127.0.0.1:9944"
  static localHttpEndpoint: string = "http://127.0.0.1:9944"
  static turingEndpoint: string = "wss://turing-rpc.avail.so/ws"
  static turingHttpEndpoint: string = "https://turing-rpc.avail.so/rpc"
  static mainnetEndpoint: string = "wss://mainnet-rpc.avail.so/ws"
  static mainnetHttpEndpoint: string = "https://mainnet-rpc.avail.so/rpc"
}
