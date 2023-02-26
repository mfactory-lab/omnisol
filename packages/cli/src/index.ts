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

cli.command('create-pool').action(actions.createPool)
cli.command('add-liquidator').action(actions.addLiquidator)
cli.command('add-manager').action(actions.addManager)
cli.command('add-to-whitelist').action(actions.addToWhitelist)
cli.command('block-user').action(actions.blockUser)
cli.command('burn').action(actions.burnOmnisol)
cli.command('close-oracle').action(actions.closeOracle)
cli.command('close-pool').action(actions.closePool)
cli.command('deposit-lp').action(actions.depositLp)
cli.command('deposit-stake').action(actions.depositStake)
cli.command('init-oracle').action(actions.initOracle)
cli.command('mint').action(actions.mintOmnisol)
cli.command('pause-pool').action(actions.pausePool)
cli.command('remove-from-whitelist').action(actions.removeFromWhitelist)
cli.command('remove-liquidator').action(actions.removeLiquidator)
cli.command('remove-manager').action(actions.removeManager)
cli.command('resume-pool').action(actions.resumePool)
cli.command('unblock-user').action(actions.unblockUser)
cli.command('update-oracle').action(actions.updateOracleInfo)
cli.command('withdraw-lp').action(actions.withdrawLpTokens)
cli.command('withdraw-stake').action(actions.withdrawStake)

cli.parseAsync(process.argv).then(
  () => {},
  (e: unknown) => {
    throw e
  },
)
