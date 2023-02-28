import { BN, web3 } from '@project-serum/anchor'
import log from 'loglevel'
import { useContext } from '../context'

interface Opts {
  pool: string
  amount: string
  destination: string
  token: string
  source: string
}

export async function depositLp(opts: Opts) {
  const { provider, client } = useContext()

  const { tx, collateral, user } = await client.depositLPToken({
    pool: new web3.PublicKey(opts.pool),
    amount: new BN(opts.amount),
    destination: new web3.PublicKey(opts.destination),
    lpToken: new web3.PublicKey(opts.token),
    source: new web3.PublicKey(opts.source),
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
