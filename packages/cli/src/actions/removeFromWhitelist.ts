import { web3 } from '@project-serum/anchor'
import log from 'loglevel'
import { useContext } from '../context'

interface Opts {
  token: string
}

export async function removeFromWhitelist(opts: Opts) {
  const { provider, client } = useContext()

  const { tx } = await client.removeFromWhitelist({
    token: new web3.PublicKey(opts.token),
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
