# Liquidator v.0.0.1

Liquidator is an off-chain service that fetches PDAs from the omniSOL contract, withdrawal requests, and priority queue data, as well as sends transactions to liquidate collateral on-chain.

# Setup

To launch the service, run:

```bash
cargo run -- -k path/to/id.json -c <CLUSTER> -s <SLEEP_TIME> -p <UNSTAKE_IT_POOL> -f <PROTOCOL_FEE> -d <DESTINATION_FEE> -r <RESERVE_STAKE> -u <UNSTAKE_IT_PROGRAM> -a <FEE_ACCOUNT>
```

Where:

- path/to/id.json: a path to the Oracle keypair file
- CLUSTER: a Solana cluster. It can be a full RPC URL, a WebSocket URL, a word (e.g., "testnet"), or a letter (e.g., "t")
- SLEEP_TIME: the time that a thread will wait between algorithm-based processing iterations
- UNSTAKE_IT_POOL: the address of the unstake.it pool
- PROTOCOL_FEE: the address of the unstake.it protocol fee account
- DESTINATION_FEE: the address of the unstake.it destination fee account
- RESERVE_STAKE: the address of the unstake.it reserve stake
- UNSTAKE_IT_PROGRAM: the address of the unstake.it contract
- FEE_ACCOUNT: the address of the unstake.it fee account
