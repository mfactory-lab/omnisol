import { web3 } from '@project-serum/anchor'
import log from 'loglevel'
import { useContext } from '../context'

interface Opts {
  mint: string
  oracle: string
  stakeSource: string
}

export async function createPool(opts: Opts) {
  const { provider, client } = useContext()

  const poolKeypair = web3.Keypair.generate()
  const pool = poolKeypair.publicKey

  const { tx } = await client.createPool({
    mint: new web3.PublicKey(opts.mint),
    oracle: new web3.PublicKey(opts.oracle),
    pool,
    stakeSource: new web3.PublicKey(opts.stakeSource),
  })

  const [poolAuthority] = await client.pda.poolAuthority(pool)

  try {
    const signature = await provider.sendAndConfirm(tx, [poolKeypair])
    log.info(`Pool Address: ${pool.toBase58()}`)
    log.info(`Pool authority: ${poolAuthority.toBase58()}`)
    log.info(`Signature: ${signature}`)
    log.info('OK')
  } catch (e) {
    log.info('Error')
    console.log(e)
  }
}
