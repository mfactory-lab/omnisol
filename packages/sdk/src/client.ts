import type { Address, BN, Program } from '@project-serum/anchor'
import type { PublicKey } from '@solana/web3.js'
import { Transaction } from '@solana/web3.js'
import { web3 } from '@project-serum/anchor'
import type { Pool, Whitelist } from './generated'
import {
  PROGRAM_ID,
  createAddToWhitelistInstruction,
  createBlockUserInstruction,
  createClosePoolInstruction,
  createDepositStakeInstruction,
  createInitPoolInstruction,
  createPausePoolInstruction,
  createRemoveFromWhitelistInstruction,
  createResumePoolInstruction,
  createUnblockUserInstruction,
  createWithdrawSolInstruction,
  createWithdrawStakeInstruction,
} from './generated'
import { IDL } from './idl/omnisol'

const COLLATERAL_SEED_PREFIX = 'collateral'
const WHITELIST_SEED_PREFIX = 'whitelist'
const USER_SEED_PREFIX = 'user'

export class OmnisolClient {
  static programId = PROGRAM_ID
  static IDL = IDL

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

  async fetchGlobalPool(address: Address) {
    return await this.program.account.pool.fetchNullable(address) as unknown as Pool
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
    const instruction = createPausePoolInstruction(
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

  async resumeGlobalPool(props: ResumeGlobalPoolProps) {
    const payer = this.wallet.publicKey
    const instruction = createResumePoolInstruction(
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

  async addToWhitelist(props: AddToWhitelistProps) {
    const payer = this.wallet.publicKey
    const [whitelist] = await this.pda.whitelist(props.token)
    const instruction = createAddToWhitelistInstruction(
      {
        addressToWhitelist: props.token,
        authority: payer,
        pool: props.pool,
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
    const instruction = createRemoveFromWhitelistInstruction(
      {
        addressToWhitelist: props.token,
        authority: payer,
        pool: props.pool,
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
    const instruction = createBlockUserInstruction(
      {
        authority: payer,
        pool: props.pool,
        user,
        userWallet: props.user_wallet,
      },
    )
    const tx = new Transaction().add(instruction)

    return {
      tx,
    }
  }

  async unblockUser(props: UnblockUserProps) {
    const payer = this.wallet.publicKey
    const [user] = await this.pda.user(props.user_wallet)
    const instruction = createUnblockUserInstruction(
      {
        authority: payer,
        pool: props.pool,
        user,
        userWallet: props.user_wallet,
      },
    )
    const tx = new Transaction().add(instruction)

    return {
      tx,
    }
  }

  async fetchWhitelist(address: Address) {
    return await this.program.account.whitelist.fetchNullable(address) as unknown as Whitelist
  }

  async depositStake(props: DepositStakeProps) {
    const payer = this.wallet.publicKey
    const [poolAuthority] = await this.pda.poolAuthority(props.pool)
    const [collateral] = await this.pda.collateral(props.pool, props.sourceStake)
    const instruction = createDepositStakeInstruction(
      {
        pool: props.pool,
        poolMint: props.poolMint,
        poolAuthority,
        collateral,
        userPoolToken: props.userPoolToken,
        sourceStake: props.sourceStake,
        splitStake: props.splitStake,
        authority: payer,
        clock: props.clock,
        stakeProgram: props.stakeProgram,
      },
      {
        amount: props.amount,
      },
    )
    const transaction = new Transaction().add(instruction)

    return {
      transaction,
    }
  }

  async withdrawStake(props: WithdrawStakeProps) {
    const payer = this.wallet.publicKey
    const instruction = createWithdrawStakeInstruction(
      {
        pool: props.pool,
        poolMint: props.poolMint,
        poolAuthority: props.poolAuthority,
        collateral: props.collateral,
        destinationStake: props.destinationStake,
        sourceStake: props.sourceStake,
        splitStake: props.splitStake,
        sourceTokenAccount: props.sourceTokenAccount,
        stakeAuthority: props.stakeAuthority,
        authority: payer,
        clock: props.clock,
        stakeHistory: props.stakeHistory,
        stakeProgram: props.stakeProgram,
      },
      {
        amount: props.amount,
      },
    )
    const transaction = new Transaction().add(instruction)

    return {
      transaction,
    }
  }

  async withdrawSol(props: WithdrawSolProps) {
    const payer = this.wallet.publicKey
    const instruction = createWithdrawSolInstruction(
      {
        pool: props.pool,
        poolMint: props.poolMint,
        poolAuthority: props.poolAuthority,
        sourceTokenAccount: props.sourceTokenAccount,
        authority: payer,
        clock: props.clock,
        stakeProgram: props.stakeProgram,
      },
      {
        amount: props.amount,
      },
    )
    const transaction = new Transaction().add(instruction)

    return {
      transaction,
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

  collateral = (pool: Address, sourceStake: Address) => this.pda([
    Buffer.from(COLLATERAL_SEED_PREFIX),
    new web3.PublicKey(pool).toBuffer(),
    new web3.PublicKey(sourceStake).toBuffer(),
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

interface DepositStakeProps {
  pool: PublicKey
  poolMint: PublicKey
  userPoolToken: PublicKey // TODO check
  sourceStake: PublicKey
  splitStake: PublicKey
  authority: PublicKey
  clock: PublicKey // TODO check
  stakeProgram: PublicKey
  amount: BN
}

interface WithdrawStakeProps {
  pool: PublicKey
  poolMint: PublicKey
  poolAuthority: PublicKey
  collateral: PublicKey
  destinationStake: PublicKey
  sourceStake: PublicKey
  splitStake: PublicKey
  sourceTokenAccount: PublicKey
  stakeAuthority: PublicKey
  clock: PublicKey
  stakeHistory: PublicKey
  stakeProgram: PublicKey
  amount: BN
}

interface WithdrawSolProps {
  pool: PublicKey
  poolMint: PublicKey
  poolAuthority: PublicKey
  sourceTokenAccount: PublicKey
  clock: PublicKey
  stakeProgram: PublicKey
  amount: BN
}
