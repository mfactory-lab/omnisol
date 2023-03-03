import { BN, web3 } from '@project-serum/anchor'
import { getOrCreateAssociatedTokenAccount } from '@solana/spl-token'
import log from 'loglevel'
import { useContext } from '../context'

interface Opts {
  pool: string
  amount: string
  token: string
}

export async function depositLp(opts: Opts) {
  const { provider, client, keypair } = useContext()

  const pool = new web3.PublicKey(opts.pool)
  const lpToken = new web3.PublicKey(opts.token)
  const [poolAuthority] = await client.pda.poolAuthority(new web3.PublicKey(opts.pool))

  const source = await getOrCreateAssociatedTokenAccount(provider.connection, keypair, lpToken, provider.wallet.publicKey)
  const destination = await getOrCreateAssociatedTokenAccount(provider.connection, keypair, lpToken, poolAuthority, true)

  const { tx, collateral, user } = await client.depositLPToken({
    pool,
    amount: new BN(opts.amount),
    destination: destination.address,
    lpToken,
    source: source.address,
  })

  try {
    const signature = await provider.sendAndConfirm(tx)
    log.info(`Collateral Address: ${collateral.toBase58()}`)
    log.info(`User Address: ${user.toBase58()}`)
    log.info(`Signature: ${signature}`)
    log.info('OK')
  } catch (e) {
    log.info('Error')
    console.log(e)
  }
}
