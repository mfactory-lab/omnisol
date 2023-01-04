import type { Address, Program } from '@project-serum/anchor'
import type { Commitment } from '@solana/web3.js'
import { PublicKey, Transaction } from '@solana/web3.js'
import { web3 } from '@project-serum/anchor'
import type { InitPoolInstructionAccounts } from './generated'
import { PROGRAM_ID, Pool, createInitPoolInstruction } from './generated'

const COLLATERAL_SEED_PREFIX = 'collateral'

export class OmnisolClient {
  static programId = PROGRAM_ID
  private accounts: InitPoolInstructionAccounts

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
    this.accounts = {
      authority: payer,
      pool: props.pool,
      poolAuthority,
      poolMint: props.mint,
      systemProgram: web3.SystemProgram.programId,
    }
    const instruction = createInitPoolInstruction(
      this.accounts,
      new PublicKey(this.program),
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
