import { BN, web3 } from '@project-serum/anchor'
import { getOrCreateAssociatedTokenAccount } from '@solana/spl-token'
import log from 'loglevel'
import { useContext } from '../context'

interface Opts {
  amount: string
  pool: string
  mint: string
  stakedAddress: string
}

export async function mintOmnisol(opts: Opts) {
  const { provider, client, keypair } = useContext()

  const poolMint = new web3.PublicKey(opts.mint)

  const userPoolToken = await getOrCreateAssociatedTokenAccount(provider.connection, keypair, poolMint, provider.wallet.publicKey)

  const { transaction, collateral, user } = await client.mintOmnisol({
    amount: new BN(opts.amount),
    pool: new web3.PublicKey(opts.pool),
    poolMint,
    stakedAddress: new web3.PublicKey(opts.stakedAddress),
    userPoolToken: userPoolToken.address,
  })

  try {
    const signature = await provider.sendAndConfirm(transaction)
    log.info(`Collateral Address: ${collateral.toBase58()}`)
    log.info(`User Address: ${user.toBase58()}`)
    log.info(`Signature: ${signature}`)
    log.info('OK')
  } catch (e) {
    log.info('Error')
    console.log(e)
  }
}
