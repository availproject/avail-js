import type { Client } from "../client/client"
import { Head } from "./head"

export class Finalized extends Head {
  constructor(client: Client) {
    super(client, "finalized")
  }
}
