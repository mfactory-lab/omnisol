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
 * @category InitPool
 * @category generated
 */
export const initPoolStruct = new beet.BeetArgsStruct<{
  instructionDiscriminator: number[] /* size: 8 */
}>(
  [['instructionDiscriminator', beet.uniformFixedSizeArray(beet.u8, 8)]],
  'InitPoolInstructionArgs',
)
/**
 * Accounts required by the _initPool_ instruction
 *
 * @property [_writable_, **signer**] pool
 * @property [_writable_] poolMint
 * @property [] poolAuthority
 * @property [] mintAuthority
 * @property [] stakeSource
 * @property [_writable_, **signer**] authority
 * @category Instructions
 * @category InitPool
 * @category generated
 */
export interface InitPoolInstructionAccounts {
  pool: web3.PublicKey
  poolMint: web3.PublicKey
  poolAuthority: web3.PublicKey
  mintAuthority: web3.PublicKey
  stakeSource: web3.PublicKey
  authority: web3.PublicKey
  systemProgram?: web3.PublicKey
  anchorRemainingAccounts?: web3.AccountMeta[]
}

export const initPoolInstructionDiscriminator = [
  116, 233, 199, 204, 115, 159, 171, 36,
]

/**
 * Creates a _InitPool_ instruction.
 *
 * @param accounts that will be accessed while the instruction is processed
 * @category Instructions
 * @category InitPool
 * @category generated
 */
export function createInitPoolInstruction(
  accounts: InitPoolInstructionAccounts,
  programId = new web3.PublicKey('6sccaGNYx7RSjVgFD13UKE7dyUiNavr2KXgeqaQvZUz7'),
) {
  const [data] = initPoolStruct.serialize({
    instructionDiscriminator: initPoolInstructionDiscriminator,
  })
  const keys: web3.AccountMeta[] = [
    {
      pubkey: accounts.pool,
      isWritable: true,
      isSigner: true,
    },
    {
      pubkey: accounts.poolMint,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: accounts.poolAuthority,
      isWritable: false,
      isSigner: false,
    },
    {
      pubkey: accounts.mintAuthority,
      isWritable: false,
      isSigner: false,
    },
    {
      pubkey: accounts.stakeSource,
      isWritable: false,
      isSigner: false,
    },
    {
      pubkey: accounts.authority,
      isWritable: true,
      isSigner: true,
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
