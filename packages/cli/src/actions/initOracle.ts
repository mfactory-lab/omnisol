import { web3 } from '@project-serum/anchor'
import log from 'loglevel'
import { useContext } from '../context'

interface Opts {
  oracleAuthority: string
}

export async function initOracle(opts: Opts) {
  const { provider, client } = useContext()

  const oracleKeypair = web3.Keypair.generate()
  const oracle = oracleKeypair.publicKey

  const { tx } = await client.initOracle({
    oracle,
    oracleAuthority: new web3.PublicKey(opts.oracleAuthority),
  })

  try {
    const signature = await provider.sendAndConfirm(tx, [oracleKeypair])
    log.info(`Signature: ${signature}`)
    log.info(`Oracle: ${oracle}`)
    log.info('OK')
  } catch (e) {
    log.info('Error')
    console.log(e)
  }
}
