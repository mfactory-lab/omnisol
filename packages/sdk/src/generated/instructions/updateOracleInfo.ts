/**
 * This code was GENERATED using the solita package.
 * Please DO NOT EDIT THIS FILE, instead rerun solita to update it or write a wrapper to add functionality.
 *
 * See: https://github.com/metaplex-foundation/solita
 */

import * as web3 from '@solana/web3.js'
import * as beet from '@metaplex-foundation/beet'
import * as beetSolana from '@metaplex-foundation/beet-solana'

/**
 * @category Instructions
 * @category UpdateOracleInfo
 * @category generated
 */
export interface UpdateOracleInfoInstructionArgs {
  addresses: web3.PublicKey[]
  values: beet.bignum[]
}
/**
 * @category Instructions
 * @category UpdateOracleInfo
 * @category generated
 */
export const updateOracleInfoStruct = new beet.FixableBeetArgsStruct<
  UpdateOracleInfoInstructionArgs & {
    instructionDiscriminator: number[] /* size: 8 */
  }
>(
  [
    ['instructionDiscriminator', beet.uniformFixedSizeArray(beet.u8, 8)],
    ['addresses', beet.array(beetSolana.publicKey)],
    ['values', beet.array(beet.u64)],
  ],
  'UpdateOracleInfoInstructionArgs',
)
/**
 * Accounts required by the _updateOracleInfo_ instruction
 *
 * @property [_writable_, **signer**] authority
 * @property [_writable_] oracle
 * @category Instructions
 * @category UpdateOracleInfo
 * @category generated
 */
export interface UpdateOracleInfoInstructionAccounts {
  authority: web3.PublicKey
  oracle: web3.PublicKey
  systemProgram?: web3.PublicKey
  anchorRemainingAccounts?: web3.AccountMeta[]
}

export const updateOracleInfoInstructionDiscriminator = [
  164, 24, 241, 250, 136, 128, 30, 227,
]

/**
 * Creates a _UpdateOracleInfo_ instruction.
 *
 * @param accounts that will be accessed while the instruction is processed
 * @param args to provide as instruction data to the program
 *
 * @category Instructions
 * @category UpdateOracleInfo
 * @category generated
 */
export function createUpdateOracleInfoInstruction(
  accounts: UpdateOracleInfoInstructionAccounts,
  args: UpdateOracleInfoInstructionArgs,
  programId = new web3.PublicKey('9SfbhzHrx5xczfoiTo2VVpG5oukcS5Schgy2ppLH3zQd'),
) {
  const [data] = updateOracleInfoStruct.serialize({
    instructionDiscriminator: updateOracleInfoInstructionDiscriminator,
    ...args,
  })
  const keys: web3.AccountMeta[] = [
    {
      pubkey: accounts.authority,
      isWritable: true,
      isSigner: true,
    },
    {
      pubkey: accounts.oracle,
      isWritable: true,
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