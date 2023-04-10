# Oracle v.0.0.1

Oracle is the off-chain service that fetches PDAs from Omnisol contract, generated priority queue and send transaction to update it on-chain.

# Set-up guide

To run the service, write this command:

> cargo run -- -k path/to/id.json -c CLUSTER -s SLEEP_TIME

Where:

- path/to/id.json is a path to oracle keypair file
- CLUSTER is a Solana cluster (could be full rpc url, WebSocket url, word - like 'testnet', or letter - like 't' )
- SLEEP_TIME is a delay that thread will wait between algorithm processing
