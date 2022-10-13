import { AnchorProvider } from '@project-serum/anchor'
import { PublicKey, Transaction } from '@solana/web3.js'

const PROGRAM_ID = PublicKey.default;

export class OmnisolClient {
  programId = PROGRAM_ID

  constructor(
    private readonly provider: AnchorProvider,
  ) {}
}

export interface Wallet {
  signTransaction(tx: Transaction): Promise<Transaction>
  signAllTransactions(txs: Transaction[]): Promise<Transaction[]>
  publicKey: PublicKey
}
