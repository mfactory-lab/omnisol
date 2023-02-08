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
 * @category PausePool
 * @category generated
 */
export const pausePoolStruct = new beet.BeetArgsStruct<{
  instructionDiscriminator: number[] /* size: 8 */
}>(
  [['instructionDiscriminator', beet.uniformFixedSizeArray(beet.u8, 8)]],
  'PausePoolInstructionArgs',
)
/**
 * Accounts required by the _pausePool_ instruction
 *
 * @property [_writable_] pool
 * @property [_writable_] manager
 * @property [_writable_, **signer**] authority
 * @category Instructions
 * @category PausePool
 * @category generated
 */
export interface PausePoolInstructionAccounts {
  pool: web3.PublicKey
  manager: web3.PublicKey
  authority: web3.PublicKey
  anchorRemainingAccounts?: web3.AccountMeta[]
}

export const pausePoolInstructionDiscriminator = [
  160, 15, 12, 189, 160, 0, 243, 245,
]

/**
 * Creates a _PausePool_ instruction.
 *
 * @param accounts that will be accessed while the instruction is processed
 * @category Instructions
 * @category PausePool
 * @category generated
 */
export function createPausePoolInstruction(
  accounts: PausePoolInstructionAccounts,
  programId = new web3.PublicKey('9SfbhzHrx5xczfoiTo2VVpG5oukcS5Schgy2ppLH3zQd'),
) {
  const [data] = pausePoolStruct.serialize({
    instructionDiscriminator: pausePoolInstructionDiscriminator,
  })
  const keys: web3.AccountMeta[] = [
    {
      pubkey: accounts.pool,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: accounts.manager,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: accounts.authority,
      isWritable: true,
      isSigner: true,
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
