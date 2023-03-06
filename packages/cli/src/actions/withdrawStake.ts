import { BN, web3 } from '@project-serum/anchor'
import { getOrCreateAssociatedTokenAccount } from '@solana/spl-token'
import log from 'loglevel'
import { useContext } from '../context'

interface Opts {
  amount: string
  pool: string
  mint: string
  stakeAccount: string
  withBurn: string
}

export async function withdrawStake(opts: Opts) {
  const { provider, client, keypair } = useContext()

  const splitKeypair = web3.Keypair.generate()
  const splitAccount = splitKeypair.publicKey

  const poolMint = new web3.PublicKey(opts.mint)

  const userPoolToken = await getOrCreateAssociatedTokenAccount(provider.connection, keypair, poolMint, provider.wallet.publicKey)

  const { transaction, user, collateral } = await client.withdrawStake({
    amount: new BN(opts.amount),
    pool: new web3.PublicKey(opts.pool),
    poolMint,
    splitStake: new web3.PublicKey(splitAccount),
    stakeAccount: new web3.PublicKey(opts.stakeAccount),
    stakeProgram: web3.StakeProgram.programId,
    userPoolToken: userPoolToken.address,
    withBurn: opts.withBurn.includes('true'),
  })

  try {
    const signature = await provider.sendAndConfirm(transaction, [splitKeypair])
    log.info(`Collateral Address: ${collateral.toBase58()}`)
    log.info(`User Address: ${user.toBase58()}`)
    log.info(`Signature: ${signature}`)
    log.info('OK')
  } catch (e) {
    log.info('Error')
    console.log(e)
  }
}
