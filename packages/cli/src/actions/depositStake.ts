import {BN, web3} from '@project-serum/anchor'
import log from 'loglevel'
import { useContext } from '../context'

interface Opts {
  pool: string
  sourceStake: string
}

export async function depositStake(opts: Opts) {
  const { provider, client } = useContext()

  const { transaction, collateral, user } = await client.depositStake({
    pool: new web3.PublicKey(opts.pool),
    sourceStake: new web3.PublicKey(opts.sourceStake),
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
