/**
 * This code was GENERATED using the solita package.
 * Please DO NOT EDIT THIS FILE, instead rerun solita to update it or write a wrapper to add functionality.
 *
 * See: https://github.com/metaplex-foundation/solita
 */

import * as beet from '@metaplex-foundation/beet'
import * as web3 from '@solana/web3.js'
import * as beetSolana from '@metaplex-foundation/beet-solana'

/**
 * @category Instructions
 * @category SetLiquidationFee
 * @category generated
 */
export interface SetLiquidationFeeInstructionArgs {
  fee: beet.COption<number>
  feeReceiver: beet.COption<web3.PublicKey>
}
/**
 * @category Instructions
 * @category SetLiquidationFee
 * @category generated
 */
export const setLiquidationFeeStruct = new beet.FixableBeetArgsStruct<
  SetLiquidationFeeInstructionArgs & {
    instructionDiscriminator: number[] /* size: 8 */
  }
>(
  [
    ['instructionDiscriminator', beet.uniformFixedSizeArray(beet.u8, 8)],
    ['fee', beet.coption(beet.u16)],
    ['feeReceiver', beet.coption(beetSolana.publicKey)],
  ],
  'SetLiquidationFeeInstructionArgs',
)
/**
 * Accounts required by the _setLiquidationFee_ instruction
 *
 * @property [_writable_] liquidationFee
 * @property [_writable_] manager
 * @property [_writable_, **signer**] authority
 * @category Instructions
 * @category SetLiquidationFee
 * @category generated
 */
export interface SetLiquidationFeeInstructionAccounts {
  liquidationFee: web3.PublicKey
  manager: web3.PublicKey
  authority: web3.PublicKey
  systemProgram?: web3.PublicKey
  anchorRemainingAccounts?: web3.AccountMeta[]
}

export const setLiquidationFeeInstructionDiscriminator = [
  23, 215, 203, 90, 133, 247, 235, 183,
]

/**
 * Creates a _SetLiquidationFee_ instruction.
 *
 * @param accounts that will be accessed while the instruction is processed
 * @param args to provide as instruction data to the program
 *
 * @category Instructions
 * @category SetLiquidationFee
 * @category generated
 */
export function createSetLiquidationFeeInstruction(
  accounts: SetLiquidationFeeInstructionAccounts,
  args: SetLiquidationFeeInstructionArgs,
  programId = new web3.PublicKey('6sccaGNYx7RSjVgFD13UKE7dyUiNavr2KXgeqaQvZUz7'),
) {
  const [data] = setLiquidationFeeStruct.serialize({
    instructionDiscriminator: setLiquidationFeeInstructionDiscriminator,
    ...args,
  })
  const keys: web3.AccountMeta[] = [
    {
      pubkey: accounts.liquidationFee,
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