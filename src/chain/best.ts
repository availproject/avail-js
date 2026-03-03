import type { Client } from "../client/client"
import { Head } from "./head"

export class Best extends Head {
  constructor(client: Client) {
    super(client, "best")
  }
}
