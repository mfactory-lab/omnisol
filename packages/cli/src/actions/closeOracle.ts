import log from 'loglevel'
import { useContext } from '../context'

export async function closeOracle() {
  const { provider, client } = useContext()

  const { tx } = await client.closeOracle()

  try {
    const signature = await provider.sendAndConfirm(tx)
    log.info(`Signature: ${signature}`)
    log.info('OK')
  } catch (e) {
    log.info('Error')
    console.log(e)
  }
}
