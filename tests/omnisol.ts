import {
  TOKEN_PROGRAM_ID,
  createAssociatedTokenAccount,
  createInitializeAccountInstruction,
  createMint,
  getOrCreateAssociatedTokenAccount, mintTo,
} from '@solana/spl-token'
import { AnchorProvider, BN, Program, Wallet, web3 } from '@project-serum/anchor'
import { assert } from 'chai'
import { OmnisolClient } from '@omnisol/sdk'
import { STAKE_POOL_PROGRAM_ID, depositSol, getStakePoolAccount, getStakePoolAccounts, initialize } from '@solana/spl-stake-pool'

const payerKeypair = web3.Keypair.fromSecretKey(Uint8Array.from([46, 183, 156, 94, 55, 128, 248, 0, 49, 70, 183, 244, 178, 0, 0, 236, 212, 131, 76, 78, 112, 48, 25, 79, 249, 33, 43, 158, 199, 2, 168, 18, 55, 174, 166, 159, 57, 67, 197, 158, 255, 142, 177, 177, 47, 39, 35, 185, 148, 253, 191, 58, 219, 119, 104, 89, 225, 26, 244, 119, 160, 6, 156, 227]))
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
  let poolForLP: web3.PublicKey
  let poolMint: web3.PublicKey
  let lpToken: web3.PublicKey
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let poolAuthority: web3.PublicKey
  let poolForLPAuthority: web3.PublicKey
  let stakeAccount: web3.PublicKey
  let oracle: web3.PublicKey
  let stakePool: web3.PublicKey
  let mintAuthority: web3.PublicKey
  let splitAccount: web3.PublicKey

  before(async () => {
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(client.wallet.publicKey, 10000000 * web3.LAMPORTS_PER_SOL),
    )
  })

  it('can add manager', async () => {
    const { tx, manager } = await client.addManager({
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

  it('can add liquidator', async () => {
    const { tx, liquidator } = await client.addLiquidator({
      liquidator_wallet: provider.wallet.publicKey,
    })

    try {
      await provider.sendAndConfirm(tx)
    } catch (e) {
      console.log(e)
      throw e
    }

    const liquidatorData = await client.fetchLiquidator(liquidator)
    assert.equal(liquidatorData.authority.equals(provider.wallet.publicKey), true)
  })

  // it('can update oracle info', async () => {
  //   const addresses = [web3.PublicKey.unique(), web3.PublicKey.unique()]
  //   const values = [new BN(100), new BN(200)]
  //   const { tx } = await client.updateOracleInfo({
  //     oracle,
  //     addresses,
  //     values,
  //   })
  //
  //   try {
  //     await provider.sendAndConfirm(tx)
  //   } catch (e) {
  //     console.log(e)
  //     throw e
  //   }
  //
  //   const oracleData = await client.fetchOracle(oracle)
  //   assert.equal(oracleData.priorityQueue.toString(), [{ collateral: addresses[0], amount: values[0] }, { collateral: addresses[1], amount: values[1] }].toString())
  // })
  //
  // it('update oracle info should replace data', async () => {
  //   const addresses = [web3.PublicKey.unique(), web3.PublicKey.unique()]
  //   const values = [new BN(200), new BN(300)]
  //   const { tx } = await client.updateOracleInfo({
  //     oracle,
  //     addresses,
  //     values,
  //   })
  //
  //   try {
  //     await provider.sendAndConfirm(tx)
  //   } catch (e) {
  //     console.log(e)
  //     throw e
  //   }
  //
  //   const oracleData = await client.fetchOracle(oracle)
  //   assert.equal(oracleData.priorityQueue.toString(), [{ collateral: addresses[0], amount: values[0] }, { collateral: addresses[1], amount: values[1] }].toString())
  // })
  //
  // it('can remove manager', async () => {
  //   const { tx } = await client.removeManager({
  //     managerWallet: provider.wallet.publicKey,
  //   })
  //
  //   try {
  //     await provider.sendAndConfirm(tx)
  //   } catch (e) {
  //     console.log(e)
  //     throw e
  //   }
  // })
  //
  // it('can not call manager instruction from non-manager account', async () => {
  //   const { tx } = await client.pausePool({
  //     pool,
  //   })
  //
  //   try {
  //     await provider.sendAndConfirm(tx)
  //     assert.ok(false)
  //   } catch {
  //     assert.ok(true)
  //   }
  // })

  it('can create pool', async () => {
    const poolKeypair = web3.Keypair.generate()
    pool = poolKeypair.publicKey
    const [authority, bump] = await client.pda.poolAuthority(pool)
    poolAuthority = authority
    const [mintAuthorityKey] = await client.pda.mintAuthority()
    mintAuthority = mintAuthorityKey
    poolMint = await createMint(provider.connection, payerKeypair, mintAuthority, null, 9, web3.Keypair.generate(), undefined, TOKEN_PROGRAM_ID)
    const { tx } = await client.createPool({
      oracle,
      stakeSource: web3.StakeProgram.programId,
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
    assert.equal(poolData.oracle.equals(oracle), true)
    assert.equal(poolData.stakeSource.equals(web3.StakeProgram.programId), true)
  })

  it('can burn omnisol', async () => {
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
      lamports: lamportsForStakeAccount + web3.LAMPORTS_PER_SOL,
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

    const splitKeypair = web3.Keypair.generate()
    const splitStake = splitKeypair.publicKey

    const { transaction, user, collateral, bump } = await client.depositStake({
      delegatedStake: stakeAccount,
      amount: new BN(web3.LAMPORTS_PER_SOL),
      splitStake,
      sourceStake: stakeAccount,
      pool,
    })

    try {
      await provider.sendAndConfirm(transaction, [splitKeypair])
    } catch (e) {
      console.log(e)
      throw e
    }

    let poolData = await client.fetchGlobalPool(pool)
    let userData = await client.fetchUser(user)
    let collateralData = await client.fetchCollateral(collateral)

    assert.equal(poolData.depositAmount.toString(), '1000000000')
    assert.equal(userData.wallet.equals(provider.wallet.publicKey), true)
    assert.equal(userData.rate.toString(), '1000000000')
    assert.equal(userData.isBlocked, false)
    assert.equal(collateralData.user.equals(user), true)
    assert.equal(collateralData.pool.equals(pool), true)
    assert.equal(collateralData.bump, bump)
    assert.equal(collateralData.amount, 0)
    assert.equal(collateralData.delegationStake.toString(), '1000000000')
    assert.equal(collateralData.liquidatedAmount.toString(), '0')
    assert.equal(collateralData.isNative, true)
    assert.equal(collateralData.sourceStake.equals(stakeAccount), true)

    const userPoolToken = await getOrCreateAssociatedTokenAccount(provider.connection, payerKeypair, poolMint, provider.wallet.publicKey)
    let userPoolBalance = await provider.connection.getTokenAccountBalance(userPoolToken.address)

    assert.equal(userPoolBalance.value.amount, '0')

    const { transaction: tx1 } = await client.mintOmnisol({
      amount: new BN(1000000000),
      pool,
      poolMint,
      stakedAddress: stakeAccount,
      userPoolToken: userPoolToken.address,
    })

    try {
      await provider.sendAndConfirm(tx1)
    } catch (e) {
      console.log(e)
      throw e
    }

    userPoolBalance = await provider.connection.getTokenAccountBalance(userPoolToken.address)

    assert.equal(userPoolBalance.value.amount, '1000000000')

    poolData = await client.fetchGlobalPool(pool)
    userData = await client.fetchUser(user)
    collateralData = await client.fetchCollateral(collateral)

    assert.equal(poolData.depositAmount.toString(), '1000000000')
    assert.equal(userData.rate.toString(), '0')
    assert.equal(collateralData.amount.toString(), '1000000000')
    assert.equal(collateralData.delegationStake.toString(), '1000000000')

    const { tx, withdrawInfo } = await client.burnOmnisol({
      sourceTokenAccount: userPoolToken.address,
      amount: new BN(500000000),
      pool,
      poolMint,
    })

    try {
      await provider.sendAndConfirm(tx)
    } catch (e) {
      console.log(e)
      throw e
    }

    userPoolBalance = await provider.connection.getTokenAccountBalance(userPoolToken.address)

    assert.equal(userPoolBalance.value.amount, '500000000')

    const withdrawInfoData = await client.fetchWithdrawInfo(withdrawInfo)

    assert.equal(withdrawInfoData.amount.toString(), '500000000')
    assert.equal(withdrawInfoData.authority.equals(provider.wallet.publicKey), true)
  })

  it('can create another withdraw request', async () => {
    const userPoolToken = await getOrCreateAssociatedTokenAccount(provider.connection, payerKeypair, poolMint, provider.wallet.publicKey)
    let userPoolBalance = await provider.connection.getTokenAccountBalance(userPoolToken.address)

    assert.equal(userPoolBalance.value.amount, '500000000')

    const { tx, withdrawInfo } = await client.burnOmnisol({
      sourceTokenAccount: userPoolToken.address,
      amount: new BN(500000000),
      pool,
      poolMint,
    })

    try {
      await provider.sendAndConfirm(tx)
    } catch (e) {
      console.log(e)
      throw e
    }

    userPoolBalance = await provider.connection.getTokenAccountBalance(userPoolToken.address)

    assert.equal(userPoolBalance.value.amount, '0')

    const withdrawInfoData = await client.fetchWithdrawInfo(withdrawInfo)

    assert.equal(withdrawInfoData.amount.toString(), '500000000')
    assert.equal(withdrawInfoData.authority.equals(provider.wallet.publicKey), true)
  })

  it('can liquidate collateral', async () => {
    const poolAddr = new web3.PublicKey('FypPtwbY3FUfzJUtXHSyVRokVKG2jKtH29FmK4ebxRSd')
    const [stakeAccountRecord] = await web3.PublicKey.findProgramAddress(
      [poolAddr.toBuffer(), stakeAccount.toBuffer()],
      new web3.PublicKey('unpXTU2Ndrc7WWNyEhQWe4udTzSibLPi25SXv2xbCHQ'),
    )

    const splitKeypair = web3.Keypair.generate()
    const splitStake = splitKeypair.publicKey

    const { tx } = await client.liquidateCollateral({
      amount: new BN(500000000),
      feeAccount: new web3.PublicKey('So11111111111111111111111111111111111111112'),
      oracle,
      pool,
      poolAccount: poolAddr,
      protocolFee: new web3.PublicKey('2hN9UhvRFVfPYKL6rZJ5YiLEPCLTpN755pgwDJHWgFbU'),
      protocolFeeDestination: new web3.PublicKey('GnRGTBrFuEwb85Zs4zeZWUzQYfTwmPxCPYmQQodDzYUK'),
      solReserves: new web3.PublicKey('3rBnnH9TTgd3xwu48rnzGsaQkSr1hR64nY71DrDt6VrQ'),
      sourceStake: stakeAccount,
      stakeAccountRecord,
      collateralOwnerWallet: provider.wallet.publicKey,
      userWallet: provider.wallet.publicKey,
      splitStake,
      unstakeItProgram: new web3.PublicKey('unpXTU2Ndrc7WWNyEhQWe4udTzSibLPi25SXv2xbCHQ'),
    })

    try {
      await provider.sendAndConfirm(tx, [splitKeypair])
    } catch (e) {
      console.log(e)
      throw e
    }
  })

  // it('can pause pool', async () => {
  //   const { tx: tx1 } = await client.addManager({
  //     managerWallet: provider.wallet.publicKey,
  //   })
  //
  //   try {
  //     await provider.sendAndConfirm(tx1)
  //   } catch (e) {
  //     console.log(e)
  //     throw e
  //   }
  //   const { tx } = await client.pausePool({
  //     pool,
  //   })
  //
  //   try {
  //     await provider.sendAndConfirm(tx)
  //   } catch (e) {
  //     console.log(e)
  //     throw e
  //   }
  //
  //   const poolData = await client.fetchGlobalPool(pool)
  //   assert.equal(poolData.isActive, false)
  // })
  //
  // it('can resume pool', async () => {
  //   const { tx } = await client.resumePool({
  //     pool,
  //   })
  //
  //   try {
  //     await provider.sendAndConfirm(tx)
  //   } catch (e) {
  //     console.log(e)
  //     throw e
  //   }
  //
  //   const poolData = await client.fetchGlobalPool(pool)
  //   assert.equal(poolData.isActive, true)
  // })
  //
  // it('can add to whitelist', async () => {
  //   const stakePoolKeypair = web3.Keypair.generate()
  //   stakePool = stakePoolKeypair.publicKey
  //   const validatorListKeypair = web3.Keypair.generate()
  //   const [withdrawAuthority] = await web3.PublicKey.findProgramAddress(
  //     [stakePoolKeypair.publicKey.toBuffer(), Buffer.from('withdraw')],
  //     STAKE_POOL_PROGRAM_ID,
  //   )
  //   const stakePoolMint = await createMint(provider.connection, payerKeypair, withdrawAuthority, null, 9, web3.Keypair.generate(), null, TOKEN_PROGRAM_ID)
  //   const reserveKeypair = web3.Keypair.generate()
  //   const reserveAccount = reserveKeypair.publicKey
  //   const managerPoolAccount = await createAssociatedTokenAccount(provider.connection, payerKeypair, stakePoolMint, provider.wallet.publicKey)
  //
  //   const lamportsForStakeAccount
  //     = (await provider.connection.getMinimumBalanceForRentExemption(
  //       web3.StakeProgram.space,
  //     ))
  //
  //   const createAccountTransaction = web3.StakeProgram.createAccount({
  //     fromPubkey: provider.wallet.publicKey,
  //     authorized: new web3.Authorized(
  //       withdrawAuthority,
  //       withdrawAuthority,
  //     ),
  //     lamports: lamportsForStakeAccount + 1,
  //     stakePubkey: reserveAccount,
  //   })
  //   await provider.sendAndConfirm(createAccountTransaction, [payerKeypair, reserveKeypair])
  //
  //   const { instructions, signers } = await initialize({
  //     connection: provider.connection,
  //     fee: { denominator: new BN(0), numerator: new BN(0) },
  //     manager: payerKeypair,
  //     managerPoolAccount,
  //     maxValidators: 2950,
  //     poolMint: stakePoolMint,
  //     referralFee: 0,
  //     reserveStake: reserveAccount,
  //     stakePool: stakePoolKeypair,
  //     validatorList: validatorListKeypair,
  //   })
  //   const transaction = new web3.Transaction().add(...instructions)
  //   transaction.feePayer = provider.wallet.publicKey
  //   try {
  //     await provider.sendAndConfirm(transaction, signers)
  //   } catch (e) {
  //     console.log(e)
  //   }
  //   const { instructions: ixs, signers: sgs } = await depositSol(provider.connection, stakePool, provider.wallet.publicKey, 1000000)
  //   const transaction1 = new web3.Transaction().add(...ixs)
  //   transaction1.feePayer = provider.wallet.publicKey
  //   try {
  //     await provider.sendAndConfirm(transaction1, sgs)
  //   } catch (e) {
  //     console.log(e)
  //   }
  //
  //   const { tx, whitelist } = await client.addToWhitelist({
  //     token: poolMint,
  //     tokenPool: STAKE_POOL_PROGRAM_ID,
  //     stakePool,
  //   })
  //
  //   try {
  //     await provider.sendAndConfirm(tx)
  //   } catch (e) {
  //     console.log(e)
  //     throw e
  //   }
  //
  //   const whitelistData = await client.fetchWhitelist(whitelist)
  //   assert.equal(whitelistData.whitelistedToken.equals(poolMint), true)
  //   assert.equal(whitelistData.pool.equals(STAKE_POOL_PROGRAM_ID), true)
  //   assert.equal(whitelistData.stakingPool.equals(stakePool), true)
  // })
  //
  // it('can remove from whitelist', async () => {
  //   const { tx } = await client.removeFromWhitelist({
  //     token: poolMint,
  //   })
  //
  //   try {
  //     await provider.sendAndConfirm(tx)
  //   } catch (e) {
  //     console.log(e)
  //     throw e
  //   }
  // })
  //
  // it('can deposit lp tokens', async () => {
  //   lpToken = await createMint(provider.connection, payerKeypair, provider.wallet.publicKey, null, 9, web3.Keypair.generate(), undefined, TOKEN_PROGRAM_ID)
  //   const source = await getOrCreateAssociatedTokenAccount(provider.connection, payerKeypair, lpToken, provider.wallet.publicKey)
  //   await mintTo(provider.connection, payerKeypair, lpToken, source.address, provider.wallet.publicKey, 100, [], undefined, TOKEN_PROGRAM_ID)
  //   let sourceBalance = await provider.connection.getTokenAccountBalance(source.address)
  //
  //   const poolKeypair = web3.Keypair.generate()
  //   poolForLP = poolKeypair.publicKey
  //   const [authority] = await client.pda.poolAuthority(poolForLP)
  //   poolForLPAuthority = authority
  //
  //   const { tx: tx1 } = await client.createPool({
  //     oracle,
  //     stakeSource: lpToken,
  //     pool: poolForLP,
  //     mint: poolMint,
  //   })
  //
  //   try {
  //     await provider.sendAndConfirm(tx1, [
  //       poolKeypair,
  //     ])
  //   } catch (e) {
  //     console.log(e)
  //     throw e
  //   }
  //
  //   assert.equal(sourceBalance.value.amount, '100')
  //
  //   const { tx: transaction } = await client.addToWhitelist({
  //     token: lpToken,
  //     tokenPool: new web3.PublicKey('SPoo1Ku8WFXoNDMHPsrGSTSG1Y47rzgn41SLUNakuHy'),
  //     stakePool,
  //   })
  //   try {
  //     await provider.sendAndConfirm(transaction)
  //   } catch (e) {
  //     console.log(e)
  //     throw e
  //   }
  //   const destination = await getOrCreateAssociatedTokenAccount(provider.connection, payerKeypair, lpToken, poolForLPAuthority, true)
  //   let destinationBalance = await provider.connection.getTokenAccountBalance(destination.address)
  //
  //   assert.equal(destinationBalance.value.amount, '0')
  //
  //   const { tx, user, collateral, bump } = await client.depositLPToken({
  //     amount: new BN(100),
  //     destination: destination.address,
  //     lpToken,
  //     source: source.address,
  //     pool: poolForLP,
  //   })
  //
  //   try {
  //     await provider.sendAndConfirm(tx)
  //   } catch (e) {
  //     console.log(e)
  //     throw e
  //   }
  //
  //   sourceBalance = await provider.connection.getTokenAccountBalance(source.address)
  //   destinationBalance = await provider.connection.getTokenAccountBalance(destination.address)
  //
  //   assert.equal(sourceBalance.value.amount, '0')
  //   assert.equal(destinationBalance.value.amount, '100')
  //
  //   const poolData = await client.fetchGlobalPool(poolForLP)
  //   const userData = await client.fetchUser(user)
  //   const collateralData = await client.fetchCollateral(collateral)
  //
  //   assert.equal(poolData.depositAmount, 100)
  //   assert.equal(userData.wallet.equals(provider.wallet.publicKey), true)
  //   assert.equal(userData.rate, 100)
  //   assert.equal(userData.isBlocked, false)
  //   assert.equal(userData.lastWithdrawIndex, 0)
  //   assert.equal(userData.requestsAmount, 0)
  //   assert.equal(collateralData.user.equals(user), true)
  //   assert.equal(collateralData.pool.equals(poolForLP), true)
  //   assert.equal(collateralData.bump, bump)
  //   assert.equal(collateralData.amount, 0)
  //   assert.equal(collateralData.delegationStake, 100)
  //   assert.equal(collateralData.liquidatedAmount, 0)
  //   assert.equal(collateralData.isNative, false)
  //   assert.equal(collateralData.sourceStake.equals(lpToken), true)
  // })
  //
  // it('can deposit lp tokens twice', async () => {
  //   const source = await getOrCreateAssociatedTokenAccount(provider.connection, payerKeypair, lpToken, provider.wallet.publicKey)
  //   await mintTo(provider.connection, payerKeypair, lpToken, source.address, provider.wallet.publicKey, 100, [], undefined, TOKEN_PROGRAM_ID)
  //   const destination = await getOrCreateAssociatedTokenAccount(provider.connection, payerKeypair, lpToken, poolForLPAuthority, true)
  //   let sourceBalance = await provider.connection.getTokenAccountBalance(source.address)
  //   let destinationBalance = await provider.connection.getTokenAccountBalance(destination.address)
  //
  //   assert.equal(sourceBalance.value.amount, '100')
  //   assert.equal(destinationBalance.value.amount, '100')
  //
  //   const { tx, user, collateral, bump } = await client.depositLPToken({
  //     amount: new BN(100),
  //     destination: destination.address,
  //     lpToken,
  //     source: source.address,
  //     pool: poolForLP,
  //   })
  //
  //   try {
  //     await provider.sendAndConfirm(tx)
  //   } catch (e) {
  //     console.log(e)
  //     throw e
  //   }
  //
  //   sourceBalance = await provider.connection.getTokenAccountBalance(source.address)
  //   destinationBalance = await provider.connection.getTokenAccountBalance(destination.address)
  //
  //   assert.equal(sourceBalance.value.amount, '0')
  //   assert.equal(destinationBalance.value.amount, '200')
  //
  //   const poolData = await client.fetchGlobalPool(poolForLP)
  //   const userData = await client.fetchUser(user)
  //   const collateralData = await client.fetchCollateral(collateral)
  //
  //   assert.equal(poolData.depositAmount, 200)
  //   assert.equal(userData.wallet.equals(provider.wallet.publicKey), true)
  //   assert.equal(userData.rate, 200)
  //   assert.equal(userData.isBlocked, false)
  //   assert.equal(collateralData.user.equals(user), true)
  //   assert.equal(collateralData.pool.equals(poolForLP), true)
  //   assert.equal(collateralData.bump, bump)
  //   assert.equal(collateralData.amount, 0)
  //   assert.equal(collateralData.delegationStake, 200)
  //   assert.equal(collateralData.liquidatedAmount, 0)
  //   assert.equal(collateralData.isNative, false)
  //   assert.equal(collateralData.sourceStake.equals(lpToken), true)
  // })
  //
  // it('can not deposit non-whitelisted tokens', async () => {
  //   const someToken = await createMint(provider.connection, payerKeypair, provider.wallet.publicKey, null, 1, web3.Keypair.generate(), undefined, TOKEN_PROGRAM_ID)
  //   const source = await getOrCreateAssociatedTokenAccount(provider.connection, payerKeypair, someToken, provider.wallet.publicKey)
  //   await mintTo(provider.connection, payerKeypair, someToken, source.address, provider.wallet.publicKey, 100, [], undefined, TOKEN_PROGRAM_ID)
  //   const destination = await getOrCreateAssociatedTokenAccount(provider.connection, payerKeypair, someToken, poolForLPAuthority, true)
  //   const { tx } = await client.depositLPToken({
  //     amount: new BN(100),
  //     destination: destination.address,
  //     lpToken: someToken,
  //     source: source.address,
  //     pool: poolForLP,
  //   })
  //
  //   try {
  //     await provider.sendAndConfirm(tx)
  //     assert.ok(false)
  //   } catch (e: any) {
  //     assertErrorCode(e, '')
  //   }
  // })
  //
  // it('can block user', async () => {
  //   const { tx, user } = await client.blockUser({
  //     userWallet: provider.wallet.publicKey,
  //   })
  //
  //   try {
  //     await provider.sendAndConfirm(tx)
  //   } catch (e) {
  //     console.log(e)
  //     throw e
  //   }
  //
  //   const userData = await client.fetchUser(user)
  //   assert.equal(userData.isBlocked, true)
  // })
  //
  // it('can not deposit if user blocked', async () => {
  //   const source = await getOrCreateAssociatedTokenAccount(provider.connection, payerKeypair, lpToken, provider.wallet.publicKey)
  //   await mintTo(provider.connection, payerKeypair, lpToken, source.address, provider.wallet.publicKey, 100, [], undefined, TOKEN_PROGRAM_ID)
  //   const destination = await getOrCreateAssociatedTokenAccount(provider.connection, payerKeypair, lpToken, poolForLPAuthority, true)
  //   const { tx } = await client.depositLPToken({
  //     amount: new BN(100),
  //     destination: destination.address,
  //     lpToken,
  //     source: source.address,
  //     pool: poolForLP,
  //   })
  //
  //   try {
  //     await provider.sendAndConfirm(tx)
  //     assert.ok(false)
  //   } catch (e: any) {
  //     assertErrorCode(e, 'UserBlocked')
  //   }
  // })
  //
  // it('can unblock user', async () => {
  //   const { tx, user } = await client.unblockUser({
  //     userWallet: provider.wallet.publicKey,
  //   })
  //
  //   try {
  //     await provider.sendAndConfirm(tx)
  //   } catch (e) {
  //     console.log(e)
  //     throw e
  //   }
  //
  //   const userData = await client.fetchUser(user)
  //   assert.equal(userData.isBlocked, false)
  // })
  //
  // it('can not deposit if amount is 0', async () => {
  //   const source = await getOrCreateAssociatedTokenAccount(provider.connection, payerKeypair, lpToken, provider.wallet.publicKey)
  //   const destination = await getOrCreateAssociatedTokenAccount(provider.connection, payerKeypair, lpToken, poolForLPAuthority, true)
  //   const { tx } = await client.depositLPToken({
  //     amount: new BN(0),
  //     destination: destination.address,
  //     lpToken,
  //     source: source.address,
  //     pool: poolForLP,
  //   })
  //
  //   try {
  //     await provider.sendAndConfirm(tx)
  //     assert.ok(false)
  //   } catch (e: any) {
  //     assertErrorCode(e, 'InsufficientAmount')
  //   }
  // })
  //
  // it('can not deposit if pool paused', async () => {
  //   const source = await getOrCreateAssociatedTokenAccount(provider.connection, payerKeypair, lpToken, provider.wallet.publicKey)
  //   await mintTo(provider.connection, payerKeypair, lpToken, source.address, provider.wallet.publicKey, 100, [], undefined, TOKEN_PROGRAM_ID)
  //   const destination = await getOrCreateAssociatedTokenAccount(provider.connection, payerKeypair, lpToken, poolForLPAuthority, true)
  //   const { tx } = await client.depositLPToken({
  //     amount: new BN(100),
  //     destination: destination.address,
  //     lpToken,
  //     source: source.address,
  //     pool: poolForLP,
  //   })
  //
  //   const { tx: tx1 } = await client.pausePool({
  //     pool: poolForLP,
  //   })
  //
  //   try {
  //     await provider.sendAndConfirm(tx1)
  //   } catch (e) {
  //     console.log(e)
  //     throw e
  //   }
  //
  //   try {
  //     await provider.sendAndConfirm(tx)
  //     assert.ok(false)
  //   } catch (e: any) {
  //     assertErrorCode(e, 'PoolAlreadyPaused')
  //   }
  //
  //   const { tx: tx2 } = await client.resumePool({
  //     pool: poolForLP,
  //   })
  //
  //   try {
  //     await provider.sendAndConfirm(tx2)
  //   } catch (e) {
  //     console.log(e)
  //     throw e
  //   }
  // })
  //
  // it('can deposit stake', async () => {
  //   const stakeKeypair = web3.Keypair.generate()
  //   stakeAccount = stakeKeypair.publicKey
  //
  //   const lamportsForStakeAccount
  //     = (await provider.connection.getMinimumBalanceForRentExemption(
  //       web3.StakeProgram.space,
  //     ))
  //
  //   const createAccountTransaction = web3.StakeProgram.createAccount({
  //     fromPubkey: provider.wallet.publicKey,
  //     authorized: new web3.Authorized(
  //       provider.wallet.publicKey,
  //       provider.wallet.publicKey,
  //     ),
  //     lamports: lamportsForStakeAccount + 10 * web3.LAMPORTS_PER_SOL,
  //     lockup: new web3.Lockup(0, 0, provider.wallet.publicKey),
  //     stakePubkey: stakeAccount,
  //   })
  //   await provider.sendAndConfirm(createAccountTransaction, [payerKeypair, stakeKeypair])
  //
  //   const validators = await provider.connection.getVoteAccounts()
  //   const selectedValidator = validators.current[0]
  //   const selectedValidatorPubkey = new web3.PublicKey(selectedValidator.votePubkey)
  //
  //   const delegateTransaction = web3.StakeProgram.delegate({
  //     stakePubkey: stakeAccount,
  //     authorizedPubkey: provider.wallet.publicKey,
  //     votePubkey: selectedValidatorPubkey,
  //   })
  //
  //   await provider.sendAndConfirm(delegateTransaction, [payerKeypair, payerKeypair])
  //
  //   const splitKeypair = web3.Keypair.generate()
  //   const splitStake = splitKeypair.publicKey
  //
  //   const { transaction, user, collateral, bump } = await client.depositStake({
  //     delegatedStake: stakeAccount,
  //     amount: new BN(10 * web3.LAMPORTS_PER_SOL),
  //     splitStake,
  //     sourceStake: stakeAccount,
  //     pool,
  //   })
  //
  //   try {
  //     await provider.sendAndConfirm(transaction, [splitKeypair, payerKeypair])
  //   } catch (e) {
  //     console.log(e)
  //     throw e
  //   }
  //
  //   const poolData = await client.fetchGlobalPool(pool)
  //   const userData = await client.fetchUser(user)
  //   const collateralData = await client.fetchCollateral(collateral)
  //
  //   assert.equal(poolData.depositAmount.toString(), '10000000000')
  //   assert.equal(userData.wallet.equals(provider.wallet.publicKey), true)
  //   assert.equal(userData.rate.toString(), '10000000200')
  //   assert.equal(userData.isBlocked, false)
  //   assert.equal(collateralData.user.equals(user), true)
  //   assert.equal(collateralData.pool.equals(pool), true)
  //   assert.equal(collateralData.bump, bump)
  //   assert.equal(collateralData.amount, 0)
  //   assert.equal(collateralData.delegationStake.toString(), '10000000000')
  //   assert.equal(collateralData.liquidatedAmount.toString(), '0')
  //   assert.equal(collateralData.isNative, true)
  //   assert.equal(collateralData.sourceStake.equals(stakeAccount), true)
  //
  //   const withdrawTransaction = web3.StakeProgram.withdraw({
  //     stakePubkey: stakeAccount,
  //     authorizedPubkey: provider.wallet.publicKey,
  //     toPubkey: provider.wallet.publicKey,
  //     lamports: lamportsForStakeAccount + 10 * web3.LAMPORTS_PER_SOL,
  //   })
  //
  //   try {
  //     await provider.sendAndConfirm(withdrawTransaction, [payerKeypair, stakeKeypair])
  //     assert.ok(false)
  //   } catch (e: any) {
  //     assert.ok(true)
  //   }
  // })
  //
  // it('can not deposit stake if it is not delegated', async () => {
  //   const stakeKeypair = web3.Keypair.generate()
  //   const stake = stakeKeypair.publicKey
  //
  //   const lamportsForStakeAccount
  //     = (await provider.connection.getMinimumBalanceForRentExemption(
  //       web3.StakeProgram.space,
  //     ))
  //
  //   const createAccountTransaction = web3.StakeProgram.createAccount({
  //     fromPubkey: provider.wallet.publicKey,
  //     authorized: new web3.Authorized(
  //       provider.wallet.publicKey,
  //       provider.wallet.publicKey,
  //     ),
  //     lamports: lamportsForStakeAccount + 10 * web3.LAMPORTS_PER_SOL,
  //     lockup: new web3.Lockup(0, 0, provider.wallet.publicKey),
  //     stakePubkey: stake,
  //   })
  //   await provider.sendAndConfirm(createAccountTransaction, [payerKeypair, stakeKeypair])
  //
  //   const splitKeypair = web3.Keypair.generate()
  //   const splitStake = splitKeypair.publicKey
  //
  //   const { transaction } = await client.depositStake({
  //     delegatedStake: stake,
  //     amount: new BN(10 * web3.LAMPORTS_PER_SOL),
  //     splitStake,
  //     sourceStake: stake,
  //     pool,
  //   })
  //
  //   try {
  //     await provider.sendAndConfirm(transaction, [splitKeypair])
  //     assert.ok(false)
  //   } catch (e: any) {
  //     assertErrorCode(e, '')
  //   }
  // })
  //
  // it('can not deposit stake if pool paused', async () => {
  //   const stakeKeypair = web3.Keypair.generate()
  //   const stake = stakeKeypair.publicKey
  //
  //   const lamportsForStakeAccount
  //     = (await provider.connection.getMinimumBalanceForRentExemption(
  //       web3.StakeProgram.space,
  //     ))
  //
  //   const createAccountTransaction = web3.StakeProgram.createAccount({
  //     fromPubkey: provider.wallet.publicKey,
  //     authorized: new web3.Authorized(
  //       provider.wallet.publicKey,
  //       provider.wallet.publicKey,
  //     ),
  //     lamports: lamportsForStakeAccount + 10 * web3.LAMPORTS_PER_SOL,
  //     lockup: new web3.Lockup(0, 0, provider.wallet.publicKey),
  //     stakePubkey: stake,
  //   })
  //   await provider.sendAndConfirm(createAccountTransaction, [payerKeypair, stakeKeypair])
  //
  //   const validators = await provider.connection.getVoteAccounts()
  //   const selectedValidator = validators.current[0]
  //   const selectedValidatorPubkey = new web3.PublicKey(selectedValidator.votePubkey)
  //
  //   const delegateTransaction = web3.StakeProgram.delegate({
  //     stakePubkey: stake,
  //     authorizedPubkey: provider.wallet.publicKey,
  //     votePubkey: selectedValidatorPubkey,
  //   })
  //
  //   await provider.sendAndConfirm(delegateTransaction, [payerKeypair, payerKeypair])
  //
  //   const { tx: tx1 } = await client.pausePool({
  //     pool,
  //   })
  //
  //   try {
  //     await provider.sendAndConfirm(tx1)
  //   } catch (e) {
  //     console.log(e)
  //     throw e
  //   }
  //
  //   const splitKeypair = web3.Keypair.generate()
  //   const splitStake = splitKeypair.publicKey
  //
  //   const { transaction } = await client.depositStake({
  //     delegatedStake: stake,
  //     amount: new BN(10 * web3.LAMPORTS_PER_SOL),
  //     splitStake,
  //     sourceStake: stake,
  //     pool,
  //   })
  //
  //   try {
  //     await provider.sendAndConfirm(transaction, [splitKeypair])
  //     assert.ok(false)
  //   } catch (e: any) {
  //     assertErrorCode(e, 'PoolAlreadyPaused')
  //   }
  //
  //   const { tx: tx2 } = await client.resumePool({
  //     pool,
  //   })
  //
  //   try {
  //     await provider.sendAndConfirm(tx2)
  //   } catch (e) {
  //     console.log(e)
  //     throw e
  //   }
  // })
  //
  // it('can mint omnisol from stake collateral', async () => {
  //   // await new Promise(f => setTimeout(f, 10000))
  //   const userPoolToken = await getOrCreateAssociatedTokenAccount(provider.connection, payerKeypair, poolMint, provider.wallet.publicKey)
  //   let userPoolBalance = await provider.connection.getTokenAccountBalance(userPoolToken.address)
  //
  //   assert.equal(userPoolBalance.value.amount, '0')
  //
  //   const { transaction, user, collateral } = await client.mintOmnisol({
  //     amount: new BN(10000000000),
  //     pool,
  //     poolMint,
  //     stakedAddress: stakeAccount,
  //     userPoolToken: userPoolToken.address,
  //   })
  //
  //   try {
  //     await provider.sendAndConfirm(transaction)
  //   } catch (e) {
  //     console.log(e)
  //     throw e
  //   }
  //
  //   userPoolBalance = await provider.connection.getTokenAccountBalance(userPoolToken.address)
  //
  //   assert.equal(userPoolBalance.value.amount, '10000000000')
  //
  //   const poolData = await client.fetchGlobalPool(pool)
  //   const userData = await client.fetchUser(user)
  //   const collateralData = await client.fetchCollateral(collateral)
  //
  //   assert.equal(poolData.depositAmount.toString(), '10000000000')
  //   assert.equal(userData.rate.toString(), '200')
  //   assert.equal(collateralData.amount.toString(), '10000000000')
  //   assert.equal(collateralData.delegationStake.toString(), '10000000000')
  // })
  //
  // it('can mint omnisol from lp collateral', async () => {
  //   const userPoolToken = await getOrCreateAssociatedTokenAccount(provider.connection, payerKeypair, poolMint, provider.wallet.publicKey)
  //   let userPoolBalance = await provider.connection.getTokenAccountBalance(userPoolToken.address)
  //
  //   assert.equal(userPoolBalance.value.amount, '10000000000')
  //
  //   const { transaction, user, collateral } = await client.mintOmnisol({
  //     amount: new BN(100),
  //     pool: poolForLP,
  //     poolMint,
  //     stakedAddress: lpToken,
  //     userPoolToken: userPoolToken.address,
  //   })
  //
  //   try {
  //     await provider.sendAndConfirm(transaction)
  //   } catch (e) {
  //     console.log(e)
  //     throw e
  //   }
  //
  //   userPoolBalance = await provider.connection.getTokenAccountBalance(userPoolToken.address)
  //
  //   assert.equal(userPoolBalance.value.amount, '10000000100')
  //
  //   const poolData = await client.fetchGlobalPool(poolForLP)
  //   const userData = await client.fetchUser(user)
  //   const collateralData = await client.fetchCollateral(collateral)
  //
  //   assert.equal(poolData.depositAmount.toString(), '200')
  //   assert.equal(userData.rate.toString(), '100')
  //   assert.equal(collateralData.amount.toString(), '100')
  //   assert.equal(collateralData.delegationStake.toString(), '200')
  // })
  //
  // it('can not mint greater than was delegated', async () => {
  //   const userPoolToken = await getOrCreateAssociatedTokenAccount(provider.connection, payerKeypair, poolMint, provider.wallet.publicKey)
  //   const { transaction } = await client.mintOmnisol({
  //     amount: new BN(101),
  //     pool: poolForLP,
  //     poolMint,
  //     stakedAddress: lpToken,
  //     userPoolToken: userPoolToken.address,
  //   })
  //
  //   try {
  //     await provider.sendAndConfirm(transaction)
  //     assert.ok(false)
  //   } catch (e: any) {
  //     assertErrorCode(e, 'InsufficientAmount')
  //   }
  // })
  //
  // it('can not mint when pool paused', async () => {
  //   const userPoolToken = await getOrCreateAssociatedTokenAccount(provider.connection, payerKeypair, poolMint, provider.wallet.publicKey)
  //   const { transaction } = await client.mintOmnisol({
  //     amount: new BN(100),
  //     pool: poolForLP,
  //     poolMint,
  //     stakedAddress: lpToken,
  //     userPoolToken: userPoolToken.address,
  //   })
  //
  //   const { tx: tx1 } = await client.pausePool({
  //     pool: poolForLP,
  //   })
  //
  //   try {
  //     await provider.sendAndConfirm(tx1)
  //   } catch (e) {
  //     console.log(e)
  //     throw e
  //   }
  //
  //   try {
  //     await provider.sendAndConfirm(transaction)
  //     assert.ok(false)
  //   } catch (e: any) {
  //     assertErrorCode(e, 'PoolAlreadyPaused')
  //   }
  //
  //   const { tx: tx2 } = await client.resumePool({
  //     pool: poolForLP,
  //   })
  //
  //   try {
  //     await provider.sendAndConfirm(tx2)
  //   } catch (e) {
  //     console.log(e)
  //     throw e
  //   }
  // })
  //
  // it('can not mint when user blocked', async () => {
  //   const userPoolToken = await getOrCreateAssociatedTokenAccount(provider.connection, payerKeypair, poolMint, provider.wallet.publicKey)
  //   const { transaction } = await client.mintOmnisol({
  //     amount: new BN(100),
  //     pool: poolForLP,
  //     poolMint,
  //     stakedAddress: lpToken,
  //     userPoolToken: userPoolToken.address,
  //   })
  //
  //   const { tx } = await client.blockUser({
  //     userWallet: provider.wallet.publicKey,
  //   })
  //
  //   try {
  //     await provider.sendAndConfirm(tx)
  //   } catch (e) {
  //     console.log(e)
  //     throw e
  //   }
  //
  //   try {
  //     await provider.sendAndConfirm(transaction)
  //     assert.ok(false)
  //   } catch (e: any) {
  //     assertErrorCode(e, 'UserBlocked')
  //   }
  //
  //   const { tx: tx1 } = await client.unblockUser({
  //     userWallet: provider.wallet.publicKey,
  //   })
  //
  //   try {
  //     await provider.sendAndConfirm(tx1)
  //   } catch (e) {
  //     console.log(e)
  //     throw e
  //   }
  // })
  //
  // it('can withdraw lp tokens', async () => {
  //   const userPoolToken = await getOrCreateAssociatedTokenAccount(provider.connection, payerKeypair, poolMint, provider.wallet.publicKey)
  //   let userPoolBalance = await provider.connection.getTokenAccountBalance(userPoolToken.address)
  //
  //   assert.equal(userPoolBalance.value.amount, '10000000100')
  //
  //   const destination = await getOrCreateAssociatedTokenAccount(provider.connection, payerKeypair, lpToken, provider.wallet.publicKey)
  //   let destinationBalance = await provider.connection.getTokenAccountBalance(destination.address)
  //
  //   assert.equal(destinationBalance.value.amount, '200')
  //
  //   const source = await getOrCreateAssociatedTokenAccount(provider.connection, payerKeypair, lpToken, poolForLPAuthority, true)
  //   let sourceBalance = await provider.connection.getTokenAccountBalance(source.address)
  //
  //   assert.equal(sourceBalance.value.amount, '200')
  //
  //   const { transaction, user, collateral } = await client.withdrawLPTokens({
  //     amount: new BN(50),
  //     destination: destination.address,
  //     lpToken,
  //     pool: poolForLP,
  //     poolMint,
  //     source: source.address,
  //     userPoolToken: userPoolToken.address,
  //     withBurn: true,
  //   })
  //
  //   try {
  //     await provider.sendAndConfirm(transaction)
  //   } catch (e) {
  //     console.log(e)
  //     throw e
  //   }
  //
  //   sourceBalance = await provider.connection.getTokenAccountBalance(source.address)
  //   destinationBalance = await provider.connection.getTokenAccountBalance(destination.address)
  //   userPoolBalance = await provider.connection.getTokenAccountBalance(userPoolToken.address)
  //
  //   assert.equal(sourceBalance.value.amount, '150')
  //   assert.equal(destinationBalance.value.amount, '250')
  //   assert.equal(userPoolBalance.value.amount, '10000000050')
  //
  //   const poolData = await client.fetchGlobalPool(poolForLP)
  //   const userData = await client.fetchUser(user)
  //   const collateralData = await client.fetchCollateral(collateral)
  //
  //   assert.equal(poolData.depositAmount.toString(), '150')
  //   assert.equal(userData.rate.toString(), '100')
  //   assert.equal(collateralData.amount, 50)
  //   assert.equal(collateralData.delegationStake, 150)
  //   assert.equal(collateralData.liquidatedAmount, 0)
  // })
  //
  // it('can not withdraw stake if pool paused', async () => {
  //   const userPoolToken = await getOrCreateAssociatedTokenAccount(provider.connection, payerKeypair, poolMint, provider.wallet.publicKey)
  //
  //   const splitKeypair = web3.Keypair.generate()
  //   const splitAccount = splitKeypair.publicKey
  //
  //   const { tx } = await client.pausePool({
  //     pool,
  //   })
  //
  //   try {
  //     await provider.sendAndConfirm(tx)
  //   } catch (e) {
  //     console.log(e)
  //     throw e
  //   }
  //
  //   const { transaction } = await client.withdrawStake({
  //     withMerge: false,
  //     delegatedStake: stakeAccount,
  //     stakeHistory: web3.SYSVAR_STAKE_HISTORY_PUBKEY,
  //     amount: new BN(10000000000),
  //     pool,
  //     poolMint,
  //     splitStake: splitAccount,
  //     stakeAccount,
  //     stakeProgram: web3.StakeProgram.programId,
  //     userPoolToken: userPoolToken.address,
  //     withBurn: true,
  //   })
  //
  //   try {
  //     await provider.sendAndConfirm(transaction, [payerKeypair, splitKeypair])
  //     assert.ok(false)
  //   } catch (e: any) {
  //     assertErrorCode(e, 'PoolAlreadyPaused')
  //   }
  //
  //   const { tx: tx1 } = await client.resumePool({
  //     pool,
  //   })
  //
  //   try {
  //     await provider.sendAndConfirm(tx1)
  //   } catch (e) {
  //     console.log(e)
  //     throw e
  //   }
  // })
  //
  // it('can not withdraw stake if user blocked', async () => {
  //   const userPoolToken = await getOrCreateAssociatedTokenAccount(provider.connection, payerKeypair, poolMint, provider.wallet.publicKey)
  //
  //   const splitKeypair = web3.Keypair.generate()
  //   const splitAccount = splitKeypair.publicKey
  //
  //   const { tx } = await client.blockUser({
  //     userWallet: provider.wallet.publicKey,
  //   })
  //
  //   try {
  //     await provider.sendAndConfirm(tx)
  //   } catch (e) {
  //     console.log(e)
  //     throw e
  //   }
  //
  //   const { transaction } = await client.withdrawStake({
  //     withMerge: false,
  //     delegatedStake: stakeAccount,
  //     stakeHistory: web3.SYSVAR_STAKE_HISTORY_PUBKEY,
  //     amount: new BN(10000000000),
  //     pool,
  //     poolMint,
  //     splitStake: splitAccount,
  //     stakeAccount,
  //     stakeProgram: web3.StakeProgram.programId,
  //     userPoolToken: userPoolToken.address,
  //     withBurn: true,
  //   })
  //
  //   try {
  //     await provider.sendAndConfirm(transaction, [payerKeypair, splitKeypair])
  //     assert.ok(false)
  //   } catch (e: any) {
  //     assertErrorCode(e, 'UserBlocked')
  //   }
  //
  //   const { tx: tx1 } = await client.unblockUser({
  //     userWallet: provider.wallet.publicKey,
  //   })
  //
  //   try {
  //     await provider.sendAndConfirm(tx1)
  //   } catch (e) {
  //     console.log(e)
  //     throw e
  //   }
  // })
  //
  // it('can not withdraw stake more than user can', async () => {
  //   const userPoolToken = await getOrCreateAssociatedTokenAccount(provider.connection, payerKeypair, poolMint, provider.wallet.publicKey)
  //
  //   const splitKeypair = web3.Keypair.generate()
  //   const splitAccount = splitKeypair.publicKey
  //
  //   const { transaction } = await client.withdrawStake({
  //     withMerge: false,
  //     delegatedStake: stakeAccount,
  //     stakeHistory: web3.SYSVAR_STAKE_HISTORY_PUBKEY,
  //     amount: new BN(10000000001),
  //     pool,
  //     poolMint,
  //     splitStake: splitAccount,
  //     stakeAccount,
  //     stakeProgram: web3.StakeProgram.programId,
  //     userPoolToken: userPoolToken.address,
  //     withBurn: true,
  //   })
  //
  //   try {
  //     await provider.sendAndConfirm(transaction, [payerKeypair, splitKeypair])
  //     assert.ok(false)
  //   } catch (e: any) {
  //     assertErrorCode(e, 'InsufficientAmount')
  //   }
  // })
  //
  // it('can withdraw split stake', async () => {
  //   const userPoolToken = await getOrCreateAssociatedTokenAccount(provider.connection, payerKeypair, poolMint, provider.wallet.publicKey)
  //   let userPoolBalance = await provider.connection.getTokenAccountBalance(userPoolToken.address)
  //
  //   assert.equal(userPoolBalance.value.amount, '10000000050')
  //
  //   const splitKeypair = web3.Keypair.generate()
  //   splitAccount = splitKeypair.publicKey
  //
  //   const { transaction, user, collateral } = await client.withdrawStake({
  //     withMerge: false,
  //     delegatedStake: stakeAccount,
  //     stakeHistory: web3.SYSVAR_STAKE_HISTORY_PUBKEY,
  //     amount: new BN(5000000000),
  //     pool,
  //     poolMint,
  //     splitStake: splitAccount,
  //     stakeAccount,
  //     stakeProgram: web3.StakeProgram.programId,
  //     userPoolToken: userPoolToken.address,
  //     withBurn: true,
  //   })
  //
  //   try {
  //     await provider.sendAndConfirm(transaction, [payerKeypair, splitKeypair])
  //   } catch (e) {
  //     console.log(e)
  //     throw e
  //   }
  //
  //   userPoolBalance = await provider.connection.getTokenAccountBalance(userPoolToken.address)
  //
  //   assert.equal(userPoolBalance.value.amount, '5000000050')
  //
  //   const poolData = await client.fetchGlobalPool(pool)
  //   const userData = await client.fetchUser(user)
  //   const collateralData = await client.fetchCollateral(collateral)
  //
  //   assert.equal(poolData.depositAmount.toString(), '5000000000')
  //   assert.equal(userData.rate.toString(), '100')
  //   assert.equal(collateralData.amount.toString(), '5000000000')
  //   assert.equal(collateralData.delegationStake.toString(), '5000000000')
  //   assert.equal(collateralData.liquidatedAmount, 0)
  //   assert.equal(collateralData.sourceStake.equals(stakeAccount), true)
  //   assert.equal(collateralData.delegatedStake.equals(stakeAccount), true)
  // })
  //
  // it('can not withdraw stake without burn more than user can', async () => {
  //   const userPoolToken = await getOrCreateAssociatedTokenAccount(provider.connection, payerKeypair, poolMint, provider.wallet.publicKey)
  //
  //   const splitKeypair = web3.Keypair.generate()
  //   const splitStakeAccount = splitKeypair.publicKey
  //
  //   const { transaction } = await client.withdrawStake({
  //     delegatedStake: stakeAccount,
  //     stakeHistory: web3.SYSVAR_STAKE_HISTORY_PUBKEY,
  //     amount: new BN(5000000000),
  //     pool,
  //     poolMint,
  //     splitStake: splitStakeAccount,
  //     stakeAccount,
  //     stakeProgram: web3.StakeProgram.programId,
  //     userPoolToken: userPoolToken.address,
  //     mergableStake: splitAccount,
  //     withBurn: false,
  //     withMerge: true,
  //   })
  //
  //   try {
  //     await provider.sendAndConfirm(transaction, [payerKeypair, splitKeypair])
  //     assert.ok(false)
  //   } catch (e: any) {
  //     assertErrorCode(e, 'InsufficientAmount')
  //   }
  // })
  //
  // it('can withdraw stake', async () => {
  //   const userPoolToken = await getOrCreateAssociatedTokenAccount(provider.connection, payerKeypair, poolMint, provider.wallet.publicKey)
  //   let userPoolBalance = await provider.connection.getTokenAccountBalance(userPoolToken.address)
  //
  //   assert.equal(userPoolBalance.value.amount, '5000000050')
  //
  //   const splitKeypair = web3.Keypair.generate()
  //   const splitStakeAccount = splitKeypair.publicKey
  //
  //   const { transaction, user, collateral } = await client.withdrawStake({
  //     withMerge: true,
  //     delegatedStake: stakeAccount,
  //     stakeHistory: web3.SYSVAR_STAKE_HISTORY_PUBKEY,
  //     amount: new BN(5000000000),
  //     pool,
  //     poolMint,
  //     splitStake: splitStakeAccount,
  //     stakeAccount,
  //     stakeProgram: web3.StakeProgram.programId,
  //     userPoolToken: userPoolToken.address,
  //     mergableStake: splitAccount,
  //     withBurn: true,
  //   })
  //
  //   stakeAccount = splitAccount
  //
  //   try {
  //     await provider.sendAndConfirm(transaction, [splitKeypair])
  //   } catch (e) {
  //     console.log(e)
  //     throw e
  //   }
  //
  //   userPoolBalance = await provider.connection.getTokenAccountBalance(userPoolToken.address)
  //
  //   assert.equal(userPoolBalance.value.amount, '50')
  //
  //   const poolData = await client.fetchGlobalPool(pool)
  //   const userData = await client.fetchUser(user)
  //   const collateralData = await client.fetchCollateral(collateral)
  //
  //   assert.equal(poolData.depositAmount.toString(), '0')
  //   assert.equal(userData.rate.toString(), '100')
  //   assert.equal(collateralData, null)
  // })
  //
  // it('can withdraw stake without burn', async () => {
  //   const splitStakeKeypair = web3.Keypair.generate()
  //   const splitStake = splitStakeKeypair.publicKey
  //
  //   const { transaction } = await client.depositStake({
  //     delegatedStake: splitStake,
  //     amount: new BN(5000000000),
  //     splitStake,
  //     sourceStake: stakeAccount,
  //     pool,
  //   })
  //
  //   try {
  //     await provider.sendAndConfirm(transaction, [splitStakeKeypair])
  //   } catch (e) {
  //     console.log(e)
  //     throw e
  //   }
  //
  //   const userPoolToken = await getOrCreateAssociatedTokenAccount(provider.connection, payerKeypair, poolMint, provider.wallet.publicKey)
  //   let userPoolBalance = await provider.connection.getTokenAccountBalance(userPoolToken.address)
  //
  //   assert.equal(userPoolBalance.value.amount, '50')
  //
  //   const splitKeypair = web3.Keypair.generate()
  //   const splitStakeAccount = splitKeypair.publicKey
  //
  //   const { transaction: tx, user, collateral } = await client.withdrawStake({
  //     withMerge: true,
  //     delegatedStake: splitStake,
  //     mergableStake: stakeAccount,
  //     stakeHistory: web3.SYSVAR_STAKE_HISTORY_PUBKEY,
  //     amount: new BN(5000000000),
  //     pool,
  //     poolMint,
  //     splitStake: splitStakeAccount,
  //     stakeAccount,
  //     stakeProgram: web3.StakeProgram.programId,
  //     userPoolToken: userPoolToken.address,
  //     withBurn: false,
  //   })
  //
  //   try {
  //     await provider.sendAndConfirm(tx, [splitKeypair])
  //   } catch (e) {
  //     console.log(e)
  //     throw e
  //   }
  //
  //   userPoolBalance = await provider.connection.getTokenAccountBalance(userPoolToken.address)
  //
  //   assert.equal(userPoolBalance.value.amount, '50')
  //
  //   const poolData = await client.fetchGlobalPool(pool)
  //   const userData = await client.fetchUser(user)
  //   const collateralData = await client.fetchCollateral(collateral)
  //
  //   assert.equal(poolData.depositAmount.toString(), '0')
  //   assert.equal(userData.rate.toString(), '100')
  //   assert.equal(collateralData, null)
  // })
  //
  // it('can withdraw split stake of delegated split', async () => {
  //   const splitStakeKeypair = web3.Keypair.generate()
  //   const splitStake = splitStakeKeypair.publicKey
  //
  //   const { transaction } = await client.depositStake({
  //     delegatedStake: splitStake,
  //     amount: new BN(5000000000),
  //     splitStake,
  //     sourceStake: stakeAccount,
  //     pool,
  //   })
  //
  //   try {
  //     await provider.sendAndConfirm(transaction, [splitStakeKeypair])
  //   } catch (e) {
  //     console.log(e)
  //     throw e
  //   }
  //
  //   const userPoolToken = await getOrCreateAssociatedTokenAccount(provider.connection, payerKeypair, poolMint, provider.wallet.publicKey)
  //   let userPoolBalance = await provider.connection.getTokenAccountBalance(userPoolToken.address)
  //
  //   assert.equal(userPoolBalance.value.amount, '50')
  //
  //   const splitKeypair = web3.Keypair.generate()
  //   const splitStakeAccount = splitKeypair.publicKey
  //
  //   const { transaction: tx } = await client.withdrawStake({
  //     withMerge: true,
  //     delegatedStake: splitStake,
  //     mergableStake: stakeAccount,
  //     stakeHistory: web3.SYSVAR_STAKE_HISTORY_PUBKEY,
  //     amount: new BN(2500000000),
  //     pool,
  //     poolMint,
  //     splitStake: splitStakeAccount,
  //     stakeAccount,
  //     stakeProgram: web3.StakeProgram.programId,
  //     userPoolToken: userPoolToken.address,
  //     withBurn: false,
  //   })
  //
  //   try {
  //     await provider.sendAndConfirm(tx, [splitKeypair])
  //   } catch (e) {
  //     console.log(e)
  //     throw e
  //   }
  //
  //   const splitKeypair1 = web3.Keypair.generate()
  //   const splitStakeAccount1 = splitKeypair1.publicKey
  //
  //   const { transaction: tx1, user, collateral } = await client.withdrawStake({
  //     withMerge: true,
  //     delegatedStake: splitStake,
  //     mergableStake: stakeAccount,
  //     stakeHistory: web3.SYSVAR_STAKE_HISTORY_PUBKEY,
  //     amount: new BN(2500000000),
  //     pool,
  //     poolMint,
  //     splitStake: splitStakeAccount1,
  //     stakeAccount,
  //     stakeProgram: web3.StakeProgram.programId,
  //     userPoolToken: userPoolToken.address,
  //     withBurn: false,
  //   })
  //
  //   try {
  //     await provider.sendAndConfirm(tx1, [splitKeypair1])
  //   } catch (e) {
  //     console.log(e)
  //     throw e
  //   }
  //
  //   userPoolBalance = await provider.connection.getTokenAccountBalance(userPoolToken.address)
  //
  //   assert.equal(userPoolBalance.value.amount, '50')
  //
  //   const poolData = await client.fetchGlobalPool(pool)
  //   const userData = await client.fetchUser(user)
  //   const collateralData = await client.fetchCollateral(collateral)
  //
  //   assert.equal(poolData.depositAmount.toString(), '0')
  //   assert.equal(userData.rate.toString(), '100')
  //   assert.equal(collateralData, null)
  // })
  //
  // it('can not withdraw lp tokens if pool paused', async () => {
  //   const userPoolToken = await getOrCreateAssociatedTokenAccount(provider.connection, payerKeypair, poolMint, provider.wallet.publicKey)
  //   const destination = await getOrCreateAssociatedTokenAccount(provider.connection, payerKeypair, lpToken, provider.wallet.publicKey)
  //   const source = await getOrCreateAssociatedTokenAccount(provider.connection, payerKeypair, lpToken, poolForLPAuthority, true)
  //
  //   const { tx } = await client.pausePool({
  //     pool: poolForLP,
  //   })
  //
  //   try {
  //     await provider.sendAndConfirm(tx)
  //   } catch (e) {
  //     console.log(e)
  //     throw e
  //   }
  //
  //   const { transaction } = await client.withdrawLPTokens({
  //     amount: new BN(50),
  //     destination: destination.address,
  //     lpToken,
  //     pool: poolForLP,
  //     poolMint,
  //     source: source.address,
  //     userPoolToken: userPoolToken.address,
  //     withBurn: true,
  //   })
  //
  //   try {
  //     await provider.sendAndConfirm(transaction)
  //     assert.ok(false)
  //   } catch (e: any) {
  //     assertErrorCode(e, 'PoolAlreadyPaused')
  //   }
  //
  //   const { tx: tx1 } = await client.resumePool({
  //     pool: poolForLP,
  //   })
  //
  //   try {
  //     await provider.sendAndConfirm(tx1)
  //   } catch (e) {
  //     console.log(e)
  //     throw e
  //   }
  // })
  //
  // it('can not withdraw lp tokens if user blocked', async () => {
  //   const userPoolToken = await getOrCreateAssociatedTokenAccount(provider.connection, payerKeypair, poolMint, provider.wallet.publicKey)
  //   const destination = await getOrCreateAssociatedTokenAccount(provider.connection, payerKeypair, lpToken, provider.wallet.publicKey)
  //   const source = await getOrCreateAssociatedTokenAccount(provider.connection, payerKeypair, lpToken, poolForLPAuthority, true)
  //
  //   const { tx } = await client.blockUser({
  //     userWallet: provider.wallet.publicKey,
  //   })
  //
  //   try {
  //     await provider.sendAndConfirm(tx)
  //   } catch (e) {
  //     console.log(e)
  //     throw e
  //   }
  //
  //   const { transaction } = await client.withdrawLPTokens({
  //     amount: new BN(50),
  //     destination: destination.address,
  //     lpToken,
  //     pool: poolForLP,
  //     poolMint,
  //     source: source.address,
  //     userPoolToken: userPoolToken.address,
  //     withBurn: true,
  //   })
  //
  //   try {
  //     await provider.sendAndConfirm(transaction)
  //     assert.ok(false)
  //   } catch (e: any) {
  //     assertErrorCode(e, 'UserBlocked')
  //   }
  //
  //   const { tx: tx1 } = await client.unblockUser({
  //     userWallet: provider.wallet.publicKey,
  //   })
  //
  //   try {
  //     await provider.sendAndConfirm(tx1)
  //   } catch (e) {
  //     console.log(e)
  //     throw e
  //   }
  // })
  //
  // it('can not withdraw lp tokens without burn more than user can', async () => {
  //   const userPoolToken = await getOrCreateAssociatedTokenAccount(provider.connection, payerKeypair, poolMint, provider.wallet.publicKey)
  //   const destination = await getOrCreateAssociatedTokenAccount(provider.connection, payerKeypair, lpToken, provider.wallet.publicKey)
  //   const source = await getOrCreateAssociatedTokenAccount(provider.connection, payerKeypair, lpToken, poolForLPAuthority, true)
  //
  //   const { transaction } = await client.withdrawLPTokens({
  //     amount: new BN(151),
  //     destination: destination.address,
  //     lpToken,
  //     pool: poolForLP,
  //     poolMint,
  //     source: source.address,
  //     userPoolToken: userPoolToken.address,
  //     withBurn: false,
  //   })
  //
  //   try {
  //     await provider.sendAndConfirm(transaction)
  //     assert.ok(false)
  //   } catch (e: any) {
  //     assertErrorCode(e, 'InsufficientAmount')
  //   }
  // })
  //
  // it('should close collateral if delegated amount become 0', async () => {
  //   const userPoolToken = await getOrCreateAssociatedTokenAccount(provider.connection, payerKeypair, poolMint, provider.wallet.publicKey)
  //   let userPoolBalance = await provider.connection.getTokenAccountBalance(userPoolToken.address)
  //
  //   assert.equal(userPoolBalance.value.amount, '50')
  //
  //   const { transaction } = await client.mintOmnisol({
  //     amount: new BN(100),
  //     pool: poolForLP,
  //     poolMint,
  //     stakedAddress: lpToken,
  //     userPoolToken: userPoolToken.address,
  //   })
  //
  //   try {
  //     await provider.sendAndConfirm(transaction)
  //   } catch (e) {
  //     console.log(e)
  //     throw e
  //   }
  //
  //   userPoolBalance = await provider.connection.getTokenAccountBalance(userPoolToken.address)
  //
  //   assert.equal(userPoolBalance.value.amount, '150')
  //
  //   const destination = await getOrCreateAssociatedTokenAccount(provider.connection, payerKeypair, lpToken, provider.wallet.publicKey)
  //   let destinationBalance = await provider.connection.getTokenAccountBalance(destination.address)
  //
  //   assert.equal(destinationBalance.value.amount, '250')
  //
  //   const source = await getOrCreateAssociatedTokenAccount(provider.connection, payerKeypair, lpToken, poolForLPAuthority, true)
  //   let sourceBalance = await provider.connection.getTokenAccountBalance(source.address)
  //
  //   assert.equal(sourceBalance.value.amount, '150')
  //
  //   const { transaction: transaction1, user, collateral } = await client.withdrawLPTokens({
  //     amount: new BN(150),
  //     destination: destination.address,
  //     lpToken,
  //     pool: poolForLP,
  //     poolMint,
  //     source: source.address,
  //     userPoolToken: userPoolToken.address,
  //     withBurn: true,
  //   })
  //
  //   try {
  //     await provider.sendAndConfirm(transaction1)
  //   } catch (e) {
  //     console.log(e)
  //     throw e
  //   }
  //
  //   sourceBalance = await provider.connection.getTokenAccountBalance(source.address)
  //   destinationBalance = await provider.connection.getTokenAccountBalance(destination.address)
  //   userPoolBalance = await provider.connection.getTokenAccountBalance(userPoolToken.address)
  //
  //   assert.equal(sourceBalance.value.amount, '0')
  //   assert.equal(destinationBalance.value.amount, '400')
  //   assert.equal(userPoolBalance.value.amount, '0')
  //
  //   const poolData = await client.fetchGlobalPool(poolForLP)
  //   const userData = await client.fetchUser(user)
  //   const collateralData = await client.fetchCollateral(collateral)
  //
  //   assert.equal(poolData.depositAmount.toString(), '0')
  //   assert.equal(userData.rate.toString(), '0')
  //   assert.equal(collateralData, null)
  // })
  //
  // it('can not burn 0 omnisol', async () => {
  //   const stakeKeypair = web3.Keypair.generate()
  //   stakeAccount = stakeKeypair.publicKey
  //
  //   const lamportsForStakeAccount
  //     = (await provider.connection.getMinimumBalanceForRentExemption(
  //       web3.StakeProgram.space,
  //     ))
  //
  //   const createAccountTransaction = web3.StakeProgram.createAccount({
  //     fromPubkey: provider.wallet.publicKey,
  //     authorized: new web3.Authorized(
  //       provider.wallet.publicKey,
  //       provider.wallet.publicKey,
  //     ),
  //     lamports: lamportsForStakeAccount + web3.LAMPORTS_PER_SOL,
  //     lockup: new web3.Lockup(0, 0, provider.wallet.publicKey),
  //     stakePubkey: stakeAccount,
  //   })
  //   await provider.sendAndConfirm(createAccountTransaction, [payerKeypair, stakeKeypair])
  //
  //   const validators = await provider.connection.getVoteAccounts()
  //   const selectedValidator = validators.current[0]
  //   const selectedValidatorPubkey = new web3.PublicKey(selectedValidator.votePubkey)
  //
  //   const delegateTransaction = web3.StakeProgram.delegate({
  //     stakePubkey: stakeAccount,
  //     authorizedPubkey: provider.wallet.publicKey,
  //     votePubkey: selectedValidatorPubkey,
  //   })
  //
  //   await provider.sendAndConfirm(delegateTransaction, [payerKeypair, payerKeypair])
  //
  //   const splitKeypair = web3.Keypair.generate()
  //   const splitStake = splitKeypair.publicKey
  //
  //   const { transaction, user, collateral, bump } = await client.depositStake({
  //     delegatedStake: stakeAccount,
  //     amount: new BN(web3.LAMPORTS_PER_SOL),
  //     splitStake,
  //     sourceStake: stakeAccount,
  //     pool,
  //   })
  //
  //   try {
  //     await provider.sendAndConfirm(transaction, [splitKeypair])
  //   } catch (e) {
  //     console.log(e)
  //     throw e
  //   }
  //
  //   let poolData = await client.fetchGlobalPool(pool)
  //   let userData = await client.fetchUser(user)
  //   let collateralData = await client.fetchCollateral(collateral)
  //
  //   assert.equal(poolData.depositAmount.toString(), '1000000000')
  //   assert.equal(userData.wallet.equals(provider.wallet.publicKey), true)
  //   assert.equal(userData.rate.toString(), '1000000000')
  //   assert.equal(userData.isBlocked, false)
  //   assert.equal(collateralData.user.equals(user), true)
  //   assert.equal(collateralData.pool.equals(pool), true)
  //   assert.equal(collateralData.bump, bump)
  //   assert.equal(collateralData.amount, 0)
  //   assert.equal(collateralData.delegationStake.toString(), '1000000000')
  //   assert.equal(collateralData.liquidatedAmount.toString(), '0')
  //   assert.equal(collateralData.isNative, true)
  //   assert.equal(collateralData.sourceStake.equals(stakeAccount), true)
  //
  //   const userPoolToken = await getOrCreateAssociatedTokenAccount(provider.connection, payerKeypair, poolMint, provider.wallet.publicKey)
  //   let userPoolBalance = await provider.connection.getTokenAccountBalance(userPoolToken.address)
  //
  //   assert.equal(userPoolBalance.value.amount, '0')
  //
  //   const { transaction: tx1 } = await client.mintOmnisol({
  //     amount: new BN(1000000000),
  //     pool,
  //     poolMint,
  //     stakedAddress: stakeAccount,
  //     userPoolToken: userPoolToken.address,
  //   })
  //
  //   try {
  //     await provider.sendAndConfirm(tx1)
  //   } catch (e) {
  //     console.log(e)
  //     throw e
  //   }
  //
  //   userPoolBalance = await provider.connection.getTokenAccountBalance(userPoolToken.address)
  //
  //   assert.equal(userPoolBalance.value.amount, '1000000000')
  //
  //   poolData = await client.fetchGlobalPool(pool)
  //   userData = await client.fetchUser(user)
  //   collateralData = await client.fetchCollateral(collateral)
  //
  //   assert.equal(poolData.depositAmount.toString(), '1000000000')
  //   assert.equal(userData.rate.toString(), '0')
  //   assert.equal(collateralData.amount.toString(), '1000000000')
  //   assert.equal(collateralData.delegationStake.toString(), '1000000000')
  //
  //   const { tx } = await client.burnOmnisol({
  //     sourceTokenAccount: userPoolToken.address,
  //     amount: new BN(0),
  //     pool,
  //     poolMint,
  //   })
  //
  //   try {
  //     await provider.sendAndConfirm(tx)
  //     assert.ok(false)
  //   } catch (e: any) {
  //     assertErrorCode(e, 'InsufficientAmount')
  //   }
  // })
  //
  // it('can not burn omnisol when pool paused', async () => {
  //   const userPoolToken = await getOrCreateAssociatedTokenAccount(provider.connection, payerKeypair, poolMint, provider.wallet.publicKey)
  //
  //   const { tx: tx1 } = await client.pausePool({
  //     pool,
  //   })
  //
  //   try {
  //     await provider.sendAndConfirm(tx1)
  //   } catch (e) {
  //     console.log(e)
  //     throw e
  //   }
  //
  //   const { tx } = await client.burnOmnisol({
  //     sourceTokenAccount: userPoolToken.address,
  //     amount: new BN(100),
  //     pool,
  //     poolMint,
  //   })
  //
  //   try {
  //     await provider.sendAndConfirm(tx)
  //     assert.ok(false)
  //   } catch (e: any) {
  //     assertErrorCode(e, 'PoolAlreadyPaused')
  //   }
  //
  //   const { tx: tx2 } = await client.resumePool({
  //     pool,
  //   })
  //
  //   try {
  //     await provider.sendAndConfirm(tx2)
  //   } catch (e) {
  //     console.log(e)
  //     throw e
  //   }
  // })
  //
  // it('can not burn omnisol when user blocked', async () => {
  //   const userPoolToken = await getOrCreateAssociatedTokenAccount(provider.connection, payerKeypair, poolMint, provider.wallet.publicKey)
  //
  //   const { tx: tx1 } = await client.blockUser({
  //     userWallet: provider.wallet.publicKey,
  //   })
  //
  //   try {
  //     await provider.sendAndConfirm(tx1)
  //   } catch (e) {
  //     console.log(e)
  //     throw e
  //   }
  //
  //   const { tx } = await client.burnOmnisol({
  //     sourceTokenAccount: userPoolToken.address,
  //     amount: new BN(100),
  //     pool,
  //     poolMint,
  //   })
  //
  //   try {
  //     await provider.sendAndConfirm(tx)
  //     assert.ok(false)
  //   } catch (e: any) {
  //     assertErrorCode(e, 'UserBlocked')
  //   }
  //
  //   const { tx: tx2 } = await client.unblockUser({
  //     userWallet: provider.wallet.publicKey,
  //   })
  //
  //   try {
  //     await provider.sendAndConfirm(tx2)
  //   } catch (e) {
  //     console.log(e)
  //     throw e
  //   }
  // })
  //
  // it('can burn omnisol', async () => {
  //   const userPoolToken = await getOrCreateAssociatedTokenAccount(provider.connection, payerKeypair, poolMint, provider.wallet.publicKey)
  //   let userPoolBalance = await provider.connection.getTokenAccountBalance(userPoolToken.address)
  //
  //   assert.equal(userPoolBalance.value.amount, '1000000000')
  //
  //   const { tx, withdrawInfo } = await client.burnOmnisol({
  //     sourceTokenAccount: userPoolToken.address,
  //     amount: new BN(500000000),
  //     pool,
  //     poolMint,
  //   })
  //
  //   try {
  //     await provider.sendAndConfirm(tx)
  //   } catch (e) {
  //     console.log(e)
  //     throw e
  //   }
  //
  //   userPoolBalance = await provider.connection.getTokenAccountBalance(userPoolToken.address)
  //
  //   assert.equal(userPoolBalance.value.amount, '500000000')
  //
  //   const withdrawInfoData = await client.fetchWithdrawInfo(withdrawInfo)
  //
  //   assert.equal(withdrawInfoData.amount.toString(), '500000000')
  //   assert.equal(withdrawInfoData.authority.equals(provider.wallet.publicKey), true)
  // })
  //
  // it('can create another withdraw request', async () => {
  //   const userPoolToken = await getOrCreateAssociatedTokenAccount(provider.connection, payerKeypair, poolMint, provider.wallet.publicKey)
  //   let userPoolBalance = await provider.connection.getTokenAccountBalance(userPoolToken.address)
  //
  //   assert.equal(userPoolBalance.value.amount, '500000000')
  //
  //   const { tx, withdrawInfo } = await client.burnOmnisol({
  //     sourceTokenAccount: userPoolToken.address,
  //     amount: new BN(500000000),
  //     pool,
  //     poolMint,
  //   })
  //
  //   try {
  //     await provider.sendAndConfirm(tx)
  //   } catch (e) {
  //     console.log(e)
  //     throw e
  //   }
  //
  //   userPoolBalance = await provider.connection.getTokenAccountBalance(userPoolToken.address)
  //
  //   assert.equal(userPoolBalance.value.amount, '0')
  //
  //   const withdrawInfoData = await client.fetchWithdrawInfo(withdrawInfo)
  //
  //   assert.equal(withdrawInfoData.amount.toString(), '500000000')
  //   assert.equal(withdrawInfoData.authority.equals(provider.wallet.publicKey), true)
  // })
  //
  // it('can liquidate collateral', async () => {
  //   const poolAddr = new web3.PublicKey('FypPtwbY3FUfzJUtXHSyVRokVKG2jKtH29FmK4ebxRSd')
  //   const [stakeAccountRecord] = await web3.PublicKey.findProgramAddress(
  //     [poolAddr.toBuffer(), stakeAccount.toBuffer()],
  //     new web3.PublicKey('unpXTU2Ndrc7WWNyEhQWe4udTzSibLPi25SXv2xbCHQ'),
  //   )
  //
  //   const splitKeypair = web3.Keypair.generate()
  //   const splitStake = splitKeypair.publicKey
  //
  //   const { tx } = await client.liquidateCollateral({
  //     amount: new BN(500000000),
  //     feeAccount: new web3.PublicKey('So11111111111111111111111111111111111111112'),
  //     oracle,
  //     pool,
  //     poolAccount: poolAddr,
  //     protocolFee: new web3.PublicKey('2hN9UhvRFVfPYKL6rZJ5YiLEPCLTpN755pgwDJHWgFbU'),
  //     protocolFeeDestination: new web3.PublicKey('GnRGTBrFuEwb85Zs4zeZWUzQYfTwmPxCPYmQQodDzYUK'),
  //     solReserves: new web3.PublicKey('3rBnnH9TTgd3xwu48rnzGsaQkSr1hR64nY71DrDt6VrQ'),
  //     sourceStake: stakeAccount,
  //     stakeAccountRecord,
  //     collateralOwnerWallet: provider.wallet.publicKey,
  //     userWallet: provider.wallet.publicKey,
  //     splitStake,
  //     unstakeItProgram: new web3.PublicKey('unpXTU2Ndrc7WWNyEhQWe4udTzSibLPi25SXv2xbCHQ'),
  //   })
  //
  //   try {
  //     await provider.sendAndConfirm(tx, [splitKeypair])
  //   } catch (e) {
  //     console.log(e)
  //     throw e
  //   }
  //
  //   // userPoolBalance = await provider.connection.getTokenAccountBalance(userPoolToken.address)
  //   //
  //   // assert.equal(userPoolBalance.value.amount, '500000000')
  //   //
  //   // const withdrawInfoData = await client.fetchWithdrawInfo(withdrawInfo)
  //   //
  //   // assert.equal(withdrawInfoData.amount.toString(), '500000000')
  //   // assert.equal(withdrawInfoData.authority.equals(provider.wallet.publicKey), true)
  // })
  //
  // it('can close oracle', async () => {
  //   const { tx } = await client.closeOracle({
  //     oracle,
  //   })
  //
  //   try {
  //     await provider.sendAndConfirm(tx)
  //   } catch (e) {
  //     console.log(e)
  //     throw e
  //   }
  //
  //   const oracleData = await client.fetchOracle(oracle)
  //   assert.equal(oracleData, null)
  // })
  //
  // it('can not update oracle info with non-oracle authority', async () => {
  //   const oraclePair = web3.Keypair.generate()
  //   oracle = oraclePair.publicKey
  //
  //   const { tx } = await client.initOracle({
  //     oracleAuthority: web3.PublicKey.unique(),
  //     oracle,
  //   })
  //
  //   try {
  //     await provider.sendAndConfirm(tx, [oraclePair])
  //   } catch (e) {
  //     console.log(e)
  //     throw e
  //   }
  //
  //   const addresses = [web3.PublicKey.unique(), web3.PublicKey.unique()]
  //   const values = [new BN(100), new BN(200)]
  //   const { tx: tx1 } = await client.updateOracleInfo({
  //     oracle,
  //     addresses,
  //     values,
  //   })
  //
  //   try {
  //     await provider.sendAndConfirm(tx1)
  //     assert.ok(false)
  //   } catch (e: any) {
  //     assertErrorCode(e, '')
  //   }
  // })
  //
  // it('can remove liquidator', async () => {
  //   const { tx, liquidator } = await client.removeLiquidator({
  //     liquidator_wallet: provider.wallet.publicKey,
  //   })
  //
  //   try {
  //     await provider.sendAndConfirm(tx)
  //   } catch (e) {
  //     console.log(e)
  //     throw e
  //   }
  //
  //   const liquidatorData = await client.fetchLiquidator(liquidator)
  //   assert.equal(liquidatorData, null)
  // })
  //
  // it('can close global pool', async () => {
  //   const { tx } = await client.closePool({
  //     pool,
  //   })
  //
  //   try {
  //     await provider.sendAndConfirm(tx)
  //   } catch (e) {
  //     console.log(e)
  //     throw e
  //   }
  //
  //   const poolData = await client.fetchGlobalPool(pool)
  //   if (poolData) {
  //     throw new Error('Pool is not closed')
  //   }
  // })
})

export function assertErrorCode(error: { logs?: string[] }, code: string) {
  assert.ok(String((error?.logs ?? []).join('')).includes(`Error Code: ${code}`))
}
