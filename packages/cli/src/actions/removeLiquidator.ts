import { web3 } from '@project-serum/anchor'
import log from 'loglevel'
import { useContext } from '../context'

interface Opts {
  liquidator: string
}

export async function removeLiquidator(opts: Opts) {
  const { provider, client } = useContext()

  const { tx } = await client.removeLiquidator({
    liquidator_wallet: new web3.PublicKey(opts.liquidator),
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
