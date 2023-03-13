import { BN, web3 } from '@project-serum/anchor'
import log from 'loglevel'
import { useContext } from '../context'

interface Opts {
  pool: string
  sourceStake: string
  amount: string
  withSplit: string
}

export async function depositStake(opts: Opts) {
  const { provider, client } = useContext()

  const splitKeypair = web3.Keypair.generate()
  const splitAccount = splitKeypair.publicKey

  const withSplit = opts.withSplit.includes('true')
  const sourceStake = new web3.PublicKey(opts.sourceStake)

  let delegatedStake
  if (withSplit) {
    delegatedStake = splitAccount
  } else {
    delegatedStake = sourceStake
  }

  const { transaction, collateral, user } = await client.depositStake({
    amount: new BN(opts.amount),
    delegatedStake,
    splitStake: splitAccount,
    pool: new web3.PublicKey(opts.pool),
    sourceStake,
  })

  try {
    const signature = await provider.sendAndConfirm(transaction, [splitKeypair])
    log.info(`Collateral Address: ${collateral.toBase58()}`)
    log.info(`Delegated Stake Account Address: ${delegatedStake.toBase58()}`)
    log.info(`User Address: ${user.toBase58()}`)
    log.info(`Signature: ${signature}`)
    log.info('OK')
  } catch (e) {
    log.info('Error')
    console.log(e)
  }
}
