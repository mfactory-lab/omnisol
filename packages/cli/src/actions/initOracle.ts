import { web3 } from '@project-serum/anchor'
import log from 'loglevel'
import { useContext } from '../context'

interface Opts {
  oracleAuthority: string
}

export async function initOracle(opts: Opts) {
  const { provider, client } = useContext()

  const { tx, oracle } = await client.initOracle({
    oracleAuthority: new web3.PublicKey(opts.oracleAuthority),
  })

  try {
    const signature = await provider.sendAndConfirm(tx)
    log.info(`Signature: ${signature}`)
    log.info(`Oracle: ${oracle}`)
    log.info('OK')
  } catch (e) {
    log.info('Error')
    console.log(e)
  }
}
