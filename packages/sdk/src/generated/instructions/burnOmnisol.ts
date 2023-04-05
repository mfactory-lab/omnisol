/**
 * This code was GENERATED using the solita package.
 * Please DO NOT EDIT THIS FILE, instead rerun solita to update it or write a wrapper to add functionality.
 *
 * See: https://github.com/metaplex-foundation/solita
 */

import * as splToken from '@solana/spl-token'
import * as beet from '@metaplex-foundation/beet'
import * as web3 from '@solana/web3.js'

/**
 * @category Instructions
 * @category BurnOmnisol
 * @category generated
 */
export interface BurnOmnisolInstructionArgs {
  amount: beet.bignum
}
/**
 * @category Instructions
 * @category BurnOmnisol
 * @category generated
 */
export const burnOmnisolStruct = new beet.BeetArgsStruct<
  BurnOmnisolInstructionArgs & {
    instructionDiscriminator: number[] /* size: 8 */
  }
>(
  [
    ['instructionDiscriminator', beet.uniformFixedSizeArray(beet.u8, 8)],
    ['amount', beet.u64],
  ],
  'BurnOmnisolInstructionArgs',
)
/**
 * Accounts required by the _burnOmnisol_ instruction
 *
 * @property [_writable_] pool
 * @property [_writable_] poolMint
 * @property [_writable_] sourceTokenAccount
 * @property [_writable_, **signer**] authority
 * @property [_writable_] user
 * @property [_writable_] withdrawInfo
 * @property [_writable_] liquidationFee
 * @property [_writable_, **signer**] feePayer
 * @property [_writable_] feeReceiver
 * @property [] clock
 * @category Instructions
 * @category BurnOmnisol
 * @category generated
 */
export interface BurnOmnisolInstructionAccounts {
  pool: web3.PublicKey
  poolMint: web3.PublicKey
  sourceTokenAccount: web3.PublicKey
  authority: web3.PublicKey
  user: web3.PublicKey
  withdrawInfo: web3.PublicKey
  liquidationFee: web3.PublicKey
  feePayer: web3.PublicKey
  feeReceiver: web3.PublicKey
  clock: web3.PublicKey
  tokenProgram?: web3.PublicKey
  systemProgram?: web3.PublicKey
  anchorRemainingAccounts?: web3.AccountMeta[]
}

export const burnOmnisolInstructionDiscriminator = [
  9, 228, 220, 251, 222, 150, 179, 169,
]

/**
 * Creates a _BurnOmnisol_ instruction.
 *
 * @param accounts that will be accessed while the instruction is processed
 * @param args to provide as instruction data to the program
 *
 * @category Instructions
 * @category BurnOmnisol
 * @category generated
 */
export function createBurnOmnisolInstruction(
  accounts: BurnOmnisolInstructionAccounts,
  args: BurnOmnisolInstructionArgs,
  programId = new web3.PublicKey('6sccaGNYx7RSjVgFD13UKE7dyUiNavr2KXgeqaQvZUz7'),
) {
  const [data] = burnOmnisolStruct.serialize({
    instructionDiscriminator: burnOmnisolInstructionDiscriminator,
    ...args,
  })
  const keys: web3.AccountMeta[] = [
    {
      pubkey: accounts.pool,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: accounts.poolMint,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: accounts.sourceTokenAccount,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: accounts.authority,
      isWritable: true,
      isSigner: true,
    },
    {
      pubkey: accounts.user,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: accounts.withdrawInfo,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: accounts.liquidationFee,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: accounts.feePayer,
      isWritable: true,
      isSigner: true,
    },
    {
      pubkey: accounts.feeReceiver,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: accounts.clock,
      isWritable: false,
      isSigner: false,
    },
    {
      pubkey: accounts.tokenProgram ?? splToken.TOKEN_PROGRAM_ID,
      isWritable: false,
      isSigner: false,
    },
    {
      pubkey: accounts.systemProgram ?? web3.SystemProgram.programId,
      isWritable: false,
      isSigner: false,
    },
  ]

  if (accounts.anchorRemainingAccounts != null) {
    for (const acc of accounts.anchorRemainingAccounts) {
      keys.push(acc)
    }
  }

  const ix = new web3.TransactionInstruction({
    programId,
    keys,
    data,
  })
  return ix
}
