import type { Address, BN, Program } from '@project-serum/anchor'
import type { PublicKey } from '@solana/web3.js'
import { Transaction } from '@solana/web3.js'
import { web3 } from '@project-serum/anchor'
import type { Collateral, Pool, User, Whitelist } from './generated'
import {
  PROGRAM_ID,
  createAddToWhitelistInstruction,
  createBlockUserInstruction,
  createClosePoolInstruction,
  createDepositLpInstruction,
  createDepositStakeInstruction,
  createInitPoolInstruction,
  createMintPoolTokenInstruction,
  createPausePoolInstruction,
  createRemoveFromWhitelistInstruction,
  createResumePoolInstruction, createUnblockUserInstruction,
} from './generated'
import { IDL } from './idl/omnisol'

const COLLATERAL_SEED_PREFIX = 'collateral'
const WHITELIST_SEED_PREFIX = 'whitelist'
const USER_SEED_PREFIX = 'user'

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
      user,
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
      user,
    }
  }

  async depositLPToken(props: DepositLPTokenProps) {
    const payer = this.wallet.publicKey
    const [poolAuthority] = await this.pda.poolAuthority(props.pool)
    const [user] = await this.pda.user(payer)
    const [whitelist] = await this.pda.whitelist(props.lpToken)
    const [collateral, bump] = await this.pda.collateral(props.pool, props.lpToken, user)
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
    const [collateral, bump] = await this.pda.collateral(props.pool, props.sourceStake, user)
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

  async mintPoolTokens(props: MintPoolTokens) {
    const payer = this.wallet.publicKey
    const [poolAuthority] = await this.pda.poolAuthority(props.pool)
    const [user] = await this.pda.user(payer)
    const [collateral] = await this.pda.collateral(props.pool, props.stakedAddress, user)
    const instruction = createMintPoolTokenInstruction(
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

  collateral = (pool: Address, sourceStake: Address, user: Address) => this.pda([
    Buffer.from(COLLATERAL_SEED_PREFIX),
    new web3.PublicKey(user).toBuffer(),
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
  amount: BN
}

interface MintPoolTokens {
  pool: PublicKey
  poolMint: PublicKey
  userPoolToken: PublicKey
  stakedAddress: PublicKey
  amount: BN
}
