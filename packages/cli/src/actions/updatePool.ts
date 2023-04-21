import { BN, web3 } from '@project-serum/anchor'
import log from 'loglevel'
import { useContext } from '../context'

interface Opts {
  pool: string
  feeReceiver?: string
  withdrawFee?: number
  depositFee?: number
  mintFee?: number
  storageFee?: number
  minDeposit?: string
}

export async function updatePool(opts: Opts) {
  const { provider, client } = useContext()

  const pool = new web3.PublicKey(opts.pool)
  let feeReceiver
  if (opts.feeReceiver !== undefined) {
    feeReceiver = new web3.PublicKey(opts.feeReceiver)
  } else {
    feeReceiver = undefined
  }
  let minDeposit
  if (opts.minDeposit !== undefined) {
    minDeposit = new BN(opts.minDeposit)
  } else {
    minDeposit = undefined
  }

  const { tx } = await client.updatePool({
    pool,
    feeReceiver,
    withdrawFee: opts.withdrawFee ?? undefined,
    depositFee: opts.depositFee ?? undefined,
    mintFee: opts.mintFee ?? undefined,
    storageFee: opts.storageFee ?? undefined,
    minDeposit,
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
