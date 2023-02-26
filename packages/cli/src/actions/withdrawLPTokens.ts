import {BN, web3} from '@project-serum/anchor'
import log from 'loglevel'
import { useContext } from '../context'

interface Opts {
  amount: string
  pool: string
  poolMint: string
  userPoolToken: string
  lpToken: string
  source: string
  destination: string
}

export async function withdrawLpTokens(opts: Opts) {
  const { provider, client } = useContext()

  const { transaction, user, collateral } = await client.withdrawLPTokens({
    amount: new BN(opts.amount),
    destination: new web3.PublicKey(opts.destination),
    lpToken: new web3.PublicKey(opts.lpToken),
    pool: new web3.PublicKey(opts.pool),
    poolMint: new web3.PublicKey(opts.poolMint),
    source: new web3.PublicKey(opts.source),
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
