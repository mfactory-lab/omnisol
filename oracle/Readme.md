# Oracle v.0.0.1

Oracle is an off-chain service that fetches PDAs from the omniSOL contract, generates a priority queue, and sends a transaction to update it on-chain.

# Setup

To laucnch the service, run:

```bash
cargo run -- -k path/to/id.json -c <CLUSTER> -s <SLEEP_TIME>
```

Where:

- path/to/id.json: a path to the Oracle keypair file
- CLUSTER: a Solana cluster. It can be a full RPC URL, a WebSocket URL, a word (e.g., "testnet"), or a letter (e.g., "t")
- SLEEP_TIME: the time that a thread will wait between algorithm-based processing iterations
