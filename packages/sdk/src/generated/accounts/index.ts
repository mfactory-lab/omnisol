import { Pool } from './Pool'
import { Oracle } from './Oracle'
import { Collateral } from './Collateral'
import { Whitelist } from './Whitelist'
import { Manager } from './Manager'
import { User } from './User'

export * from './Collateral'
export * from './Manager'
export * from './Oracle'
export * from './Pool'
export * from './User'
export * from './Whitelist'

export const accountProviders = {
  Pool,
  Oracle,
  Collateral,
  Whitelist,
  Manager,
  User,
}
