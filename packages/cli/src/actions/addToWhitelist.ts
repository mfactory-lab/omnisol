import { web3 } from '@project-serum/anchor'
import log from 'loglevel'
import { useContext } from '../context'

interface Opts {
  stakePool: string
  token: string
  tokenPool: string
}

export async function addToWhitelist(opts: Opts) {
  const { provider, client } = useContext()

  const { tx } = await client.addToWhitelist({
    stakePool: new web3.PublicKey(opts.stakePool),
    token: new web3.PublicKey(opts.token),
    tokenPool: new web3.PublicKey(opts.tokenPool),
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
