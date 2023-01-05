#!/usr/bin/make

cwd = $(shell pwd)

#cluster = https://jpoolone.genesysgo.net
#cluster = https://solana-api.projectserum.com
#cluster = https://mainnet.rpcpool.com
#cluster = mainnet
#cluster = devnet
cluster = localnet

program = omnisol
program_id = $(shell sed -n 's/^ *${program}.*=.*"\([^"]*\)".*/\1/p' Anchor.toml | head -1)

.DEFAULT_GOAL: help

help: ## Show this help
	@printf "\033[33m%s:\033[0m\n" 'Available commands'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  \033[32m%-18s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)

# ----------------------------------------------------------------------------------------------------------------------

.PHONY: build
build: ## Build program
	anchor build -p $(program) -t $(cwd)/packages/sdk/src/idl

.PHONY: deploy
deploy: build ## Deploy program
	anchor deploy -p $(program) --provider.cluster $(cluster)

.PHONY:verify
verify:
	anchor verify $(program_id) --provider.cluster $(cluster)

.PHONY: test
test: ## Test program
	anchor test --skip-lint --provider.cluster localnet

.PHONY: upgrade
upgrade: build ## Upgrade program
	anchor upgrade -p $(program_id) --provider.cluster $(cluster) ./target/deploy/$(program).so
