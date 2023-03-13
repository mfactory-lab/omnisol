import { BN, web3 } from '@project-serum/anchor'
import { getOrCreateAssociatedTokenAccount } from '@solana/spl-token'
import log from 'loglevel'
import { useContext } from '../context'

interface Opts {
  amount: string
  pool: string
  mint: string
  token: string
  withBurn: string
}

export async function withdrawLpTokens(opts: Opts) {
  const { provider, client, keypair } = useContext()

  const pool = new web3.PublicKey(opts.pool)
  const lpToken = new web3.PublicKey(opts.token)
  const poolMint = new web3.PublicKey(opts.mint)
  const [poolAuthority] = await client.pda.poolAuthority(new web3.PublicKey(opts.pool))

  const destination = await getOrCreateAssociatedTokenAccount(provider.connection, keypair, lpToken, provider.wallet.publicKey)
  const source = await getOrCreateAssociatedTokenAccount(provider.connection, keypair, lpToken, poolAuthority, true)
  const userPoolToken = await getOrCreateAssociatedTokenAccount(provider.connection, keypair, poolMint, provider.wallet.publicKey)

  const { transaction, user, collateral } = await client.withdrawLPTokens({
    amount: new BN(opts.amount),
    destination: destination.address,
    lpToken,
    pool,
    poolMint,
    source: source.address,
    userPoolToken: userPoolToken.address,
    withBurn: opts.withBurn.includes('true'),
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
