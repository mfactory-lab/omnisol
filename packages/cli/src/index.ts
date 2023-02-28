import type { Command } from 'commander'
import { program as cli } from 'commander'
import log from 'loglevel'
import { version } from '../package.json'
import * as actions from './actions'
import { initContext } from './context'

const DEFAULT_LOG_LEVEL = 'info'
const DEFAULT_CLUSTER = 'devnet' // 'https://devnet.rpcpool.com'
const DEFAULT_KEYPAIR = `${process.env.HOME}/.config/solana/id.json`

cli
  .version(version)
  .allowExcessArguments(false)
  .option('-c, --cluster <CLUSTER>', 'Solana cluster', DEFAULT_CLUSTER)
  .option('-k, --keypair <KEYPAIR>', 'Filepath or URL to a keypair', DEFAULT_KEYPAIR)
  .option('-l, --log-level <LEVEL>', 'Log level', (l: any) => l && log.setLevel(l), DEFAULT_LOG_LEVEL)
  .hook('preAction', async (command: Command) => {
    const opts = command.opts() as any
    log.setLevel(opts.logLevel)
    const { provider, cluster } = initContext(opts)
    log.info(`# CLI version: ${version}`)
    log.info(`# Keypair: ${provider.wallet.publicKey}`)
    log.info(`# Cluster: ${cluster}`)
  })

// -------------------------------------------------------
// Pool
// -------------------------------------------------------

const pool = cli.command('pool')

pool.command('create')
  .description('Create new pool')
  .requiredOption('-m, --mint <MINT>', 'Omnisol mint address')
  .requiredOption('-o, --oracle <ORACLE>', 'Oracle address')
  .requiredOption('-s, --stake-source <STAKE_SOURCE>', 'Address of LP token or native stake program')
  .action(actions.createPool)

pool.command('pause')
  .description('Pause pool')
  .requiredOption('-p, --pool <POOL>', 'Pool address to pause')
  .action(actions.pausePool)

pool.command('resume')
  .description('Resume pool')
  .requiredOption('-p, --pool <POOL>', 'Pool address to resume')
  .action(actions.resumePool)

pool.command('close')
  .description('Close pool')
  .requiredOption('-p, --pool <POOL>', 'Pool address to close')
  .action(actions.closePool)

pool.command('show')
  .description('Show pool info')
  .argument('<ADDRESS>', 'Pool address')
  .action(actions.showPool)

// -------------------------------------------------------
// Liquidator
// -------------------------------------------------------

const liquidator = cli.command('liquidator')

liquidator.command('add')
  .description('Add new liquidator')
  .requiredOption('-l, --liquidator <LIQUIDATOR>', 'Liquidator wallet address')
  .action(actions.addLiquidator)

liquidator.command('remove')
  .description('Remove liquidator')
  .requiredOption('-l, --liquidator <LIQUIDATOR>', 'Liquidator wallet address')
  .action(actions.removeLiquidator)

pool.command('show')
  .description('Show liquidator info')
  .argument('<ADDRESS>', 'Liquidator wallet address')
  .action(actions.showLiquidator)

// -------------------------------------------------------
// Manager
// -------------------------------------------------------

const manager = cli.command('manager')

manager.command('add')
  .description('Add new manager')
  .requiredOption('-m, --manager <MANAGER>', 'Manager wallet address')
  .action(actions.addManager)

manager.command('remove')
  .description('Remove manager')
  .requiredOption('-m, --manager <MANAGER>', 'Manager wallet address')
  .action(actions.removeManager)

manager.command('show')
  .description('Show manager info')
  .argument('<ADDRESS>', 'Manager wallet address')
  .action(actions.showManager)

// -------------------------------------------------------
// Whitelist
// -------------------------------------------------------

const whitelist = cli.command('whitelist')

whitelist.command('add')
  .description('Add token to whitelist')
  .requiredOption('-p, --pool <TOKEN_POOL>', 'Address of token pool program')
  .requiredOption('-s, --stake-pool <STAKE_POOL>', 'Address of staking pool of token')
  .requiredOption('-t, --token <TOKEN>', 'Token mint address to add to whitelist')
  .action(actions.addToWhitelist)

whitelist.command('remove')
  .description('Remove token from whitelist')
  .requiredOption('-t, --token <TOKEN>', 'Token mint address to remove from whitelist')
  .action(actions.removeFromWhitelist)

pool.command('show')
  .description('Show whitelist info')
  .argument('<ADDRESS>', 'Whitelisted token address')
  .action(actions.showWhitelist)

// -------------------------------------------------------
// User
// -------------------------------------------------------

const user = cli.command('user')

user.command('block')
  .description('Block user')
  .requiredOption('-u, --user <USER>', 'Address of user wallet to block')
  .action(actions.blockUser)

user.command('unblock')
  .description('Unblock user')
  .requiredOption('-u, --user <USER>', 'Address of user wallet to unblock')
  .action(actions.unblockUser)

pool.command('show')
  .description('Show user info')
  .argument('<ADDRESS>', 'User wallet address')
  .action(actions.showUser)

// -------------------------------------------------------
// Oracle
// -------------------------------------------------------

const oracle = cli.command('oracle')

oracle.command('init')
  .description('Init oracle')
  .requiredOption('-a, --authority <ORACLE_AUTHORITY>', 'Address of oracle wallet to init')
  .action(actions.initOracle)

