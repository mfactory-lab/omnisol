# Liquidator v.0.0.1

Liquidator is the off-chain service that fetches PDAs from Omnisol contract, fetches withdraw requests, fetches priority queue data and send transaction to liquidate collateral on-chain.

# Set-up guide

To run the service, write this command:

> cargo run -- -k path/to/id.json -c CLUSTER -s SLEEP_TIME -p UNSTAKE_IT_POOL -f PROTOCOL_FEE -d DESTINATION_FEE -r RESERVE_STAKE -u UNSTAKE_IT_PROGRAM -a FEE_ACCOUNT

Where:

- path/to/id.json is a path to oracle keypair file
- CLUSTER is a Solana cluster (could be full rpc url, WebSocket url, word - like 'testnet', or letter - like 't' )
- SLEEP_TIME is a delay that thread will wait between algorithm processing
- UNSTAKE_IT_POOL - unstake.it pool address
- PROTOCOL_FEE - unstake.it protocol fee account address
- DESTINATION_FEE - unstake.it destination fee address
- RESERVE_STAKE - unstake.it reserve stake address
- UNSTAKE_IT_PROGRAM - unstake.it contract address
- FEE_ACCOUNT - unstake.it fee account address
