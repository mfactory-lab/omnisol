import { BN, web3 } from '@project-serum/anchor'
import log from 'loglevel'
import { useContext } from '../context'

interface Opts {
  feeReceiver?: string
  fee?: number
}

export async function setLiquidationFee(opts: Opts) {
  const { provider, client } = useContext()

  let feeReceiver
  if (opts.feeReceiver !== undefined) {
    feeReceiver = new web3.PublicKey(opts.feeReceiver)
  } else {
    feeReceiver = undefined
  }

  const { tx } = await client.setLiquidationFee({
    fee: opts.fee,
    feeReceiver,
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
