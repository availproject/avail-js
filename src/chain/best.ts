import type { Client } from "../client/client"
import { Head } from "./head"
import { HeadKind } from "../types"

export class Best extends Head {
  constructor(client: Client) {
    super(client, HeadKind.Best)
  }
}
