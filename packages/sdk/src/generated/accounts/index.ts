import { Pool } from './Pool'
import { Oracle } from './Oracle'
import { Collateral } from './Collateral'
import { Whitelist } from './Whitelist'
import { WithdrawInfo } from './WithdrawInfo'
import { Liquidator } from './Liquidator'
import { Manager } from './Manager'
import { User } from './User'

export * from './Collateral'
export * from './Liquidator'
export * from './Manager'
export * from './Oracle'
export * from './Pool'
export * from './User'
export * from './Whitelist'
export * from './WithdrawInfo'

export const accountProviders = {
  Pool,
  Oracle,
  Collateral,
  Whitelist,
  WithdrawInfo,
  Liquidator,
  Manager,
  User,
}
