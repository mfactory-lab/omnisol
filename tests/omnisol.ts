import * as assert from 'assert'
import { AnchorProvider, Wallet, web3 } from '@project-serum/anchor'
import { OmnisolClient } from '../packages/sdk'

describe('omnisol', () => {
  const sender = web3.Keypair.generate()

  const opts = AnchorProvider.defaultOptions()
  const provider = new AnchorProvider(
    new web3.Connection('http://localhost:8899', opts),
    new Wallet(sender),
    opts,
  )

  const client = new OmnisolClient(provider)

  before(async () => {
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(
        provider.wallet.publicKey,
        web3.LAMPORTS_PER_SOL * 10,
      ),
      'confirmed',
    )
  })

  it('init', async () => {
    assert.ok(false)
  })
})
