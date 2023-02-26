import { web3 } from '@project-serum/anchor'
import log from 'loglevel'
import { useContext } from '../context'

interface Opts {
  oracle: string
}

export async function closeOracle(opts: Opts) {
  const { provider, client } = useContext()

  const { tx } = await client.closeOracle({
    oracle: new web3.PublicKey(opts.oracle),
  })

  try {
    const signature = await provider.sendAndConfirm(tx)
    log.info(`Signature: ${signature}`)
    log.info('OK')
  } catch (e) {
    log.info('Error')
    console.log(e)
  }
}
