import { BN, web3 } from '@project-serum/anchor'
import log from 'loglevel'
import { useContext } from '../context'

interface Opts {
  amount: string
  pool: string
  poolMint: string
  sourceTokenAccount: string
}

export async function burnOmnisol(opts: Opts) {
  const { provider, client } = useContext()

  const { tx, withdrawInfo } = await client.burnOmnisol({
    amount: new BN(opts.amount),
    pool: new web3.PublicKey(opts.pool),
    poolMint: new web3.PublicKey(opts.poolMint),
    sourceTokenAccount: new web3.PublicKey(opts.sourceTokenAccount),
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
