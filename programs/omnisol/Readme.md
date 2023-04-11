# OmniSOL v.0.0.1

OmniSol program.

# Set-up guide

To change admin - write admin wallet address at ADMIN const (line 3).
Located at:

> src/state.rs

Build a program:

```bash
make build
```

Generate SDK:

```bash
pnpm api:gen
```

Configure cluster to deploy to:

```bash
solana config set --url <CLUSTER>
```

Where CLUSTER is a solana cluster address.

Deploy program:

```bash
anchor deploy
```

Run tests:

```bash
make test
```
