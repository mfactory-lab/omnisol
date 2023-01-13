import {
  TOKEN_PROGRAM_ID,
  createMint,
  getOrCreateAssociatedTokenAccount, mintTo,
} from '@solana/spl-token'
import { AnchorProvider, BN, Program, Wallet, web3 } from '@project-serum/anchor'
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
  let poolMint: web3.PublicKey
  let lpToken: web3.PublicKey
  let stakeAccount: web3.PublicKey

  before(async () => {
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(client.wallet.publicKey, 10 * web3.LAMPORTS_PER_SOL),
    )
  })

  it('can create global pool', async () => {
    const poolKeypair = web3.Keypair.generate()
    pool = poolKeypair.publicKey
    const [poolAuthority, bump] = await client.pda.poolAuthority(pool)
    poolMint = await createMint(provider.connection, payerKeypair, poolAuthority, null, 1, web3.Keypair.generate(), null, TOKEN_PROGRAM_ID)
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
    assert.equal(poolData.isActive, true)
  })

  it('can add manager', async () => {
    const { tx, manager } = await client.addManager({
      pool,
      manager_wallet: provider.wallet.publicKey,
    })

    try {
      await provider.sendAndConfirm(tx)
    } catch (e) {
      console.log(e)
      throw e
    }

    const managerData = await client.fetchManager(manager)
    assert.equal(managerData.manager.equals(provider.wallet.publicKey), true)
  })

  it('can remove manager', async () => {
    const { tx } = await client.removeManager({
      pool,
      manager_wallet: provider.wallet.publicKey,
    })

    try {
      await provider.sendAndConfirm(tx)
    } catch (e) {
      console.log(e)
      throw e
    }

    const { tx: tx1 } = await client.addManager({
      pool,
      manager_wallet: provider.wallet.publicKey,
    })

    try {
      await provider.sendAndConfirm(tx1)
    } catch (e) {
      console.log(e)
      throw e
    }
  })

  it('can pause pool', async () => {
    const { tx } = await client.pauseGlobalPool({
      pool,
    })

    try {
      await provider.sendAndConfirm(tx)
    } catch (e) {
      console.log(e)
      throw e
    }

    const poolData = await client.fetchGlobalPool(pool)
    assert.equal(poolData.isActive, false)
  })

  it('can resume pool', async () => {
    const { tx } = await client.resumeGlobalPool({
      pool,
    })

    try {
      await provider.sendAndConfirm(tx)
    } catch (e) {
      console.log(e)
      throw e
    }

    const poolData = await client.fetchGlobalPool(pool)
    assert.equal(poolData.isActive, true)
  })

  it('can add to whitelist', async () => {
    const { tx, whitelist } = await client.addToWhitelist({
      pool,
      token: poolMint,
    })

    try {
      await provider.sendAndConfirm(tx)
    } catch (e) {
      console.log(e)
      throw e
    }

    const whitelistData = await client.fetchWhitelist(whitelist)
    assert.equal(whitelistData.whitelistedToken.equals(poolMint), true)
  })

  it('can remove from whitelist', async () => {
    const { tx } = await client.removeFromWhitelist({
      pool,
      token: poolMint,
    })

    try {
      await provider.sendAndConfirm(tx)
    } catch (e) {
      console.log(e)
      throw e
    }
  })

  it('can deposit lp tokens', async () => {
    lpToken = await createMint(provider.connection, payerKeypair, provider.wallet.publicKey, null, 1, web3.Keypair.generate(), null, TOKEN_PROGRAM_ID)
    const source = await getOrCreateAssociatedTokenAccount(provider.connection, payerKeypair, lpToken, provider.wallet.publicKey)
    await mintTo(provider.connection, payerKeypair, lpToken, source.address, provider.wallet.publicKey, 100, [], null, TOKEN_PROGRAM_ID)
    const { tx: transaction } = await client.addToWhitelist({
      pool,
      token: lpToken,
    })
    try {
      await provider.sendAndConfirm(transaction)
    } catch (e) {
      console.log(e)
      throw e
    }
    const destination = await getOrCreateAssociatedTokenAccount(provider.connection, payerKeypair, lpToken, pool)
    const { tx, user, collateral, bump } = await client.depositLPToken({
      amount: new BN(100),
      destination: destination.address,
      lpToken,
      source: source.address,
      pool,
    })

    try {
      await provider.sendAndConfirm(tx)
    } catch (e) {
      console.log(e)
      throw e
    }

    const poolData = await client.fetchGlobalPool(pool)
    const userData = await client.fetchUser(user)
    const collateralData = await client.fetchCollateral(collateral)

    assert.equal(poolData.depositAmount, 100)
    assert.equal(userData.wallet.equals(provider.wallet.publicKey), true)
    assert.equal(userData.rate, 100)
    assert.equal(userData.isBlocked, false)
    assert.equal(collateralData.user.equals(user), true)
    assert.equal(collateralData.pool.equals(pool), true)
    assert.equal(collateralData.bump, bump)
    assert.equal(collateralData.amount, 0)
    assert.equal(collateralData.delegationStake, 100)
    assert.equal(collateralData.isNative, false)
    assert.equal(collateralData.sourceStake.equals(lpToken), true)
  })

  it('can deposit lp tokens twice', async () => {
    const source = await getOrCreateAssociatedTokenAccount(provider.connection, payerKeypair, lpToken, provider.wallet.publicKey)
    await mintTo(provider.connection, payerKeypair, lpToken, source.address, provider.wallet.publicKey, 100, [], null, TOKEN_PROGRAM_ID)
    const destination = await getOrCreateAssociatedTokenAccount(provider.connection, payerKeypair, lpToken, pool)
    const { tx, user, collateral, bump } = await client.depositLPToken({
      amount: new BN(100),
      destination: destination.address,
      lpToken,
      source: source.address,
      pool,
    })

    try {
      await provider.sendAndConfirm(tx)
    } catch (e) {
      console.log(e)
      throw e
    }

    const poolData = await client.fetchGlobalPool(pool)
    const userData = await client.fetchUser(user)
    const collateralData = await client.fetchCollateral(collateral)

    assert.equal(poolData.depositAmount, 200)
    assert.equal(userData.wallet.equals(provider.wallet.publicKey), true)
    assert.equal(userData.rate, 200)
    assert.equal(userData.isBlocked, false)
    assert.equal(collateralData.user.equals(user), true)
    assert.equal(collateralData.pool.equals(pool), true)
    assert.equal(collateralData.bump, bump)
    assert.equal(collateralData.amount, 0)
    assert.equal(collateralData.delegationStake, 200)
    assert.equal(collateralData.isNative, false)
    assert.equal(collateralData.sourceStake.equals(lpToken), true)
  })

  it('can not deposit non-whitelisted tokens', async () => {
    const someToken = await createMint(provider.connection, payerKeypair, provider.wallet.publicKey, null, 1, web3.Keypair.generate(), null, TOKEN_PROGRAM_ID)
    const source = await getOrCreateAssociatedTokenAccount(provider.connection, payerKeypair, someToken, provider.wallet.publicKey)
    await mintTo(provider.connection, payerKeypair, someToken, source.address, provider.wallet.publicKey, 100, [], null, TOKEN_PROGRAM_ID)
    const destination = await getOrCreateAssociatedTokenAccount(provider.connection, payerKeypair, someToken, pool)
    const { tx } = await client.depositLPToken({
      amount: new BN(100),
      destination: destination.address,
      lpToken: someToken,
      source: source.address,
      pool,
    })

    try {
      await provider.sendAndConfirm(tx)
      assert.ok(false)
    } catch (e: any) {
      assertErrorCode(e, '')
    }
  })

  it('can block user', async () => {
    const { tx, user } = await client.blockUser({
      pool,
      user_wallet: provider.wallet.publicKey,
    })

    try {
      await provider.sendAndConfirm(tx)
    } catch (e) {
      console.log(e)
      throw e
    }

    const userData = await client.fetchUser(user)
    assert.equal(userData.isBlocked, true)
  })

  it('can not deposit if user blocked', async () => {
    const source = await getOrCreateAssociatedTokenAccount(provider.connection, payerKeypair, lpToken, provider.wallet.publicKey)
    await mintTo(provider.connection, payerKeypair, lpToken, source.address, provider.wallet.publicKey, 100, [], null, TOKEN_PROGRAM_ID)
    const destination = await getOrCreateAssociatedTokenAccount(provider.connection, payerKeypair, lpToken, pool)
    const { tx } = await client.depositLPToken({
      amount: new BN(100),
      destination: destination.address,
      lpToken,
      source: source.address,
      pool,
    })

    try {
      await provider.sendAndConfirm(tx)
      assert.ok(false)
    } catch (e: any) {
      assertErrorCode(e, 'UserBlocked')
    }
  })

  it('can unblock user', async () => {
    const { tx, user } = await client.unblockUser({
      pool,
      user_wallet: provider.wallet.publicKey,
    })

    try {
      await provider.sendAndConfirm(tx)
    } catch (e) {
      console.log(e)
      throw e
    }

    const userData = await client.fetchUser(user)
    assert.equal(userData.isBlocked, false)
  })

  it('can not deposit if amount is 0', async () => {
    const source = await getOrCreateAssociatedTokenAccount(provider.connection, payerKeypair, lpToken, provider.wallet.publicKey)
    const destination = await getOrCreateAssociatedTokenAccount(provider.connection, payerKeypair, lpToken, pool)
    const { tx } = await client.depositLPToken({
      amount: new BN(0),
      destination: destination.address,
      lpToken,
      source: source.address,
      pool,
    })

    try {
      await provider.sendAndConfirm(tx)
      assert.ok(false)
    } catch (e: any) {
      assertErrorCode(e, 'InsufficientAmount')
    }
  })

  it('can not deposit if pool paused', async () => {
    const source = await getOrCreateAssociatedTokenAccount(provider.connection, payerKeypair, lpToken, provider.wallet.publicKey)
    await mintTo(provider.connection, payerKeypair, lpToken, source.address, provider.wallet.publicKey, 100, [], null, TOKEN_PROGRAM_ID)
    const destination = await getOrCreateAssociatedTokenAccount(provider.connection, payerKeypair, lpToken, pool)
    const { tx } = await client.depositLPToken({
      amount: new BN(100),
      destination: destination.address,
      lpToken,
      source: source.address,
      pool,
    })

    const { tx: tx1 } = await client.pauseGlobalPool({
      pool,
    })

    try {
      await provider.sendAndConfirm(tx1)
    } catch (e) {
      console.log(e)
      throw e
    }

    try {
      await provider.sendAndConfirm(tx)
      assert.ok(false)
    } catch (e: any) {
      assertErrorCode(e, 'PoolAlreadyPaused')
    }

    const { tx: tx2 } = await client.resumeGlobalPool({
      pool,
    })

    try {
      await provider.sendAndConfirm(tx2)
    } catch (e) {
      console.log(e)
      throw e
    }
  })

  it('can deposit stake', async () => {
    const stakeKeypair = web3.Keypair.generate()
    stakeAccount = stakeKeypair.publicKey
    const lamportsForStakeAccount
      = (await provider.connection.getMinimumBalanceForRentExemption(
        web3.StakeProgram.space,
      )) + 50

    const createAccountTransaction = web3.StakeProgram.createAccount({
      fromPubkey: provider.wallet.publicKey,
      authorized: new web3.Authorized(
        provider.wallet.publicKey,
        provider.wallet.publicKey,
      ),
      lamports: lamportsForStakeAccount,
      lockup: new web3.Lockup(0, 0, provider.wallet.publicKey),
      stakePubkey: stakeAccount,
    })
    await provider.sendAndConfirm(createAccountTransaction, [payerKeypair, stakeKeypair])

    // const delegateTransaction = web3.StakeProgram.delegate({
    //   stakePubkey: stakeAccount,
    //   authorizedPubkey: provider.wallet.publicKey,
    //   votePubkey: pool,
    // })
    //
    // await provider.sendAndConfirm(delegateTransaction, [payerKeypair, payerKeypair])

    const { transaction, user, collateral, bump } = await client.depositStake({
      amount: new BN(0),
      sourceStake: stakeAccount,
      pool,
    })

    try {
      await provider.sendAndConfirm(transaction)
    } catch (e) {
      console.log(e)
      throw e
    }

    const poolData = await client.fetchGlobalPool(pool)
    const userData = await client.fetchUser(user)
    const collateralData = await client.fetchCollateral(collateral)

    assert.equal(poolData.depositAmount, 300)
    assert.equal(userData.wallet.equals(provider.wallet.publicKey), true)
    assert.equal(userData.rate, 100)
    assert.equal(userData.isBlocked, false)
    assert.equal(collateralData.user.equals(user), true)
    assert.equal(collateralData.pool.equals(pool), true)
    assert.equal(collateralData.bump, bump)
    assert.equal(collateralData.amount, 0)
    assert.equal(collateralData.delegationStake, 100)
    assert.equal(collateralData.isNative, false)
    assert.equal(collateralData.sourceStake.equals(lpToken), true)
  })

  it('can not deposit stake if it is not delegated', async () => {

  })

  it('can not deposit stake if delegated amount = 0', async () => {

  })

  it('can not deposit stake if pool paused', async () => {

  })

  it('can not deposit stake if user blocked', async () => {

  })

  it('can mint pool tokens from stake collateral', async () => {

  })

  it('can mint pool tokens from lp collateral', async () => {
    const userPoolToken = await getOrCreateAssociatedTokenAccount(provider.connection, payerKeypair, poolMint, provider.wallet.publicKey)
    const { transaction, user, collateral } = await client.mintPoolTokens({
      amount: new BN(100),
      pool,
      poolMint,
      stakedAddress: lpToken,
      userPoolToken: userPoolToken.address,
    })

    try {
      await provider.sendAndConfirm(transaction)
    } catch (e) {
      console.log(e)
      throw e
    }

    const poolData = await client.fetchGlobalPool(pool)
    const userData = await client.fetchUser(user)
    const collateralData = await client.fetchCollateral(collateral)

    assert.equal(poolData.depositAmount, 200)
    assert.equal(userData.rate, 100)
    assert.equal(collateralData.amount, 100)
    assert.equal(collateralData.delegationStake, 200)
  })

  it('can not mint greater than was delegated', async () => {
    const userPoolToken = await getOrCreateAssociatedTokenAccount(provider.connection, payerKeypair, poolMint, provider.wallet.publicKey)
    const { transaction, user, collateral } = await client.mintPoolTokens({
      amount: new BN(101),
      pool,
      poolMint,
      stakedAddress: lpToken,
      userPoolToken: userPoolToken.address,
    })

    try {
      await provider.sendAndConfirm(transaction)
      assert.ok(false)
    } catch (e: any) {
      const poolData = await client.fetchGlobalPool(pool)
      const userData = await client.fetchUser(user)
      const collateralData = await client.fetchCollateral(collateral)

      assert.equal(poolData.depositAmount, 200)
      assert.equal(userData.rate, 100)
      assert.equal(collateralData.amount, 100)
      assert.equal(collateralData.delegationStake, 200)
      assertErrorCode(e, 'InsufficientAmount')
    }
  })

  it('can not mint when pool paused', async () => {
    const userPoolToken = await getOrCreateAssociatedTokenAccount(provider.connection, payerKeypair, poolMint, provider.wallet.publicKey)
    const { transaction } = await client.mintPoolTokens({
      amount: new BN(100),
      pool,
      poolMint,
      stakedAddress: lpToken,
      userPoolToken: userPoolToken.address,
    })

    const { tx: tx1 } = await client.pauseGlobalPool({
      pool,
    })

    try {
      await provider.sendAndConfirm(tx1)
    } catch (e) {
      console.log(e)
      throw e
    }

    try {
      await provider.sendAndConfirm(transaction)
      assert.ok(false)
    } catch (e: any) {
      assertErrorCode(e, 'PoolAlreadyPaused')
    }

    const { tx: tx2 } = await client.resumeGlobalPool({
      pool,
    })

    try {
      await provider.sendAndConfirm(tx2)
    } catch (e) {
      console.log(e)
      throw e
    }
  })

  it('can not mint when user blocked', async () => {
    const userPoolToken = await getOrCreateAssociatedTokenAccount(provider.connection, payerKeypair, poolMint, provider.wallet.publicKey)
    const { transaction } = await client.mintPoolTokens({
      amount: new BN(100),
      pool,
      poolMint,
      stakedAddress: lpToken,
      userPoolToken: userPoolToken.address,
    })

    const { tx } = await client.blockUser({
      pool,
      user_wallet: provider.wallet.publicKey,
    })

    try {
      await provider.sendAndConfirm(tx)
    } catch (e) {
      console.log(e)
      throw e
    }

    try {
      await provider.sendAndConfirm(transaction)
      assert.ok(false)
    } catch (e: any) {
      assertErrorCode(e, 'UserBlocked')
    }

    const { tx: tx1 } = await client.unblockUser({
      pool,
      user_wallet: provider.wallet.publicKey,
    })

    try {
      await provider.sendAndConfirm(tx1)
    } catch (e) {
      console.log(e)
      throw e
    }
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

export function assertErrorCode(error: { logs?: string[] }, code: string) {
  assert.ok(String((error?.logs ?? []).join('')).includes(`Error Code: ${code}`))
}
