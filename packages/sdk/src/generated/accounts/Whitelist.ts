/**
 * This code was GENERATED using the solita package.
 * Please DO NOT EDIT THIS FILE, instead rerun solita to update it or write a wrapper to add functionality.
 *
 * See: https://github.com/metaplex-foundation/solita
 */

import * as web3 from '@solana/web3.js'
import * as beetSolana from '@metaplex-foundation/beet-solana'
import * as beet from '@metaplex-foundation/beet'

/**
 * Arguments used to create {@link Whitelist}
 * @category Accounts
 * @category generated
 */
export interface WhitelistArgs {
  whitelistedToken: web3.PublicKey
  pool: web3.PublicKey
}

export const whitelistDiscriminator = [204, 176, 52, 79, 146, 121, 54, 247]
/**
 * Holds the data for the {@link Whitelist} Account and provides de/serialization
 * functionality for that data
 *
 * @category Accounts
 * @category generated
 */
export class Whitelist implements WhitelistArgs {
  private constructor(
    readonly whitelistedToken: web3.PublicKey,
    readonly pool: web3.PublicKey,
  ) {}

  /**
   * Creates a {@link Whitelist} instance from the provided args.
   */
  static fromArgs(args: WhitelistArgs) {
    return new Whitelist(args.whitelistedToken, args.pool)
  }

  /**
   * Deserializes the {@link Whitelist} from the data of the provided {@link web3.AccountInfo}.
   * @returns a tuple of the account data and the offset up to which the buffer was read to obtain it.
   */
  static fromAccountInfo(
    accountInfo: web3.AccountInfo<Buffer>,
    offset = 0,
  ): [Whitelist, number] {
    return Whitelist.deserialize(accountInfo.data, offset)
  }

  /**
   * Retrieves the account info from the provided address and deserializes
   * the {@link Whitelist} from its data.
   *
   * @throws Error if no account info is found at the address or if deserialization fails
   */
  static async fromAccountAddress(
    connection: web3.Connection,
    address: web3.PublicKey,
    commitmentOrConfig?: web3.Commitment | web3.GetAccountInfoConfig,
  ): Promise<Whitelist> {
    const accountInfo = await connection.getAccountInfo(
      address,
      commitmentOrConfig,
    )
    if (accountInfo == null) {
      throw new Error(`Unable to find Whitelist account at ${address}`)
    }
    return Whitelist.fromAccountInfo(accountInfo, 0)[0]
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
    return beetSolana.GpaBuilder.fromStruct(programId, whitelistBeet)
  }

  /**
   * Deserializes the {@link Whitelist} from the provided data Buffer.
   * @returns a tuple of the account data and the offset up to which the buffer was read to obtain it.
   */
  static deserialize(buf: Buffer, offset = 0): [Whitelist, number] {
    return whitelistBeet.deserialize(buf, offset)
  }

  /**
   * Serializes the {@link Whitelist} into a Buffer.
   * @returns a tuple of the created Buffer and the offset up to which the buffer was written to store it.
   */
  serialize(): [Buffer, number] {
    return whitelistBeet.serialize({
      accountDiscriminator: whitelistDiscriminator,
      ...this,
    })
  }

  /**
   * Returns the byteSize of a {@link Buffer} holding the serialized data of
   * {@link Whitelist}
   */
  static get byteSize() {
    return whitelistBeet.byteSize
  }

  /**
   * Fetches the minimum balance needed to exempt an account holding
   * {@link Whitelist} data from rent
   *
   * @param connection used to retrieve the rent exemption information
   */
  static async getMinimumBalanceForRentExemption(
    connection: web3.Connection,
    commitment?: web3.Commitment,
  ): Promise<number> {
    return connection.getMinimumBalanceForRentExemption(
      Whitelist.byteSize,
      commitment,
    )
  }

  /**
   * Determines if the provided {@link Buffer} has the correct byte size to
   * hold {@link Whitelist} data.
   */
  static hasCorrectByteSize(buf: Buffer, offset = 0) {
    return buf.byteLength - offset === Whitelist.byteSize
  }

  /**
   * Returns a readable version of {@link Whitelist} properties
   * and can be used to convert to JSON and/or logging
   */
  pretty() {
    return {
      whitelistedToken: this.whitelistedToken.toBase58(),
      pool: this.pool.toBase58(),
    }
  }
}

/**
 * @category Accounts
 * @category generated
 */
export const whitelistBeet = new beet.BeetStruct<
  Whitelist,
  WhitelistArgs & {
    accountDiscriminator: number[] /* size: 8 */
  }
>(
  [
    ['accountDiscriminator', beet.uniformFixedSizeArray(beet.u8, 8)],
    ['whitelistedToken', beetSolana.publicKey],
    ['pool', beetSolana.publicKey],
  ],
  Whitelist.fromArgs,
  'Whitelist',
)
