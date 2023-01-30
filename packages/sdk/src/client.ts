import type { Address, BN, Program } from '@project-serum/anchor'
import type { PublicKey } from '@solana/web3.js'
import { Transaction } from '@solana/web3.js'
import { web3 } from '@project-serum/anchor'
import type { Collateral, Manager, Oracle, Pool, User, Whitelist } from './generated'
import {
  PROGRAM_ID,
  createAddManagerInstruction,
  createAddToWhitelistInstruction,
  createBlockUserInstruction,
  createClosePoolInstruction,
  createDepositLpInstruction,
  createDepositStakeInstruction,
  createInitOracleInstruction,
  createInitPoolInstruction,
  createMintOmnisolInstruction,
  createPausePoolInstruction,
  createRemoveFromWhitelistInstruction,
  createRemoveManagerInstruction,
  createResumePoolInstruction,
  createUnblockUserInstruction,
  createWithdrawLpTokensInstruction, createWithdrawStakeInstruction, createCloseOracleInstruction,
} from './generated'
import { IDL } from './idl/omnisol'

const COLLATERAL_SEED_PREFIX = 'collateral'
const WHITELIST_SEED_PREFIX = 'whitelist'
const USER_SEED_PREFIX = 'user'
const MANAGER_SEED_PREFIX = 'manager'

export class OmnisolClient {
  static programId = PROGRAM_ID
  static IDL = IDL
  static clock = web3.SYSVAR_CLOCK_PUBKEY
  static stakeProgram = web3.StakeProgram.programId

  constructor(private readonly props: OmnisolClientProps) {}

  get program() {
    return this.props.program
  }

  get wallet() {
    return this.props.wallet
  }

  get pda() {
    return new OmnisolPDA()
  }

  async fetchGlobalPool(address: Address) {
    return await this.program.account.pool.fetchNullable(address) as unknown as Pool
  }

  async fetchWhitelist(address: Address) {
    return await this.program.account.whitelist.fetchNullable(address) as unknown as Whitelist
  }

  async fetchUser(address: Address) {
    return await this.program.account.user.fetchNullable(address) as unknown as User
  }

  async fetchCollateral(address: Address) {
    return await this.program.account.collateral.fetchNullable(address) as unknown as Collateral
  }

  async fetchManager(address: Address) {
    return await this.program.account.manager.fetchNullable(address) as unknown as Manager
  }

  async fetchOracle(address: Address) {
    return await this.program.account.oracle.fetchNullable(address) as unknown as Oracle
  }

  async createGlobalPool(props: CreateGlobalPoolProps) {
    const payer = this.wallet.publicKey
    const pool = props.pool
    const [poolAuthority, bump] = await this.pda.poolAuthority(pool)
    const ix = createInitPoolInstruction(
      {
        authority: payer,
        pool,
        poolAuthority,
        poolMint: props.mint,
      },
    )
    const tx = new Transaction().add(ix)

    return {
      tx,
      poolAuthority,
      bump,
    }
  }

  async addManager(props: AddManagerProps) {
    const payer = this.wallet.publicKey
    const [manager] = await this.pda.manager(props.manager_wallet)
    const instruction = createAddManagerInstruction(
      {
        authority: payer,
        manager,
        managerWallet: props.manager_wallet,
        pool: props.pool,
      },
    )
    const tx = new Transaction().add(instruction)

    return {
      tx,
      manager,
    }
  }

  async removeManager(props: RemoveManagerProps) {
    const payer = this.wallet.publicKey
    const [manager] = await this.pda.manager(props.manager_wallet)
    const instruction = createRemoveManagerInstruction(
      {
        authority: payer,
        manager,
        managerWallet: props.manager_wallet,
        pool: props.pool,
      },
    )
    const tx = new Transaction().add(instruction)

    return {
      tx,
      manager,
    }
  }

  async closeGlobalPool(props: CloseGlobalPoolProps) {
    const payer = this.wallet.publicKey
    const instruction = createClosePoolInstruction(
      {
        pool: props.pool,
        authority: payer,
      },
    )
    const tx = new Transaction().add(instruction)

    return {
      tx,
    }
  }

  async pauseGlobalPool(props: PauseGlobalPoolProps) {
    const payer = this.wallet.publicKey
    const [manager] = await this.pda.manager(payer)
    const instruction = createPausePoolInstruction(
      {
        manager,
        pool: props.pool,
        authority: payer,
      },
    )
    const tx = new Transaction().add(instruction)

    return {
      tx,
    }
  }

  async resumeGlobalPool(props: ResumeGlobalPoolProps) {
    const payer = this.wallet.publicKey
    const [manager] = await this.pda.manager(payer)
    const instruction = createResumePoolInstruction(
      {
        manager,
        pool: props.pool,
        authority: payer,
      },
    )
    const tx = new Transaction().add(instruction)

    return {
      tx,
    }
  }

