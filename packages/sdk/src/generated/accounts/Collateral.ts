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
 * Arguments used to create {@link Collateral}
 * @category Accounts
 * @category generated
 */
export interface CollateralArgs {
  user: web3.PublicKey
  pool: web3.PublicKey
  sourceStake: web3.PublicKey
  delegationStake: beet.bignum
  amount: beet.bignum
  createdAt: beet.bignum
  bump: number
  isNative: boolean
}

export const collateralDiscriminator = [123, 130, 234, 63, 255, 240, 255, 92]
/**
 * Holds the data for the {@link Collateral} Account and provides de/serialization
 * functionality for that data
 *
 * @category Accounts
 * @category generated
 */
export class Collateral implements CollateralArgs {
  private constructor(
    readonly user: web3.PublicKey,
    readonly pool: web3.PublicKey,
    readonly sourceStake: web3.PublicKey,
    readonly delegationStake: beet.bignum,
    readonly amount: beet.bignum,
    readonly createdAt: beet.bignum,
    readonly bump: number,
    readonly isNative: boolean,
  ) {}

  /**
   * Creates a {@link Collateral} instance from the provided args.
   */
  static fromArgs(args: CollateralArgs) {
    return new Collateral(
      args.user,
      args.pool,
      args.sourceStake,
      args.delegationStake,
      args.amount,
      args.createdAt,
      args.bump,
      args.isNative,
    )
  }

  /**
   * Deserializes the {@link Collateral} from the data of the provided {@link web3.AccountInfo}.
   * @returns a tuple of the account data and the offset up to which the buffer was read to obtain it.
   */
  static fromAccountInfo(
    accountInfo: web3.AccountInfo<Buffer>,
    offset = 0,
  ): [Collateral, number] {
    return Collateral.deserialize(accountInfo.data, offset)
  }

  /**
   * Retrieves the account info from the provided address and deserializes
   * the {@link Collateral} from its data.
   *
   * @throws Error if no account info is found at the address or if deserialization fails
   */
  static async fromAccountAddress(
    connection: web3.Connection,
    address: web3.PublicKey,
    commitmentOrConfig?: web3.Commitment | web3.GetAccountInfoConfig,
  ): Promise<Collateral> {
    const accountInfo = await connection.getAccountInfo(
      address,
      commitmentOrConfig,
    )
    if (accountInfo == null) {
      throw new Error(`Unable to find Collateral account at ${address}`)
    }
    return Collateral.fromAccountInfo(accountInfo, 0)[0]
  }

  /**
   * Provides a {@link web3.Connection.getProgramAccounts} config builder,
   * to fetch accounts matching filters that can be specified via that builder.
   *
   * @param programId - the program that owns the accounts we are filtering
   */
  static gpaBuilder(
    programId: web3.PublicKey = new web3.PublicKey(
      '9SfbhzHrx5xczfoiTo2VVpG5oukcS5Schgy2ppLH3zQd',
    ),
  ) {
    return beetSolana.GpaBuilder.fromStruct(programId, collateralBeet)
  }

  /**
   * Deserializes the {@link Collateral} from the provided data Buffer.
   * @returns a tuple of the account data and the offset up to which the buffer was read to obtain it.
   */
  static deserialize(buf: Buffer, offset = 0): [Collateral, number] {
    return collateralBeet.deserialize(buf, offset)
  }

  /**
   * Serializes the {@link Collateral} into a Buffer.
   * @returns a tuple of the created Buffer and the offset up to which the buffer was written to store it.
   */
  serialize(): [Buffer, number] {
    return collateralBeet.serialize({
      accountDiscriminator: collateralDiscriminator,
      ...this,
    })
  }

  /**
   * Returns the byteSize of a {@link Buffer} holding the serialized data of
   * {@link Collateral}
   */
  static get byteSize() {
    return collateralBeet.byteSize
  }

  /**
   * Fetches the minimum balance needed to exempt an account holding
   * {@link Collateral} data from rent
   *
   * @param connection used to retrieve the rent exemption information
   */
  static async getMinimumBalanceForRentExemption(
    connection: web3.Connection,
    commitment?: web3.Commitment,
  ): Promise<number> {
    return connection.getMinimumBalanceForRentExemption(
      Collateral.byteSize,
      commitment,
    )
  }

  /**
   * Determines if the provided {@link Buffer} has the correct byte size to
   * hold {@link Collateral} data.
   */
  static hasCorrectByteSize(buf: Buffer, offset = 0) {
    return buf.byteLength - offset === Collateral.byteSize
  }

  /**
   * Returns a readable version of {@link Collateral} properties
   * and can be used to convert to JSON and/or logging
   */
  pretty() {
    return {
      user: this.user.toBase58(),
      pool: this.pool.toBase58(),
      sourceStake: this.sourceStake.toBase58(),
      delegationStake: (() => {
        const x = <{ toNumber: () => number }> this.delegationStake
        if (typeof x.toNumber === 'function') {
          try {
            return x.toNumber()
          } catch (_) {
            return x
          }
        }
        return x
      })(),
      amount: (() => {
        const x = <{ toNumber: () => number }> this.amount
        if (typeof x.toNumber === 'function') {
          try {
            return x.toNumber()
          } catch (_) {
            return x
          }
        }
        return x
      })(),
      createdAt: (() => {
        const x = <{ toNumber: () => number }> this.createdAt
        if (typeof x.toNumber === 'function') {
          try {
            return x.toNumber()
          } catch (_) {
            return x
          }
        }
        return x
      })(),
      bump: this.bump,
      isNative: this.isNative,
    }
  }
}

/**
 * @category Accounts
 * @category generated
 */
export const collateralBeet = new beet.BeetStruct<
  Collateral,
  CollateralArgs & {
    accountDiscriminator: number[] /* size: 8 */
  }
>(
  [
    ['accountDiscriminator', beet.uniformFixedSizeArray(beet.u8, 8)],
    ['user', beetSolana.publicKey],
    ['pool', beetSolana.publicKey],
    ['sourceStake', beetSolana.publicKey],
    ['delegationStake', beet.u64],
    ['amount', beet.u64],
    ['createdAt', beet.i64],
    ['bump', beet.u8],
    ['isNative', beet.bool],
  ],
  Collateral.fromArgs,
  'Collateral',
)
