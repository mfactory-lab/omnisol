import { BN, web3 } from '@project-serum/anchor'
import log from 'loglevel'
import { useContext } from '../context'

interface Opts {
  amount: string
  pool: string
  poolMint: string
  stakedAddress: string
  userPoolToken: string
}

export async function mintOmnisol(opts: Opts) {
  const { provider, client } = useContext()

  const { transaction, collateral, user } = await client.mintOmnisol({
    amount: new BN(opts.amount),
    pool: new web3.PublicKey(opts.pool),
    poolMint: new web3.PublicKey(opts.poolMint),
    stakedAddress: new web3.PublicKey(opts.stakedAddress),
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