  async addToWhitelist(props: AddToWhitelistProps) {
    const payer = this.wallet.publicKey
    const [whitelist] = await this.pda.whitelist(props.token)
    const [manager] = await this.pda.manager(payer)
    const instruction = createAddToWhitelistInstruction(
      {
        addressToWhitelist: props.token,
        authority: payer,
        manager,
        whitelist,
      },
    )
    const tx = new Transaction().add(instruction)

    return {
      tx,
      whitelist,
    }
  }

  async removeFromWhitelist(props: RemoveFromWhitelistProps) {
    const payer = this.wallet.publicKey
    const [whitelist] = await this.pda.whitelist(props.token)
    const [manager] = await this.pda.manager(payer)
    const instruction = createRemoveFromWhitelistInstruction(
      {
        addressToWhitelist: props.token,
        authority: payer,
        manager,
        whitelist,
      },
    )
    const tx = new Transaction().add(instruction)

    return {
      tx,
    }
  }

  async blockUser(props: BlockUserProps) {
    const payer = this.wallet.publicKey
    const [user] = await this.pda.user(props.user_wallet)
    const [manager] = await this.pda.manager(payer)
    const instruction = createBlockUserInstruction(
      {
        authority: payer,
        manager,
        user,
        userWallet: props.user_wallet,
      },
    )
    const tx = new Transaction().add(instruction)

    return {
      tx,
      user,
    }
  }

  async unblockUser(props: UnblockUserProps) {
    const payer = this.wallet.publicKey
    const [user] = await this.pda.user(props.user_wallet)
    const [manager] = await this.pda.manager(payer)
    const instruction = createUnblockUserInstruction(
      {
        authority: payer,
        manager,
        user,
        userWallet: props.user_wallet,
      },
    )
    const tx = new Transaction().add(instruction)

    return {
      tx,
      user,
    }
  }

  async depositLPToken(props: DepositLPTokenProps) {
    const payer = this.wallet.publicKey
    const [poolAuthority] = await this.pda.poolAuthority(props.pool)
    const [user] = await this.pda.user(payer)
    const [whitelist] = await this.pda.whitelist(props.lpToken)
    const [collateral, bump] = await this.pda.collateral(props.lpToken, user)
    const instruction = createDepositLpInstruction(
      {
        authority: payer,
        clock: OmnisolClient.clock,
        collateral,
        destination: props.destination,
        lpToken: props.lpToken,
        pool: props.pool,
        poolAuthority,
        source: props.source,
        user,
        whitelist,
      },
      {
        amount: props.amount,
      },
    )
    const tx = new Transaction().add(instruction)

    return {
      tx,
      collateral,
      user,
      bump,
    }
  }

  async depositStake(props: DepositStakeProps) {
    const payer = this.wallet.publicKey
    const [poolAuthority] = await this.pda.poolAuthority(props.pool)
    const [user] = await this.pda.user(payer)
    const [collateral, bump] = await this.pda.collateral(props.sourceStake, user)
    const instruction = createDepositStakeInstruction(
      {
        authority: payer,
        clock: OmnisolClient.clock,
        collateral,
        pool: props.pool,
        poolAuthority,
        sourceStake: props.sourceStake,
        stakeProgram: OmnisolClient.stakeProgram,
        user,
      },
    )
    const transaction = new Transaction().add(instruction)

    return {
      transaction,
      user,
      collateral,
      bump,
    }
  }

  async mintOmnisol(props: MintOmnisolProps) {
    const payer = this.wallet.publicKey
    const [poolAuthority] = await this.pda.poolAuthority(props.pool)
    const [user] = await this.pda.user(payer)
    const [collateral] = await this.pda.collateral(props.stakedAddress, user)
    const instruction = createMintOmnisolInstruction(
      {
        authority: payer,
        clock: OmnisolClient.clock,
        collateral,
        pool: props.pool,
        poolAuthority,
        poolMint: props.poolMint,
        stakedAddress: props.stakedAddress,
        user,
        userPoolToken: props.userPoolToken,
      },
      {
        amount: props.amount,
      },
    )
    const transaction = new Transaction().add(instruction)

    return {
      transaction,
      user,
      collateral,
    }
  }

  async withdrawLPTokens(props: WithdrawLPProps) {
    const payer = this.wallet.publicKey
    const [poolAuthority] = await this.pda.poolAuthority(props.pool)
    const [user] = await this.pda.user(payer)
    const [collateral] = await this.pda.collateral(props.lpToken, user)
    const instruction = createWithdrawLpTokensInstruction(
      {
        destination: props.destination,
        source: props.source,
        authority: payer,
        clock: OmnisolClient.clock,
        collateral,
        pool: props.pool,
        poolAuthority,
        poolMint: props.poolMint,
        lpToken: props.lpToken,
        user,
        userPoolToken: props.userPoolToken,
      },
      {
        amount: props.amount,
      },
    )
    const transaction = new Transaction().add(instruction)

    return {
      transaction,
      user,
      collateral,
    }
  }

