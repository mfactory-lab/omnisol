import {OmnisolClient} from "@omnisol/sdk";
import { Buffer } from 'buffer'
import fs from 'fs'
import {AnchorProvider, Program, Wallet, web3} from '@project-serum/anchor'
import type { Cluster } from '@solana/web3.js'
import { Keypair } from '@solana/web3.js'
import { clusterUrl } from './utils'

export interface Context {
  cluster: Cluster | string
  provider: AnchorProvider
  client: OmnisolClient
}

const context: Context = {
  cluster: 'devnet',
  // @ts-expect-error ...
  provider: undefined,
  // @ts-expect-error ...
  client: undefined,
}

export function initContext({ cluster, keypair }: { cluster: Cluster; keypair: string }) {
  const opts = AnchorProvider.defaultOptions()
  const endpoint = cluster.startsWith('http') ? cluster : clusterUrl(cluster)
  const connection = new web3.Connection(endpoint, opts.commitment)
  const wallet = new Wallet(Keypair.fromSecretKey(Buffer.from(JSON.parse(fs.readFileSync(keypair).toString()))))

  context.cluster = cluster
  context.provider = new AnchorProvider(connection, wallet, opts)
  context.client = new OmnisolClient({
    program: new Program(OmnisolClient.IDL, OmnisolClient.programId, context.provider),
    wallet: context.provider.wallet,
  })

  return context
}

export function useContext() {
  return context
}
