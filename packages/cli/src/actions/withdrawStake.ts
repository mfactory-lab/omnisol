import { BN, web3 } from '@project-serum/anchor'
import log from 'loglevel'
import { useContext } from '../context'

interface Opts {
  amount: string
  pool: string
  poolMint: string
  stakeAccount: string
  userPoolToken: string
  stakeProgram?: string
}

export async function withdrawStake(opts: Opts) {
  const { provider, client } = useContext()

  const splitKeypair = web3.Keypair.generate()
  const splitAccount = splitKeypair.publicKey

  let stakeProgram
  if (opts.stakeProgram !== undefined) {
    stakeProgram = new web3.PublicKey(opts.stakeProgram)
  }

  const { transaction, user, collateral } = await client.withdrawStake({
    amount: new BN(opts.amount),
    pool: new web3.PublicKey(opts.pool),
    poolMint: new web3.PublicKey(opts.poolMint),
    splitStake: new web3.PublicKey(splitAccount),
    stakeAccount: new web3.PublicKey(opts.stakeAccount),
    stakeProgram,
    userPoolToken: new web3.PublicKey(opts.userPoolToken),
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
