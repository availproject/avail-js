import { Client, LOCAL_ENDPOINT } from "../src/sdk"
import { ClientError } from "../src/sdk/error"

export async function createClient(): Promise<Client> {
  const client = await Client.create(LOCAL_ENDPOINT)
  if (client instanceof ClientError) throw client
  return client
}
