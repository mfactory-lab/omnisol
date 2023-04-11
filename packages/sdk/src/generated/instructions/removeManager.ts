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
 * @category RemoveManager
 * @category generated
 */
export const removeManagerStruct = new beet.BeetArgsStruct<{
  instructionDiscriminator: number[] /* size: 8 */
}>(
  [['instructionDiscriminator', beet.uniformFixedSizeArray(beet.u8, 8)]],
  'RemoveManagerInstructionArgs',
)
/**
 * Accounts required by the _removeManager_ instruction
 *
 * @property [_writable_, **signer**] authority
 * @property [_writable_] manager
 * @property [] managerWallet
 * @category Instructions
 * @category RemoveManager
 * @category generated
 */
export interface RemoveManagerInstructionAccounts {
  authority: web3.PublicKey
  manager: web3.PublicKey
  managerWallet: web3.PublicKey
  systemProgram?: web3.PublicKey
  anchorRemainingAccounts?: web3.AccountMeta[]
}

export const removeManagerInstructionDiscriminator = [
  150, 55, 157, 77, 128, 148, 7, 15,
]

/**
 * Creates a _RemoveManager_ instruction.
 *
 * @param accounts that will be accessed while the instruction is processed
 * @category Instructions
 * @category RemoveManager
 * @category generated
 */
export function createRemoveManagerInstruction(
  accounts: RemoveManagerInstructionAccounts,
  programId = new web3.PublicKey('DMG9gp5VHPVpA3bst6yhC4L4D4aZiUjUTibVQGvJzpjy'),
) {
  const [data] = removeManagerStruct.serialize({
    instructionDiscriminator: removeManagerInstructionDiscriminator,
  })
  const keys: web3.AccountMeta[] = [
    {
      pubkey: accounts.authority,
      isWritable: true,
      isSigner: true,
    },
    {
      pubkey: accounts.manager,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: accounts.managerWallet,
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
