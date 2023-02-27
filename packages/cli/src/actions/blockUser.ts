import { web3 } from '@project-serum/anchor'
import log from 'loglevel'
import { useContext } from '../context'

interface Opts {
  user: string
}

export async function blockUser(opts: Opts) {
  const { provider, client } = useContext()

  const { tx, user } = await client.blockUser({
    userWallet: new web3.PublicKey(opts.user),
  })

  try {
    const signature = await provider.sendAndConfirm(tx)
    log.info(`User pda of blocked wallet: ${user.toBase58()}`)
    log.info(`Signature: ${signature}`)
    log.info('OK')
  } catch (e) {
    log.info('Error')
    console.log(e)
  }
}