  async withdrawStake(props: WithdrawStakeProps) {
    const payer = this.wallet.publicKey
    const [poolAuthority] = await this.pda.poolAuthority(props.pool)
    const [user] = await this.pda.user(payer)
    const [collateral] = await this.pda.collateral(props.stakeAccount, user)
    const instruction = createWithdrawStakeInstruction(
      {
        authority: payer,
        clock: OmnisolClient.clock,
        collateral,
        pool: props.pool,
        poolAuthority,
        poolMint: props.poolMint,
        sourceStake: props.stakeAccount,
        splitStake: props.splitStake,
        stakeProgram: props.stakeProgram,
        user,
        userPoolToken: props.userPoolToken,
      },
      {
        amount: props.amount,
      },
    )
    const transaction = new Transaction().add(instruction)

    return {
      transaction,
      user,
      collateral,
    }
  }

  async initOracle(props: InitOracleProps) {
    const payer = this.wallet.publicKey
    const pool = props.pool
    const ix = createInitOracleInstruction(
      {
        authority: payer,
        oracle: props.oracle,
        oracleAuthority: props.oracleAuthority,
        pool,
      },
    )
    const tx = new Transaction().add(ix)

    return {
      tx,
    }
  }

  async closeOracle(props: CloseOracleProps) {
    const payer = this.wallet.publicKey
    const pool = props.pool
    const ix = createCloseOracleInstruction(
      {
        authority: payer,
        oracle: props.oracle,
        pool,
      },
    )
    const tx = new Transaction().add(ix)

    return {
      tx,
    }
  }
}

class OmnisolPDA {
  poolAuthority = (pool: Address) => this.pda([
    new web3.PublicKey(pool).toBuffer(),
  ])

  whitelist = (token: Address) => this.pda([
    Buffer.from(WHITELIST_SEED_PREFIX),
    new web3.PublicKey(token).toBuffer(),
  ])

  user = (user_wallet: Address) => this.pda([
    Buffer.from(USER_SEED_PREFIX),
    new web3.PublicKey(user_wallet).toBuffer(),
  ])

  collateral = (sourceStake: Address, user: Address) => this.pda([
    Buffer.from(COLLATERAL_SEED_PREFIX),
    new web3.PublicKey(user).toBuffer(),
    new web3.PublicKey(sourceStake).toBuffer(),
  ])

  manager = (wallet: Address) => this.pda([
    Buffer.from(MANAGER_SEED_PREFIX),
    new web3.PublicKey(wallet).toBuffer(),
  ])

  private async pda(seeds: Array<Buffer | Uint8Array>) {
    return await web3.PublicKey.findProgramAddress(seeds, OmnisolClient.programId)
  }
}

export interface Wallet {
  signTransaction(tx: Transaction): Promise<Transaction>
  signAllTransactions(txs: Transaction[]): Promise<Transaction[]>
  publicKey: PublicKey
}

interface OmnisolClientProps {
  wallet: Wallet
  program: Program<typeof IDL>
}

interface CreateGlobalPoolProps {
  pool: PublicKey
  mint: PublicKey
}

interface CloseGlobalPoolProps {
  pool: PublicKey
}

interface PauseGlobalPoolProps {
  pool: PublicKey
}

interface ResumeGlobalPoolProps {
  pool: PublicKey
}

interface AddToWhitelistProps {
  pool: PublicKey
  token: PublicKey
}

interface RemoveFromWhitelistProps {
  pool: PublicKey
  token: PublicKey
}

interface BlockUserProps {
  pool: PublicKey
  user_wallet: PublicKey
}

interface UnblockUserProps {
  pool: PublicKey
  user_wallet: PublicKey
}

interface DepositLPTokenProps {
  pool: PublicKey
  lpToken: PublicKey
  source: PublicKey
  destination: PublicKey
  amount: BN
}

interface DepositStakeProps {
  pool: PublicKey
  sourceStake: PublicKey
}

interface MintOmnisolProps {
  pool: PublicKey
  poolMint: PublicKey
  userPoolToken: PublicKey
  stakedAddress: PublicKey
  amount: BN
}

interface AddManagerProps {
  pool: PublicKey
  manager_wallet: PublicKey
}

interface RemoveManagerProps {
  pool: PublicKey
  manager_wallet: PublicKey
}

interface WithdrawLPProps {
  pool: PublicKey
  poolMint: PublicKey
  userPoolToken: PublicKey
  lpToken: PublicKey
  source: PublicKey
  destination: PublicKey
  amount: BN
}

interface WithdrawStakeProps {
  pool: PublicKey
  poolMint: PublicKey
  userPoolToken: PublicKey
  stakeAccount: PublicKey
  splitStake: PublicKey
  stakeProgram: PublicKey
  amount: BN
}

interface InitOracleProps {
  pool: PublicKey
  oracle: PublicKey
  oracleAuthority: PublicKey
}

interface CloseOracleProps {
  pool: PublicKey
  oracle: PublicKey
}
