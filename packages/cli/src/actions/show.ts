import log from 'loglevel'
import { useContext } from '../context'

export async function showPool(address: string) {
  const { client } = useContext()

  const [poolAuthorityKey] = await client.pda.poolAuthority(address)
  const pool = await client.fetchGlobalPool(address)

  log.info('--------------------------------------------------------------------------')
  log.info(`Pool: ${address}`)
  log.info(`Pool authority: ${poolAuthorityKey}`)
  log.info(`Pool mint: ${pool.poolMint}`)
  log.info(`Oracle: ${pool.oracle}`)
  log.info(`Stake source: ${pool.stakeSource}`)
  log.info(`Authority: ${pool.authority}`)
  log.info(`Deposit amount: ${pool.depositAmount}`)
  log.info(`Is active: ${pool.isActive}`)
  log.info(`Authority bump: ${pool.authorityBump}`)
  log.info('--------------------------------------------------------------------------')
}

export async function showLiquidator(address: string) {
  const { client } = useContext()

  const [liquidatorKey] = await client.pda.liquidator(address)
  const liquidator = await client.fetchLiquidator(liquidatorKey)

  log.info('--------------------------------------------------------------------------')
  log.info(`PDA address: ${liquidatorKey}`)
  log.info(`Liquidator authority: ${liquidator.authority}`)
  log.info('--------------------------------------------------------------------------')
}

export async function showManager(address: string) {
  const { client } = useContext()

  const [managerKey] = await client.pda.manager(address)
  const manager = await client.fetchManager(managerKey)

  log.info('--------------------------------------------------------------------------')
  log.info(`PDA address: ${managerKey}`)
  log.info(`Manager wallet: ${manager.manager}`)
  log.info('--------------------------------------------------------------------------')
}

export async function showWhitelist(address: string) {
  const { client } = useContext()

  const [whitelistKey] = await client.pda.whitelist(address)
  const whitelist = await client.fetchWhitelist(whitelistKey)

  log.info('--------------------------------------------------------------------------')
  log.info(`Whitelist pda: ${whitelistKey}`)
  log.info(`Pool: ${whitelist.pool}`)
  log.info(`Token address: ${whitelist.whitelistedToken}`)
  log.info(`Staking pool: ${whitelist.stakingPool}`)
  log.info('--------------------------------------------------------------------------')
}

export async function showUser(address: string) {
  const { client } = useContext()

  const [userKey] = await client.pda.user(address)
  const user = await client.fetchUser(userKey)

  log.info('--------------------------------------------------------------------------')
  log.info(`User pda: ${userKey}`)
  log.info(`User wallet: ${user.wallet}`)
  log.info(`User rate: ${user.rate}`)
  log.info(`User withdraw requests amount: ${user.requestsAmount}`)
  log.info(`Last withdraw request index: ${user.lastWithdrawIndex}`)
  log.info(`Is blocked: ${user.isBlocked}`)
  log.info('--------------------------------------------------------------------------')
}

export async function showOracle(address: string) {
  const { client } = useContext()

  const oracle = await client.fetchOracle(address)

  log.info('--------------------------------------------------------------------------')
  log.info(`Oracle: ${address}`)
  log.info(`\nPriority queue: \n${JSON.stringify(oracle.priorityQueue, null, 2)}\n`)
  log.info('--------------------------------------------------------------------------')
}

export async function showCollateral(sourceStake: string, user: string) {
  const { client } = useContext()

  const [collateralKey] = await client.pda.collateral(sourceStake, user)
  const collateral = await client.fetchCollateral(collateralKey)

  log.info('--------------------------------------------------------------------------')
  log.info(`Collateral pda: ${collateralKey}`)
  log.info(`User pda: ${collateral.user}`)
  log.info(`Pool: ${collateral.pool}`)
  log.info(`Minted amount: ${collateral.amount}`)
  log.info(`Address of lp token or native stake account deposited: ${collateral.sourceStake}`)
  log.info(`Bump: ${collateral.bump}`)
  log.info(`Liquidated amount: ${collateral.liquidatedAmount}`)
  log.info(`Is native stake: ${collateral.isNative}`)
  log.info(`Amount of stake delegated: ${collateral.delegationStake}`)
  log.info(`Created at: ${collateral.createdAt}`)
  log.info('--------------------------------------------------------------------------')
}

export async function showWithdrawInfo(address: string, index: string) {
  const { client } = useContext()

  const [withdrawKey] = await client.pda.withdrawInfo(address, Number(index))
  const withdraw = await client.fetchWithdrawInfo(withdrawKey)

  log.info('--------------------------------------------------------------------------')
  log.info(`Withdraw request pda: ${withdrawKey}`)
  log.info(`User wallet: ${withdraw.authority}`)
  log.info(`Amount to liquidate: ${withdraw.amount}`)
  log.info(`Created at: ${withdraw.createdAt}`)
  log.info('--------------------------------------------------------------------------')
}
