# Omnisol CLI v.0.0.1

CLI with Omnisol program endpoints.

# Commands

```bash
pnpm cli -c <CLUSTER> -k <PATH_TO_PRIVATE_KEY> -l <LOG_LEVEL> <COMMAND>
```

CLUSTER - (mainnet-beta, testnet, devnet) - devnet is a default value

PATH_TO_PRIVATE_KEY - default value is ${process.env.HOME}/.config/solana/id.json

LOG_LEVEL - change the log level (info, error, warn)

COMMAND - the main command, that classify the request to Omnisol contract

### Example

```bash
pnpm cli -c testnet manager add
```

Run cli with testnet cluster and command (manager add)

```bash
pnpm cli manager add
```

Run cli with default devnet cluster and command (manager add)

> NOTES: User need to add one or several required and optional arguments to the command. To understand what exactly user need to write, add -h or --help.

```bash
pnpm cli manager add -h
```

-------------------------------------------------------
Pool
-------------------------------------------------------

Create pool (manager)
```bash
pnpm cli pool create
```
Pause pool (manager)
```bash
pnpm cli pool pause
```
Resume pool (manager)
```bash
pnpm cli pool resume
```
Close pool (pool manager)
```bash
pnpm cli pool close
```
Show pool data (user)
```bash
pnpm cli pool show
```
Update pool (manager)
```bash
pnpm cli pool update
```

-------------------------------------------------------
Liquidator
-------------------------------------------------------

Add liquidator (manager)
```bash
pnpm cli liquidator add
```
Remove liquidator (manager)
```bash
pnpm cli liquidator remove
```
Show liquidator data (user)
```bash
pnpm cli liquidator show
```

-------------------------------------------------------
Manager
-------------------------------------------------------

Add manager (admin)
```bash
pnpm cli manager add
```
Remove manager (admin)
```bash
pnpm cli manager remove
```
Show manager data (user)
```bash
pnpm cli manager show
```

-------------------------------------------------------
Whitelist
-------------------------------------------------------

Add token to whitelist (manager)
```bash
pnpm cli whitelist add
```
Remove token from whitelist (manager)
```bash
pnpm cli whitelist remove
```
Show whitelisted token data (user)
```bash
pnpm cli whitelist show
```

-------------------------------------------------------
User
-------------------------------------------------------

Block user (manager)
```bash
pnpm cli user block
```
Unblock user (manager)
```bash
pnpm cli user unblock
```
Find user by wallet and show data (user)
```bash
pnpm cli user find
```
Show user data by PDA address (user)
```bash
pnpm cli user show
```

-------------------------------------------------------
Oracle
-------------------------------------------------------

Initialize oracle (admin)
```bash
pnpm cli oracle init
```
Close oracle PDA (admin)
```bash
pnpm cli oracle close
```
Show oracle data (user)
```bash
pnpm cli oracle show
```

-------------------------------------------------------
Deposit
-------------------------------------------------------

Deposit stake account (user)
```bash
pnpm cli deposit stake
```
Deposit liquidity pool token (user)
```bash
pnpm cli deposit lp-token
```

-------------------------------------------------------
Withdraw
-------------------------------------------------------

Withdraw stake account from your collateral (user)
```bash
pnpm cli withdraw stake
```
Withdraw liquidity pool token from your collateral (user)
```bash
pnpm cli withdraw lp-token
```

-------------------------------------------------------
Burn
-------------------------------------------------------

Burn Omnisol token to create withdraw request (user)
```bash
pnpm cli burn
```

-------------------------------------------------------
Mint
-------------------------------------------------------

Mint Omnisol token from your collateral (user)
```bash
pnpm cli mint
```

-------------------------------------------------------
Collateral
-------------------------------------------------------

Find collateral's PDA address by source stake and user PDA addresses and show data (user)
```bash
pnpm cli collateral find
```
Show collateral's data (user)
```bash
pnpm cli collateral show
```

-------------------------------------------------------
WithdrawInfo
-------------------------------------------------------

Show withdraw request's data (user)
```bash
pnpm cli withdrawInfo show
```
