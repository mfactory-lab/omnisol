import { BN, web3 } from '@project-serum/anchor'
import { getOrCreateAssociatedTokenAccount } from '@solana/spl-token'
import log from 'loglevel'
import { useContext } from '../context'

interface Opts {
  amount: string
  pool: string
  mint: string
}

export async function burnOmnisol(opts: Opts) {
  const { provider, client, keypair } = useContext()

  const poolMint = new web3.PublicKey(opts.mint)

  const sourceTokenAccount = await getOrCreateAssociatedTokenAccount(provider.connection, keypair, poolMint, provider.wallet.publicKey)

  const { tx, withdrawInfo } = await client.burnOmnisol({
    amount: new BN(opts.amount),
    pool: new web3.PublicKey(opts.pool),
    poolMint,
    sourceTokenAccount: sourceTokenAccount.address,
  })

  try {
    const signature = await provider.sendAndConfirm(tx)
    log.info(`Created withdraw request: ${withdrawInfo.toBase58()}`)
    log.info(`Signature: ${signature}`)
    log.info('OK')
  } catch (e) {
    log.info('Error')
    console.log(e)
  }
}
