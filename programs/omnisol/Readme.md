# omniSOL v.0.0.1

omniSOL program.

# Setup

1. To change the admin, set a new admin wallet address for the ADMIN constant (Line 3) in:

> src/state.rs

2. Build the program:

```bash
make build
```

3. Generate an SDK:

```bash
pnpm api:gen
```

4. Set the cluster to deploy to:

```bash
solana config set --url <CLUSTER>
```

Where CLUSTER is a Solana cluster address.

5. Deploy the program:

```bash
anchor deploy
```

6. Run tests:

```bash
make test
```
