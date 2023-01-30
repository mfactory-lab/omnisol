// @ts-expect-error "no-error"
import { TOKEN_PROGRAM_ID, createMint, getOrCreateAssociatedTokenAccount, mintTo } from '@solana/spl-token'
import { AnchorProvider, BN, Program, Wallet, web3 } from '@project-serum/anchor'
import { assert } from 'chai'
import { OmnisolClient } from '@omnisol/sdk'
import { STAKE_POOL_PROGRAM_ID, depositSol } from '@solana/spl-stake-pool'

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
  let poolAuthority: web3.PublicKey
  let stakeAccount: web3.PublicKey
  let oracle: web3.PublicKey
  let stakePool: web3.PublicKey

  before(async () => {
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(client.wallet.publicKey, 1000 * web3.LAMPORTS_PER_SOL),
    )
  })

  it('can create global pool', async () => {
    const poolKeypair = web3.Keypair.generate()
    pool = poolKeypair.publicKey
    const [authority, bump] = await client.pda.poolAuthority(pool)
    poolAuthority = authority
    poolMint = await createMint(provider.connection, payerKeypair, authority, null, 9, web3.Keypair.generate(), null, TOKEN_PROGRAM_ID)
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
      managerWallet: provider.wallet.publicKey,
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

  it('can init oracle', async () => {
    const oraclePair = web3.Keypair.generate()
    oracle = oraclePair.publicKey

    const { tx } = await client.initOracle({
      pool,
      oracleAuthority: provider.wallet.publicKey,
      oracle,
    })

    try {
      await provider.sendAndConfirm(tx, [oraclePair])
    } catch (e) {
      console.log(e)
      throw e
    }

    const oracleData = await client.fetchOracle(oracle)
    assert.equal(oracleData.authority.equals(provider.wallet.publicKey), true)
    assert.equal(oracleData.priorityQueue.toString(), [].toString())
  })

  it('can update oracle info', async () => {
    const addresses = [web3.PublicKey.unique(), web3.PublicKey.unique()]
    const values = [new BN(100), new BN(200)]
    const { tx } = await client.updateOracleInfo({
      oracle,
      addresses,
      values,
    })

    try {
      await provider.sendAndConfirm(tx)
    } catch (e) {
      console.log(e)
      throw e
    }

    const oracleData = await client.fetchOracle(oracle)
    assert.equal(oracleData.priorityQueue.toString(), [{ collateral: addresses[0], amount: values[0] }, { collateral: addresses[1], amount: values[1] }].toString())
  })

  it('can remove manager', async () => {
    const { tx } = await client.removeManager({
      pool,
      managerWallet: provider.wallet.publicKey,
    })

    try {
      await provider.sendAndConfirm(tx)
    } catch (e) {
      console.log(e)
      throw e
    }
  })

  it('can not call manager instruction from non-manager account', async () => {
    const { tx } = await client.pauseGlobalPool({
      pool,
    })

    try {
      await provider.sendAndConfirm(tx)
      assert.ok(false)
    } catch (e: any) {
      assertErrorCode(e, '')
    }
  })

  it('can pause pool', async () => {
    const { tx: tx1 } = await client.addManager({
      pool,
      managerWallet: provider.wallet.publicKey,
    })

    try {
      await provider.sendAndConfirm(tx1)
    } catch (e) {
      console.log(e)
      throw e
    }
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
    // const stakePoolAccount = await getStakePoolAccount(provider.connection, new web3.PublicKey('Jito4APyf642JPZPx3hGc6WWJ8zPKtRbRs4P815Awbb'))
    // console.log(stakePoolAccount)
    stakePool = new web3.PublicKey('5ocnV1qiCgaQR8Jb8xWnVbApfaygJ8tNoZfgPwsgx9kx')
    // try {
    //   await depositSol(provider.connection, stakePool, provider.wallet.publicKey, 100000000)
    // } catch (e) {
    //   console.log(e)
    // }
    const { tx, whitelist } = await client.addToWhitelist({
      pool,
      token: poolMint,
      tokenPool: STAKE_POOL_PROGRAM_ID,
      stakePool,
    })

    try {
      await provider.sendAndConfirm(tx)
    } catch (e) {
      console.log(e)
      throw e
    }

    const whitelistData = await client.fetchWhitelist(whitelist)
    assert.equal(whitelistData.whitelistedToken.equals(poolMint), true)
    assert.equal(whitelistData.pool.equals(STAKE_POOL_PROGRAM_ID), true)
    assert.equal(whitelistData.stakingPool.equals(stakePool), true)
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
    lpToken = await createMint(provider.connection, payerKeypair, provider.wallet.publicKey, null, 9, web3.Keypair.generate(), null, TOKEN_PROGRAM_ID)
    const source = await getOrCreateAssociatedTokenAccount(provider.connection, payerKeypair, lpToken, provider.wallet.publicKey)
    await mintTo(provider.connection, payerKeypair, lpToken, source.address, provider.wallet.publicKey, 100, [], null, TOKEN_PROGRAM_ID)
    let sourceBalance = await provider.connection.getTokenAccountBalance(source.address)

    assert.equal(sourceBalance.value.amount, 100)

    const { tx: transaction } = await client.addToWhitelist({
      pool,
      token: lpToken,
      tokenPool: STAKE_POOL_PROGRAM_ID,
      stakePool,
    })
    try {
      await provider.sendAndConfirm(transaction)
    } catch (e) {
      console.log(e)
      throw e
    }
    const destination = await getOrCreateAssociatedTokenAccount(provider.connection, payerKeypair, lpToken, poolAuthority, true)
    let destinationBalance = await provider.connection.getTokenAccountBalance(destination.address)

    assert.equal(destinationBalance.value.amount, 0)

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

    sourceBalance = await provider.connection.getTokenAccountBalance(source.address)
    destinationBalance = await provider.connection.getTokenAccountBalance(destination.address)

    assert.equal(sourceBalance.value.amount, 0)
    assert.equal(destinationBalance.value.amount, 100)

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
    assert.equal(collateralData.liquidatedAmount, 0)
    assert.equal(collateralData.isNative, false)
    assert.equal(collateralData.sourceStake.equals(lpToken), true)
  })

  it('can deposit lp tokens twice', async () => {
    const source = await getOrCreateAssociatedTokenAccount(provider.connection, payerKeypair, lpToken, provider.wallet.publicKey)
    await mintTo(provider.connection, payerKeypair, lpToken, source.address, provider.wallet.publicKey, 100, [], null, TOKEN_PROGRAM_ID)
    const destination = await getOrCreateAssociatedTokenAccount(provider.connection, payerKeypair, lpToken, poolAuthority, true)
    let sourceBalance = await provider.connection.getTokenAccountBalance(source.address)
    let destinationBalance = await provider.connection.getTokenAccountBalance(destination.address)

    assert.equal(sourceBalance.value.amount, 100)
    assert.equal(destinationBalance.value.amount, 100)

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

    sourceBalance = await provider.connection.getTokenAccountBalance(source.address)
    destinationBalance = await provider.connection.getTokenAccountBalance(destination.address)

    assert.equal(sourceBalance.value.amount, 0)
    assert.equal(destinationBalance.value.amount, 200)

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
    assert.equal(collateralData.liquidatedAmount, 0)
    assert.equal(collateralData.isNative, false)
    assert.equal(collateralData.sourceStake.equals(lpToken), true)
  })

  it('can not deposit non-whitelisted tokens', async () => {
    const someToken = await createMint(provider.connection, payerKeypair, provider.wallet.publicKey, null, 1, web3.Keypair.generate(), null, TOKEN_PROGRAM_ID)
    const source = await getOrCreateAssociatedTokenAccount(provider.connection, payerKeypair, someToken, provider.wallet.publicKey)
    await mintTo(provider.connection, payerKeypair, someToken, source.address, provider.wallet.publicKey, 100, [], null, TOKEN_PROGRAM_ID)
    const destination = await getOrCreateAssociatedTokenAccount(provider.connection, payerKeypair, someToken, poolAuthority, true)
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
      userWallet: provider.wallet.publicKey,
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
    const destination = await getOrCreateAssociatedTokenAccount(provider.connection, payerKeypair, lpToken, poolAuthority, true)
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
      userWallet: provider.wallet.publicKey,
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
    const destination = await getOrCreateAssociatedTokenAccount(provider.connection, payerKeypair, lpToken, poolAuthority, true)
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
    const destination = await getOrCreateAssociatedTokenAccount(provider.connection, payerKeypair, lpToken, poolAuthority, true)
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
      ))

    const createAccountTransaction = web3.StakeProgram.createAccount({
      fromPubkey: provider.wallet.publicKey,
      authorized: new web3.Authorized(
        provider.wallet.publicKey,
        provider.wallet.publicKey,
      ),
      lamports: lamportsForStakeAccount + 10 * web3.LAMPORTS_PER_SOL,
      lockup: new web3.Lockup(0, 0, provider.wallet.publicKey),
      stakePubkey: stakeAccount,
    })
    await provider.sendAndConfirm(createAccountTransaction, [payerKeypair, stakeKeypair])

    const validators = await provider.connection.getVoteAccounts()
    const selectedValidator = validators.current[0]
    const selectedValidatorPubkey = new web3.PublicKey(selectedValidator.votePubkey)

    const delegateTransaction = web3.StakeProgram.delegate({
      stakePubkey: stakeAccount,
      authorizedPubkey: provider.wallet.publicKey,
      votePubkey: selectedValidatorPubkey,
    })

    await provider.sendAndConfirm(delegateTransaction, [payerKeypair, payerKeypair])

    const { transaction, user, collateral, bump } = await client.depositStake({
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

    assert.equal(poolData.depositAmount.toString(), '10000000200')
    assert.equal(userData.wallet.equals(provider.wallet.publicKey), true)
    assert.equal(userData.rate.toString(), '10000000200')
    assert.equal(userData.isBlocked, false)
    assert.equal(collateralData.user.equals(user), true)
    assert.equal(collateralData.pool.equals(pool), true)
    assert.equal(collateralData.bump, bump)
    assert.equal(collateralData.amount, 0)
    assert.equal(collateralData.delegationStake.toString(), '10000000000')
    assert.equal(collateralData.liquidatedAmount.toString(), '0')
    assert.equal(collateralData.isNative, true)
    assert.equal(collateralData.sourceStake.equals(stakeAccount), true)

    const withdrawTransaction = web3.StakeProgram.withdraw({
      stakePubkey: stakeAccount,
      authorizedPubkey: provider.wallet.publicKey,
      toPubkey: provider.wallet.publicKey,
      lamports: lamportsForStakeAccount + 10 * web3.LAMPORTS_PER_SOL,
    })

    try {
      await provider.sendAndConfirm(withdrawTransaction, [payerKeypair, stakeKeypair])
      assert.ok(false)
    } catch (e: any) {
      assert.ok(true)
    }
  })

  it('can not deposit stake if it is not delegated', async () => {
    const stakeKeypair = web3.Keypair.generate()
    const stakeAccount = stakeKeypair.publicKey

    const lamportsForStakeAccount
      = (await provider.connection.getMinimumBalanceForRentExemption(
        web3.StakeProgram.space,
      ))

    const createAccountTransaction = web3.StakeProgram.createAccount({
      fromPubkey: provider.wallet.publicKey,
      authorized: new web3.Authorized(
        provider.wallet.publicKey,
        provider.wallet.publicKey,
      ),
      lamports: lamportsForStakeAccount + 10 * web3.LAMPORTS_PER_SOL,
      lockup: new web3.Lockup(0, 0, provider.wallet.publicKey),
      stakePubkey: stakeAccount,
    })
    await provider.sendAndConfirm(createAccountTransaction, [payerKeypair, stakeKeypair])

    const { transaction } = await client.depositStake({
      sourceStake: stakeAccount,
      pool,
    })

    try {
      await provider.sendAndConfirm(transaction)
      assert.ok(false)
    } catch (e: any) {
      assertErrorCode(e, '')
    }
  })

  it('can not deposit stake if pool paused', async () => {
    const stakeKeypair = web3.Keypair.generate()
    const stakeAccount = stakeKeypair.publicKey

    const lamportsForStakeAccount
      = (await provider.connection.getMinimumBalanceForRentExemption(
        web3.StakeProgram.space,
      ))

    const createAccountTransaction = web3.StakeProgram.createAccount({
      fromPubkey: provider.wallet.publicKey,
      authorized: new web3.Authorized(
        provider.wallet.publicKey,
        provider.wallet.publicKey,
      ),
      lamports: lamportsForStakeAccount + 10 * web3.LAMPORTS_PER_SOL,
      lockup: new web3.Lockup(0, 0, provider.wallet.publicKey),
      stakePubkey: stakeAccount,
    })
    await provider.sendAndConfirm(createAccountTransaction, [payerKeypair, stakeKeypair])

    const validators = await provider.connection.getVoteAccounts()
    const selectedValidator = validators.current[0]
    const selectedValidatorPubkey = new web3.PublicKey(selectedValidator.votePubkey)

    const delegateTransaction = web3.StakeProgram.delegate({
      stakePubkey: stakeAccount,
      authorizedPubkey: provider.wallet.publicKey,
      votePubkey: selectedValidatorPubkey,
    })

    await provider.sendAndConfirm(delegateTransaction, [payerKeypair, payerKeypair])

    const { tx: tx1 } = await client.pauseGlobalPool({
      pool,
    })

    try {
      await provider.sendAndConfirm(tx1)
    } catch (e) {
      console.log(e)
      throw e
    }

    const { transaction } = await client.depositStake({
      sourceStake: stakeAccount,
      pool,
    })

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

  it('can mint omnisol from stake collateral', async () => {
    const userPoolToken = await getOrCreateAssociatedTokenAccount(provider.connection, payerKeypair, poolMint, provider.wallet.publicKey)
    let userPoolBalance = await provider.connection.getTokenAccountBalance(userPoolToken.address)

    assert.equal(userPoolBalance.value.amount, 0)

    const { transaction, user, collateral } = await client.mintOmnisol({
      amount: new BN(10000000000),
      pool,
      poolMint,
      stakedAddress: stakeAccount,
      userPoolToken: userPoolToken.address,
    })

    try {
      await provider.sendAndConfirm(transaction)
    } catch (e) {
      console.log(e)
      throw e
    }

    userPoolBalance = await provider.connection.getTokenAccountBalance(userPoolToken.address)

    assert.equal(userPoolBalance.value.amount, 10000000000)

    const poolData = await client.fetchGlobalPool(pool)
    const userData = await client.fetchUser(user)
    const collateralData = await client.fetchCollateral(collateral)

    assert.equal(poolData.depositAmount.toString(), '10000000200')
    assert.equal(userData.rate.toString(), '200')
    assert.equal(collateralData.amount.toString(), '10000000000')
    assert.equal(collateralData.delegationStake.toString(), '10000000000')
  })

  it('can mint omnisol from lp collateral', async () => {
    const userPoolToken = await getOrCreateAssociatedTokenAccount(provider.connection, payerKeypair, poolMint, provider.wallet.publicKey)
    let userPoolBalance = await provider.connection.getTokenAccountBalance(userPoolToken.address)

    assert.equal(userPoolBalance.value.amount, 10000000000)

    const { transaction, user, collateral } = await client.mintOmnisol({
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

    userPoolBalance = await provider.connection.getTokenAccountBalance(userPoolToken.address)

    assert.equal(userPoolBalance.value.amount, 10000000100)

    const poolData = await client.fetchGlobalPool(pool)
    const userData = await client.fetchUser(user)
    const collateralData = await client.fetchCollateral(collateral)

    assert.equal(poolData.depositAmount.toString(), '10000000200')
    assert.equal(userData.rate.toString(), '100')
    assert.equal(collateralData.amount.toString(), '100')
    assert.equal(collateralData.delegationStake.toString(), '200')
  })

  it('can not mint greater than was delegated', async () => {
    const userPoolToken = await getOrCreateAssociatedTokenAccount(provider.connection, payerKeypair, poolMint, provider.wallet.publicKey)
    const { transaction } = await client.mintOmnisol({
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
      assertErrorCode(e, 'InsufficientAmount')
    }
  })

  it('can not mint when pool paused', async () => {
    const userPoolToken = await getOrCreateAssociatedTokenAccount(provider.connection, payerKeypair, poolMint, provider.wallet.publicKey)
    const { transaction } = await client.mintOmnisol({
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
    const { transaction } = await client.mintOmnisol({
      amount: new BN(100),
      pool,
      poolMint,
      stakedAddress: lpToken,
      userPoolToken: userPoolToken.address,
    })

    const { tx } = await client.blockUser({
      pool,
      userWallet: provider.wallet.publicKey,
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
      userWallet: provider.wallet.publicKey,
    })

    try {
      await provider.sendAndConfirm(tx1)
    } catch (e) {
      console.log(e)
      throw e
    }
  })

  it('can withdraw lp tokens', async () => {
    const userPoolToken = await getOrCreateAssociatedTokenAccount(provider.connection, payerKeypair, poolMint, provider.wallet.publicKey)
    let userPoolBalance = await provider.connection.getTokenAccountBalance(userPoolToken.address)

    assert.equal(userPoolBalance.value.amount, 10000000100)

    const destination = await getOrCreateAssociatedTokenAccount(provider.connection, payerKeypair, lpToken, provider.wallet.publicKey)
    let destinationBalance = await provider.connection.getTokenAccountBalance(destination.address)

    assert.equal(destinationBalance.value.amount, 200)

    const source = await getOrCreateAssociatedTokenAccount(provider.connection, payerKeypair, lpToken, poolAuthority, true)
    let sourceBalance = await provider.connection.getTokenAccountBalance(source.address)

    assert.equal(sourceBalance.value.amount, 200)

    const { transaction, user, collateral } = await client.withdrawLPTokens({
      amount: new BN(50),
      destination: destination.address,
      lpToken,
      pool,
      poolMint,
      source: source.address,
      userPoolToken: userPoolToken.address,
    })

    try {
      await provider.sendAndConfirm(transaction)
    } catch (e) {
      console.log(e)
      throw e
    }

    sourceBalance = await provider.connection.getTokenAccountBalance(source.address)
    destinationBalance = await provider.connection.getTokenAccountBalance(destination.address)
    userPoolBalance = await provider.connection.getTokenAccountBalance(userPoolToken.address)

    assert.equal(sourceBalance.value.amount, 150)
    assert.equal(destinationBalance.value.amount, 250)
    assert.equal(userPoolBalance.value.amount, 10000000050)

    const poolData = await client.fetchGlobalPool(pool)
    const userData = await client.fetchUser(user)
    const collateralData = await client.fetchCollateral(collateral)

    assert.equal(poolData.depositAmount.toString(), '10000000150')
    assert.equal(userData.rate.toString(), '100')
    assert.equal(collateralData.amount, 50)
    assert.equal(collateralData.delegationStake, 150)
    assert.equal(collateralData.liquidatedAmount, 0)
  })

  it('can not withdraw stake if pool paused', async () => {
    const userPoolToken = await getOrCreateAssociatedTokenAccount(provider.connection, payerKeypair, poolMint, provider.wallet.publicKey)

    const splitKeypair = web3.Keypair.generate()
    const splitAccount = splitKeypair.publicKey

    const { tx } = await client.pauseGlobalPool({
      pool,
    })

    try {
      await provider.sendAndConfirm(tx)
    } catch (e) {
      console.log(e)
      throw e
    }

    const { transaction } = await client.withdrawStake({
      amount: new BN(10000000000),
      pool,
      poolMint,
      splitStake: splitAccount,
      stakeAccount,
      stakeProgram: web3.StakeProgram.programId,
      userPoolToken: userPoolToken.address,
    })

    try {
      await provider.sendAndConfirm(transaction, [payerKeypair, splitKeypair])
      assert.ok(false)
    } catch (e: any) {
      assertErrorCode(e, 'PoolAlreadyPaused')
    }

    const { tx: tx1 } = await client.resumeGlobalPool({
      pool,
    })

    try {
      await provider.sendAndConfirm(tx1)
    } catch (e) {
      console.log(e)
      throw e
    }
  })

  it('can not withdraw stake if user blocked', async () => {
    const userPoolToken = await getOrCreateAssociatedTokenAccount(provider.connection, payerKeypair, poolMint, provider.wallet.publicKey)

    const splitKeypair = web3.Keypair.generate()
    const splitAccount = splitKeypair.publicKey

    const { tx } = await client.blockUser({
      pool,
      userWallet: provider.wallet.publicKey,
    })

    try {
      await provider.sendAndConfirm(tx)
    } catch (e) {
      console.log(e)
      throw e
    }

    const { transaction } = await client.withdrawStake({
      amount: new BN(10000000000),
      pool,
      poolMint,
      splitStake: splitAccount,
      stakeAccount,
      stakeProgram: web3.StakeProgram.programId,
      userPoolToken: userPoolToken.address,
    })

    try {
      await provider.sendAndConfirm(transaction, [payerKeypair, splitKeypair])
      assert.ok(false)
    } catch (e: any) {
      assertErrorCode(e, 'UserBlocked')
    }

    const { tx: tx1 } = await client.unblockUser({
      pool,
      userWallet: provider.wallet.publicKey,
    })

    try {
      await provider.sendAndConfirm(tx1)
    } catch (e) {
      console.log(e)
      throw e
    }
  })

  it('can not withdraw stake more than user can', async () => {
    const userPoolToken = await getOrCreateAssociatedTokenAccount(provider.connection, payerKeypair, poolMint, provider.wallet.publicKey)

    const splitKeypair = web3.Keypair.generate()
    const splitAccount = splitKeypair.publicKey

    const { transaction } = await client.withdrawStake({
      amount: new BN(10000000001),
      pool,
      poolMint,
      splitStake: splitAccount,
      stakeAccount,
      stakeProgram: web3.StakeProgram.programId,
      userPoolToken: userPoolToken.address,
    })

    try {
      await provider.sendAndConfirm(transaction, [payerKeypair, splitKeypair])
      assert.ok(false)
    } catch (e: any) {
      assertErrorCode(e, 'InsufficientAmount')
    }
  })

  it('can withdraw stake', async () => {
    const userPoolToken = await getOrCreateAssociatedTokenAccount(provider.connection, payerKeypair, poolMint, provider.wallet.publicKey)
    let userPoolBalance = await provider.connection.getTokenAccountBalance(userPoolToken.address)

    assert.equal(userPoolBalance.value.amount, 10000000050)

    const splitKeypair = web3.Keypair.generate()
    const splitAccount = splitKeypair.publicKey

    const { transaction, user, collateral } = await client.withdrawStake({
      amount: new BN(10000000000),
      pool,
      poolMint,
      splitStake: splitAccount,
      stakeAccount,
      stakeProgram: web3.StakeProgram.programId,
      userPoolToken: userPoolToken.address,
    })

    try {
      await provider.sendAndConfirm(transaction, [payerKeypair, splitKeypair])
    } catch (e) {
      console.log(e)
      throw e
    }

    userPoolBalance = await provider.connection.getTokenAccountBalance(userPoolToken.address)

    assert.equal(userPoolBalance.value.amount, 50)

    const poolData = await client.fetchGlobalPool(pool)
    const userData = await client.fetchUser(user)
    const collateralData = await client.fetchCollateral(collateral)

    assert.equal(poolData.depositAmount.toString(), '150')
    assert.equal(userData.rate.toString(), '100')
    assert.equal(collateralData, null)
  })

  it('can not withdraw lp tokens if pool paused', async () => {
    const userPoolToken = await getOrCreateAssociatedTokenAccount(provider.connection, payerKeypair, poolMint, provider.wallet.publicKey)
    const destination = await getOrCreateAssociatedTokenAccount(provider.connection, payerKeypair, lpToken, provider.wallet.publicKey)
    const source = await getOrCreateAssociatedTokenAccount(provider.connection, payerKeypair, lpToken, poolAuthority, true)

    const { tx } = await client.pauseGlobalPool({
      pool,
    })

    try {
      await provider.sendAndConfirm(tx)
    } catch (e) {
      console.log(e)
      throw e
    }

    const { transaction } = await client.withdrawLPTokens({
      amount: new BN(50),
      destination: destination.address,
      lpToken,
      pool,
      poolMint,
      source: source.address,
      userPoolToken: userPoolToken.address,
    })

    try {
      await provider.sendAndConfirm(transaction)
      assert.ok(false)
    } catch (e: any) {
      assertErrorCode(e, 'PoolAlreadyPaused')
    }

    const { tx: tx1 } = await client.resumeGlobalPool({
      pool,
    })

    try {
      await provider.sendAndConfirm(tx1)
    } catch (e) {
      console.log(e)
      throw e
    }
  })

  it('can not withdraw lp tokens if user blocked', async () => {
    const userPoolToken = await getOrCreateAssociatedTokenAccount(provider.connection, payerKeypair, poolMint, provider.wallet.publicKey)
    const destination = await getOrCreateAssociatedTokenAccount(provider.connection, payerKeypair, lpToken, provider.wallet.publicKey)
    const source = await getOrCreateAssociatedTokenAccount(provider.connection, payerKeypair, lpToken, poolAuthority, true)

    const { tx } = await client.blockUser({
      pool,
      userWallet: provider.wallet.publicKey,
    })

    try {
      await provider.sendAndConfirm(tx)
    } catch (e) {
      console.log(e)
      throw e
    }

    const { transaction } = await client.withdrawLPTokens({
      amount: new BN(50),
      destination: destination.address,
      lpToken,
      pool,
      poolMint,
      source: source.address,
      userPoolToken: userPoolToken.address,
    })

    try {
      await provider.sendAndConfirm(transaction)
      assert.ok(false)
    } catch (e: any) {
      assertErrorCode(e, 'UserBlocked')
    }

    const { tx: tx1 } = await client.unblockUser({
      pool,
      userWallet: provider.wallet.publicKey,
    })

    try {
      await provider.sendAndConfirm(tx1)
    } catch (e) {
      console.log(e)
      throw e
    }
  })

  it('can not withdraw lp tokens more than user can', async () => {
    const userPoolToken = await getOrCreateAssociatedTokenAccount(provider.connection, payerKeypair, poolMint, provider.wallet.publicKey)
    const destination = await getOrCreateAssociatedTokenAccount(provider.connection, payerKeypair, lpToken, provider.wallet.publicKey)
    const source = await getOrCreateAssociatedTokenAccount(provider.connection, payerKeypair, lpToken, poolAuthority, true)

    const { transaction } = await client.withdrawLPTokens({
      amount: new BN(51),
      destination: destination.address,
      lpToken,
      pool,
      poolMint,
      source: source.address,
      userPoolToken: userPoolToken.address,
    })

    try {
      await provider.sendAndConfirm(transaction)
      assert.ok(false)
    } catch (e: any) {
      assertErrorCode(e, 'InsufficientAmount')
    }
  })

  it('should close collateral if delegated amount become 0', async () => {
    const userPoolToken = await getOrCreateAssociatedTokenAccount(provider.connection, payerKeypair, poolMint, provider.wallet.publicKey)
    let userPoolBalance = await provider.connection.getTokenAccountBalance(userPoolToken.address)

    assert.equal(userPoolBalance.value.amount, 50)

    const { transaction } = await client.mintOmnisol({
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

    userPoolBalance = await provider.connection.getTokenAccountBalance(userPoolToken.address)

    assert.equal(userPoolBalance.value.amount, 150)

    const destination = await getOrCreateAssociatedTokenAccount(provider.connection, payerKeypair, lpToken, provider.wallet.publicKey)
    let destinationBalance = await provider.connection.getTokenAccountBalance(destination.address)

    assert.equal(destinationBalance.value.amount, 250)

    const source = await getOrCreateAssociatedTokenAccount(provider.connection, payerKeypair, lpToken, poolAuthority, true)
    let sourceBalance = await provider.connection.getTokenAccountBalance(source.address)

    assert.equal(sourceBalance.value.amount, 150)

    const { transaction: transaction1, user, collateral } = await client.withdrawLPTokens({
      amount: new BN(150),
      destination: destination.address,
      lpToken,
      pool,
      poolMint,
      source: source.address,
      userPoolToken: userPoolToken.address,
    })

    try {
      await provider.sendAndConfirm(transaction1)
    } catch (e) {
      console.log(e)
      throw e
    }

    sourceBalance = await provider.connection.getTokenAccountBalance(source.address)
    destinationBalance = await provider.connection.getTokenAccountBalance(destination.address)
    userPoolBalance = await provider.connection.getTokenAccountBalance(userPoolToken.address)

    assert.equal(sourceBalance.value.amount, 0)
    assert.equal(destinationBalance.value.amount, 400)
    assert.equal(userPoolBalance.value.amount, 0)

    const poolData = await client.fetchGlobalPool(pool)
    const userData = await client.fetchUser(user)
    const collateralData = await client.fetchCollateral(collateral)

    assert.equal(poolData.depositAmount.toString(), '0')
    assert.equal(userData.rate.toString(), '0')
    assert.equal(collateralData, null)
  })

  it('can close oracle', async () => {
    const { tx } = await client.closeOracle({
      pool,
      oracle,
    })

    try {
      await provider.sendAndConfirm(tx)
    } catch (e) {
      console.log(e)
      throw e
    }

    const oracleData = await client.fetchOracle(oracle)
    assert.equal(oracleData, null)
  })

  it('can not update oracle info with non-oracle authority', async () => {
    const oraclePair = web3.Keypair.generate()
    oracle = oraclePair.publicKey

    const { tx } = await client.initOracle({
      pool,
      oracleAuthority: web3.PublicKey.unique(),
      oracle,
    })

    try {
      await provider.sendAndConfirm(tx, [oraclePair])
    } catch (e) {
      console.log(e)
      throw e
    }

    const addresses = [web3.PublicKey.unique(), web3.PublicKey.unique()]
    const values = [new BN(100), new BN(200)]
    const { tx: tx1 } = await client.updateOracleInfo({
      oracle,
      addresses,
      values,
    })

    try {
      await provider.sendAndConfirm(tx1)
      assert.ok(false)
    } catch (e: any) {
      assertErrorCode(e, '')
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
