import type { Address, BN, Program } from '@project-serum/anchor'
import type { Commitment } from '@solana/web3.js'
import { PublicKey, Transaction } from '@solana/web3.js'
import { web3 } from '@project-serum/anchor'
import {
  PROGRAM_ID,
  Pool,
  createClosePoolInstruction,
  createDepositStakeInstruction,
  createInitPoolInstruction, createWithdrawStakeInstruction, createWithdrawSolInstruction,
} from './generated'

const COLLATERAL_SEED_PREFIX = 'collateral'

export class OmnisolClient {
  static programId = PROGRAM_ID

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
    const [poolAuthority] = await this.pda.poolAuthority(props.pool)
    const instruction = createInitPoolInstruction(
      {
        authority: payer,
        pool: props.pool,
        poolAuthority,
        poolMint: props.mint,
      },
    )
    const transaction = new Transaction().add(instruction)

    return {
      transaction,
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
    const transaction = new Transaction().add(instruction)

    return {
      transaction,
    }
  }

  async depositStake(props: DepositStakeProps) {
    const payer = this.wallet.publicKey
    const instruction = createDepositStakeInstruction(
      {
        pool: props.pool,
        poolMint: props.poolMint,
        poolAuthority: props.poolAuthority,
        collateral: props.collateral,
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

  async fetchGlobalPool(address: Address) {
    return await Pool.fromAccountAddress(
      this.props.connection,
      new PublicKey(address),
      this.props.commitment,
    )
  }
}

class OmnisolPDA {
  poolAuthority = (pool: Address) => this.pda([
    new web3.PublicKey(pool).toBuffer(),
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
  program: Program
  connection: web3.Connection
  commitment: Commitment
}

interface CreateGlobalPoolProps {
  pool: PublicKey
  mint: PublicKey
}

interface CloseGlobalPoolProps {
  pool: PublicKey
}

interface DepositStakeProps {
  pool: PublicKey
  poolMint: PublicKey
  poolAuthority: PublicKey
  collateral: PublicKey
  userPoolToken: PublicKey
  sourceStake: PublicKey
  splitStake: PublicKey
  authority: PublicKey
  clock: PublicKey
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
