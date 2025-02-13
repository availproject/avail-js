import { initialize } from "../chain"
import { Transactions } from "./sdk_transactions"
import { BN, Client } from "."

export class SDK {
  client: Client
  tx: Transactions

  static async New(endpoint: string): Promise<SDK> {
    const api = await initialize(endpoint)
    return new SDK(new Client(api))
  }

  private constructor(client: Client) {
    this.client = client
    this.tx = new Transactions(client)
  }

  static oneAvail(): BN {
    return new BN(10).pow(new BN(18))
  }

  static localEndpoint(): string {
    return "ws://127.0.0.1:9944"
  }

  static turingEndpoint(): string {
    return "wss://turing-rpc.avail.so/ws"
  }

  static mainnetEndpoint(): string {
    return "wss://mainnet-rpc.avail.so/ws"
  }
}
