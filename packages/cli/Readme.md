# omniSOL CLI v.0.0.1

CLI with omniSOL program endpoints.

# Commands

```bash
pnpm cli -c <CLUSTER> -k <PATH_TO_PRIVATE_KEY> -l <LOG_LEVEL> <COMMAND>
```

CLUSTER: mainnet-beta, testnet or devnet; devnet is the default value

PATH_TO_PRIVATE_KEY: the default value is ${process.env.HOME}/.config/solana/id.json

LOG_LEVEL: info, error or warn

COMMAND: the main command that determines the request that will be sent to the omniSOL contract

### Example

Running the command (manager add) for the Testnet cluster:

```bash
pnpm cli -c testnet manager add
```

Running the command (manager add) for the default Devnet cluster:

```bash
pnpm cli manager add
```

> NOTE: The command takes required and optional arguments. To view them, run it with -h or --help.

```bash
pnpm cli manager add -h
```

-------------------------------------------------------
Pool
-------------------------------------------------------

> NOTE: The parentheses at the end specify a role that can call the instruction. 

Create a pool (manager):

```bash
pnpm cli pool create
```

Pause a pool (manager):

```bash
pnpm cli pool pause
```

Resume a pool (manager):

```bash
pnpm cli pool resume
```

Close a pool (pool manager)

```bash
pnpm cli pool close
```

Show pool data (user):

```bash
pnpm cli pool show
```

Update a pool (manager):

```bash
pnpm cli pool update
```

-------------------------------------------------------
Liquidator
-------------------------------------------------------

Add a liquidator (manager):

```bash
pnpm cli liquidator add
```

Remove a liquidator (manager):

```bash
pnpm cli liquidator remove
```

Show liquidator data (user):

```bash
pnpm cli liquidator show
```

-------------------------------------------------------
Manager
-------------------------------------------------------

Add a manager (admin):

```bash
pnpm cli manager add
```

Remove a manager (admin):

```bash
pnpm cli manager remove
```

Show manager data (user):

```bash
pnpm cli manager show
```

-------------------------------------------------------
Whitelist
-------------------------------------------------------

Add a token to the whitelist (manager):

```bash
pnpm cli whitelist add
```

Remove a token from the whitelist (manager):

```bash
pnpm cli whitelist remove
```

Show whitelisted token data (user):

```bash
pnpm cli whitelist show
```

-------------------------------------------------------
User
-------------------------------------------------------

Block a user (manager):

```bash
pnpm cli user block
```

Unblock a user (manager):

```bash
pnpm cli user unblock
```

Find a user via their wallet address, and show the data (user):

```bash
pnpm cli user find
```

Retrieve user data via PDA address (user):

```bash
pnpm cli user show
```

-------------------------------------------------------
Oracle
-------------------------------------------------------

Initialize Oracle (admin):

```bash
pnpm cli oracle init
```

Close an Oracle PDA (admin):
```bash
pnpm cli oracle close
```

Show Oracle data (user):

```bash
pnpm cli oracle show
```

-------------------------------------------------------
Deposit
-------------------------------------------------------

Deposit a stake account (user):

```bash
pnpm cli deposit stake
```

Deposit a liquidity pool token (user):

```bash
pnpm cli deposit lp-token
```

-------------------------------------------------------
Withdraw
-------------------------------------------------------

Withdraw a stake account from your collateral (user):

```bash
pnpm cli withdraw stake
```

Withdraw a liquidity pool token from your collateral (user):

```bash
pnpm cli withdraw lp-token
```

-------------------------------------------------------
Burn
-------------------------------------------------------

Burn omniSOL tokens to create a withdrawal request (user):
```bash
pnpm cli burn
```

-------------------------------------------------------
Mint
-------------------------------------------------------

Mint omniSOL tokens from your collateral (user):

```bash
pnpm cli mint
```

-------------------------------------------------------
Collateral
-------------------------------------------------------

Find a collateral PDA via source stake and user PDAs, and show the data (user):

```bash
pnpm cli collateral find
```

Show data on a collateral (user):

```bash
pnpm cli collateral show
```

-------------------------------------------------------
WithdrawInfo
-------------------------------------------------------

Show data on a withdrawal request (user):

```bash
pnpm cli withdrawInfo show
```

-------------------------------------------------------
LiquidationFee
-------------------------------------------------------

Set a liquidation fee and a fee receiver (manager):

```bash
pnpm cli liquidationFee set
```

Show data on a liquidation fee PDA (user):
```bash
pnpm cli liquidationFee show
```
