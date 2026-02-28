import type { Client } from "../client/client"
import { Head } from "./head"
import { HeadKind } from "../types/head-kind"

export class Finalized extends Head {
  constructor(client: Client) {
    super(client, HeadKind.Finalized)
  }
}
