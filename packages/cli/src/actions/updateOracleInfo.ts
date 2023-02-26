import { BN, web3 } from '@project-serum/anchor'
import log from 'loglevel'
import { useContext } from '../context'

interface Opts {
  oracle: string
  addresses: string
  values: string
}

export async function updateOracleInfo(opts: Opts) {
  const { provider, client } = useContext()

  const addresses = new Set<string>(opts.addresses.split(','))
  const values = new Set<string>(opts.values.split(','))

  const { tx } = await client.updateOracleInfo({
    addresses: [...addresses].map(a => new web3.PublicKey(a)),
    oracle: new web3.PublicKey(opts.oracle),
    values: [...values].map(v => new BN(v)),
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
