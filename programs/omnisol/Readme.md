# OmniSOL v.0.0.1

OmniSol program.

# Set-up guide

To change admin - write admin wallet address at ADMIN const (line 3).
Located at:

> src/state.rs

Build a program:

> make build

Generate SDK:

> pnpm api:gen

Configure cluster to deploy to:

> solana config set --url CLUSTER

Where CLUSTER is a solana cluster address.

Deploy program:

> anchor deploy

Run tests:

> make test