oracle.command('close')
  .description('Close oracle')
  .requiredOption('-o, --oracle <ORACLE>', 'Address of oracle pda to close')
  .action(actions.closeOracle)

oracle.command('update')
  .description('Update oracle')
  .requiredOption('-o, --oracle <ORACLE>', 'Address of oracle pda')
  .requiredOption('-a, --addresses <ADDRESSES>', 'Addresses of collaterals in priority queue (separated by comma)')
  .requiredOption('-v, --values <VALUES>', 'Values of liquidation amounts of collaterals (separated by comma)')
  .action(actions.updateOracleInfo)

pool.command('show')
  .description('Show oracle info')
  .argument('<ADDRESS>', 'Oracle address')
  .action(actions.showOracle)

// -------------------------------------------------------
// Deposit
// -------------------------------------------------------

const deposit = cli.command('deposit')

deposit.command('stake')
  .description('Deposit native stake account')
  .requiredOption('-p, --pool <POOL>', 'Omnisol pool address for native stake')
  .requiredOption('-s, --stake <SOURCE_STAKE>', 'Stake account address')
  .action(actions.depositStake)

deposit.command('lp-token')
  .description('Deposit lp token')
  .requiredOption('-p, --pool <POOL>', 'Omnisol pool address for lp token')
  .requiredOption('-a, --amount <AMOUNT>', 'Amount of tokens to stake')
  .requiredOption('-d, --destination <DESTINATION>', 'Associated token account for token and pool')
  .requiredOption('-t, --token <TOKEN>', 'Token to stake')
  .requiredOption('-s, --source <SOURCE>', 'Associated token account for token and user')
  .action(actions.depositLp)

// -------------------------------------------------------
// Withdraw
// -------------------------------------------------------

const withdraw = cli.command('withdraw')

withdraw.command('stake')
  .description('Withdraw native stake')
  .requiredOption('-a, --amount <AMOUNT>', 'Amount of lamports to withdraw')
  .requiredOption('-p, --pool <POOL>', 'Omnisol pool address for native stake')
  .requiredOption('-m, --mint <POOL_MINT>', 'Omnisol token mint address')
  .requiredOption('-s, --stake <STAKE_ACCOUNT>', 'Address of stake account to withdraw from')
  .requiredOption('-at, --assoc-token <USER_POOL_TOKEN>', 'Associated token account for token and user')
  .action(actions.withdrawStake)

withdraw.command('lp-token')
  .description('Withdraw lp-token')
  .requiredOption('-a, --amount <AMOUNT>', 'Amount of lamports to withdraw')
  .requiredOption('-p, --pool <POOL>', 'Omnisol pool address for native stake')
  .requiredOption('-m, --mint <POOL_MINT>', 'Omnisol token mint address')
  .requiredOption('-at, --assoc-token <USER_POOL_TOKEN>', 'Associated token account for Omnisol token and user')
  .requiredOption('-t, --token <LP_TOKEN>', 'Staked LP token mint address')
  .requiredOption('-s, --source <SOURCE>', 'Associated token account for lp token and pool')
  .requiredOption('-d, --destination <DESTINATION>', 'Associated token account for lp token and user')
  .action(actions.withdrawLpTokens)

// -------------------------------------------------------
// Burn
// -------------------------------------------------------

cli.command('burn')
  .description('Burn Omnisol tokens and leave withdraw request')
  .requiredOption('-a, --amount <AMOUNT>', 'Amount of tokens to burn')
  .requiredOption('-p, --pool <POOL>', 'Any Omnisol pool (only for clarifying in contract)')
  .requiredOption('-m, --mint <POOL_MINT>', 'Omnisol token mint address')
  .requiredOption('-s, --source <SOURCE_TOKEN_ACCOUNT>', 'Associated token account for Omnisol token and user')
  .action(actions.burnOmnisol)

// -------------------------------------------------------
// Mint
// -------------------------------------------------------

cli.command('mint')
  .description('Mint Omnisol tokens')
  .requiredOption('-a, --amount <AMOUNT>', 'Amount of tokens to mint')
  .requiredOption('-p, --pool <POOL>', 'Omnisol pool of chosen collateral')
  .requiredOption('-m, --mint <POOL_MINT>', 'Omnisol token mint address')
  .requiredOption('-s, --stake <STAKED_ADDRESS>', 'Address of lp token or native stake')
  .requiredOption('-at, --assoc-token <USER_POOL_TOKEN>', 'Associated token account for Omnisol token and user')
  .action(actions.mintOmnisol)

// -------------------------------------------------------
// Collateral
// -------------------------------------------------------

const collateral = cli.command('collateral')

collateral.command('show')
  .description('Show collateral info')
  .argument('<SOURCE_STAKE>', 'Address of lp token or native stake account')
  .argument('<USER>', 'Address of user pda')
  .action(actions.showCollateral)

// -------------------------------------------------------
// WithdrawInfo
// -------------------------------------------------------

const withdrawInfo = cli.command('withdrawInfo')

withdrawInfo.command('show')
  .description('Show withdraw request info')
  .argument('<ADDRESS>', 'User wallet address')
  .argument('<INDEX>', 'Index of withdraw request')
  .action(actions.showWithdrawInfo)

cli.parseAsync(process.argv).then(
  () => {},
  (e: unknown) => {
    throw e
  },
)
