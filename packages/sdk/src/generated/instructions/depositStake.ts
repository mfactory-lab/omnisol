/**
 * This code was GENERATED using the solita package.
 * Please DO NOT EDIT THIS FILE, instead rerun solita to update it or write a wrapper to add functionality.
 *
 * See: https://github.com/metaplex-foundation/solita
 */

import * as beet from '@metaplex-foundation/beet'
import * as web3 from '@solana/web3.js'

/**
 * @category Instructions
 * @category DepositStake
 * @category generated
 */
export const depositStakeStruct = new beet.BeetArgsStruct<{
  instructionDiscriminator: number[] /* size: 8 */
}>(
  [['instructionDiscriminator', beet.uniformFixedSizeArray(beet.u8, 8)]],
  'DepositStakeInstructionArgs',
)
/**
 * Accounts required by the _depositStake_ instruction
 *
 * @property [_writable_] pool
 * @property [] poolAuthority
 * @property [_writable_] user
 * @property [_writable_] collateral
 * @property [_writable_] sourceStake
 * @property [_writable_, **signer**] authority
 * @property [] clock
 * @property [] stakeProgram
 * @category Instructions
 * @category DepositStake
 * @category generated
 */
export interface DepositStakeInstructionAccounts {
  pool: web3.PublicKey
  poolAuthority: web3.PublicKey
  user: web3.PublicKey
  collateral: web3.PublicKey
  sourceStake: web3.PublicKey
  authority: web3.PublicKey
  clock: web3.PublicKey
  stakeProgram: web3.PublicKey
  systemProgram?: web3.PublicKey
  anchorRemainingAccounts?: web3.AccountMeta[]
}

export const depositStakeInstructionDiscriminator = [
  160, 167, 9, 220, 74, 243, 228, 43,
]

/**
 * Creates a _DepositStake_ instruction.
 *
 * @param accounts that will be accessed while the instruction is processed
 * @category Instructions
 * @category DepositStake
 * @category generated
 */
export function createDepositStakeInstruction(
  accounts: DepositStakeInstructionAccounts,
  programId = new web3.PublicKey('6sccaGNYx7RSjVgFD13UKE7dyUiNavr2KXgeqaQvZUz7'),
) {
  const [data] = depositStakeStruct.serialize({
    instructionDiscriminator: depositStakeInstructionDiscriminator,
  })
  const keys: web3.AccountMeta[] = [
    {
      pubkey: accounts.pool,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: accounts.poolAuthority,
      isWritable: false,
      isSigner: false,
    },
    {
      pubkey: accounts.user,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: accounts.collateral,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: accounts.sourceStake,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: accounts.authority,
      isWritable: true,
      isSigner: true,
    },
    {
      pubkey: accounts.clock,
      isWritable: false,
      isSigner: false,
    },
    {
      pubkey: accounts.stakeProgram,
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
