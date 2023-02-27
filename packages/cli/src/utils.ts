import { LAMPORTS_PER_SOL, PublicKey, clusterApiUrl } from '@solana/web3.js'
import type { Cluster, Transaction } from '@solana/web3.js'
import { BN } from '@project-serum/anchor'

export const clusterUrl = (c: Cluster) => {
  switch (c) {
    case 'mainnet-beta':
      // return 'https://rpc.theindex.io'
      // return 'https://ssc-dao.genesysgo.net'
      // return 'https://jpoolone.genesysgo.net'
      return 'https://solana-api.projectserum.com/'
    case 'testnet':
      return 'https://testnet.rpcpool.com'
  }
  return clusterApiUrl(c as any)
}

/**
 * Generates a link for inspecting the contents
 */
export function inspectTransaction(tx: Transaction, cluster: Cluster = 'mainnet-beta') {
  tx.recentBlockhash = PublicKey.default.toString()
  const base64 = tx.serializeMessage().toString('base64')
  return {
    base64,
    url: `https://explorer.solana.com/tx/inspector?cluster=${cluster}&message=${encodeURIComponent(
      base64,
    )}`,
  }
}

export function lamportsToSol(lamports: number | BN): number {
  if (typeof lamports === 'number') {
    return Math.abs(lamports) / LAMPORTS_PER_SOL
  }
  let signMultiplier = 1
  if (lamports.isNeg()) {
    signMultiplier = -1
  }
  const absLamports = lamports.abs()
  const lamportsString = absLamports.toString(10).padStart(10, '0')
  const splitIndex = lamportsString.length - 9
  const solString = `${lamportsString.slice(0, splitIndex)}.${lamportsString.slice(splitIndex)}`
  return signMultiplier * parseFloat(solString)
}

export function solToLamports(amount: number): number {
  if (isNaN(amount)) {
    return Number(0)
  }
  return new BN(amount.toFixed(9).replace('.', '')).toNumber()
}
