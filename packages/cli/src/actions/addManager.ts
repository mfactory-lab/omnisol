import { web3 } from '@project-serum/anchor'
import log from 'loglevel'
import { useContext } from '../context'

interface Opts {
  manager: string
}

export async function addManager(opts: Opts) {
  const { provider, client } = useContext()

  const { tx, manager } = await client.addManager({
    managerWallet: new web3.PublicKey(opts.manager),
  })

  try {
    const signature = await provider.sendAndConfirm(tx)
    log.info(`Signature: ${signature}`)
    log.info(`Manager PDA: ${manager}`)
    log.info('OK')
  } catch (e) {
    log.info('Error')
    console.log(e)
  }
}
