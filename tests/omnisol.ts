import { TOKEN_PROGRAM_ID, createMint } from '@solana/spl-token'
import { AnchorProvider, Program, Wallet, web3 } from '@project-serum/anchor'
import { assert } from 'chai'
import { OmnisolClient } from '../packages/sdk'

const payerKeypair = web3.Keypair.generate()
const opts = AnchorProvider.defaultOptions()
const provider = new AnchorProvider(
  new web3.Connection('http://localhost:8899', opts.preflightCommitment),
  new Wallet(payerKeypair),
  AnchorProvider.defaultOptions(),
)

describe('omnisol', () => {
  const client = new OmnisolClient({
    program: new Program(OmnisolClient.IDL, OmnisolClient.programId, provider),
    wallet: provider.wallet,
  })

  let pool: web3.PublicKey

  before(async () => {
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(client.wallet.publicKey, 10 * web3.LAMPORTS_PER_SOL),
    )
  })

  it('can create global pool', async () => {
    const poolKeypair = web3.Keypair.generate()
    pool = poolKeypair.publicKey
    const [poolAuthority, bump] = await client.pda.poolAuthority(pool)
    const poolMint = await createMint(provider.connection, payerKeypair, poolAuthority, null, 1, web3.Keypair.generate(), null, TOKEN_PROGRAM_ID)
    const { tx } = await client.createGlobalPool({
      pool,
      mint: poolMint,
    })

    try {
      await provider.sendAndConfirm(tx, [
        poolKeypair,
      ])
    } catch (e) {
      console.log(e)
      throw e
    }

    const poolData = await client.fetchGlobalPool(pool)
    if (!poolData) {
      throw new Error('Invalid pool')
    }

    assert.equal(poolData.poolMint.equals(poolMint), true)
    assert.equal(poolData.depositAmount, 0)
    assert.equal(poolData.authorityBump, bump)
    assert.equal(poolData.authority.equals(provider.wallet.publicKey), true)
  })

  it('can close global pool', async () => {
    const { tx } = await client.closeGlobalPool({
      pool,
    })

    try {
      await provider.sendAndConfirm(tx)
    } catch (e) {
      console.log(e)
      throw e
    }

    const poolData = await client.fetchGlobalPool(pool)
    if (poolData) {
      throw new Error('Pool is not closed')
    }
  })
})

// export function assertErrorCode(error: { logs?: string[] }, code: string) {
//   assert.ok(String((error?.logs ?? []).join('')).includes(`Error Code: ${code}`))
// }
