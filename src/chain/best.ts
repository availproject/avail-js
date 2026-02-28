import type { Client } from "../client/client"
import { Head } from "./head"
import { HeadKind } from "../types/head-kind"

export class Best extends Head {
  constructor(client: Client) {
    super(client, HeadKind.Best)
  }
}
