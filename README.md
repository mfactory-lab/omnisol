# OmniSOL v.0.0.1

## Introduction

omniSOL is a liquid staking derivative that fundamentally changes how liquid staking works on Solana. 
It allows **any staked account** to access all of Solana’s DeFi,
while gaining the staking yields of that particular validator.

## Based on

- https://soceanfi.notion.site/Technical-Whitepaper-OmniSOL-c30898acfff240b0b954dc08dc9f6a48

## License

[GNU AGPL v3](./LICENSE)

# Problems with existing solutions

Currently, users have to choose between being able to control where they stake their SOL, and being able to access the broader DeFi ecosystem.
**Current native stakers cannot access DeFi.** If you stake directly with a validator, you cannot use that staked SOL in DeFi.
**Current liquid staking solutions don’t allow native stake.** Conversely, if I stake with any stake pool, I give up the ability to choose who I delegate with, as my stake is now pooled with everyone else’s and delegated to validators according to the pool’s delegation strategy.

**Current liquid staking solutions pose a centralisation risk.** Because current liquid staking protocols take custody of SOL, they control where that SOL is delegated to (either via delegation strategy or governance gauges). This poses a centralisation risk. 

Liquid staking protocols are incentivised to grow as large as possible to bring financial incentives to their tokenholders. While this is not a problem yet on Solana, the fact that existing liquid staking solutions have an incentive to grow large AND that they control where SOL goes means that a future is possible where liquid staking protocols pose a significant centralisation risk to the network.

**Current liquid staking solutions are unhealthy for the broader Solana ecosystem.** In general, tokenholders of liquid staking protocols vote for their own financial gain, not network health. Because liquid staking protocols’ moats lie completely in network effects/market power, they are incentivised to constantly grow this moat via any means necessary, which is detrimental to other stake pools and unhealthy for the broader Solana ecosystem. For example, a leading liquid staking incumbent used their market power to sign an exclusivity deal with one of the largest Solana wallets, and has also pushed for exclusive integrations with DeFi protocols. We believe this is unhealthy for the competitive ecosystem.

We need a solution that **allows native stakers to enjoy the full benefits of DeFi** while posing **no centralisation risk** and also allows a rich competitive landscape to flourish. omniSOL aims to be that solution.

# omniSOL: a shared liquidity layer for all staked SOL

omniSOL is a new liquid staking derivative that delivers all the benefits of liquid staking (seamless interoperability with DeFi, instant liquidity) without the disadvantages (lack of control, potentially worse APY, centralisation risk).

omniSOL has three main benefits:

- It ensures that **any staked account** can access all of Solana DeFi, while **gaining the staking yields** of that particular validator.
- It allows stakers to maintain **control of who they stake with**, aligning incentives between validators and omniSOL.
- Lastly, because omniSOL does not control how SOL is staked, ****it poses **no centralisation risk** to the broader health of the Solana network.

omniSOL can be thought of as a **hybrid between a borrow-lend protocol and a liquid staking derivative**. The key insight is that delegation strategy and liquidity provision can and should be decoupled.

# User flow

## Depositing

A user deposits their staked SOL (stake account or liquid staking token) into the omniSOL pool. The omniSOL pool opens an account with the pool that notes down what stake they have deposited.

## Minting omniSOL

The user can use their deposit as collateral to mint omniSOL. They can now withdraw this omniSOL and do whatever they want with it e.g. sell it, participate in DeFi, etc). As their stake accounts continue to earn yield, the amount of lamports in them increases. We define the ******************************reserve amount****************************** as the amount of lamports in the stake account - the value of omniSOL.

## Burning omniSOL (with an account)

Any omniSOL minter can at any time return withdrawn omniSOL to their account. This burns the omniSOL, allowing the minter to withdraw their staked SOL.

## Burning omniSOL (without an account)

Any omniSOL holder can at any time give omniSOL to the pool in return for at least 1 SOL per omniSOL, even if they don’t have an account with the pool. The pool will return staked SOL equal to the amount of omniSOL that was withdrawn. It does this by “liquidating” a staked account — taking staked SOL from a depositor and giving them omniSOL instead.

The omniSOL pool chooses which staked SOL to “liquidate” according to a global priority queue. The omniSOL Pool keeps a **global priority queue** of accounts in descending order of withdrawal priority. Withdrawal priority is the ratio of

<img src="https://latex.codecogs.com/svg.image?\large&space;\frac{Reserve&space;Amount}{Total&space;Amount}&space;" title="https://latex.codecogs.com/svg.image?\large \frac{Reserve Amount}{Total Amount} " />

e.g. if you deposited 100 staked SOL and minted 80 omniSOL, your ratio is $(100-80)/100 = 20.$ The omniSOL pool will first withdraw from accounts that have a lower ratio before withdrawing from accounts with a higher ratio.

**Example.** A user deposits 100 SOL staked with validator A and mints 100 omniSOL. After a year, the user has 105 staked SOL with validator A. 

Let's see how different withdrawals affect the user.

There is a withdrawal of 50 SOL and this user is top on the priority queue. After the withdrawal, the user’s position looks like this:

There is a withdrawal of 100 SOL and this user is top of the priority queue. After the withdrawal, the user has 5 staked SOL with validator A and 100 omniSOL.

There is a withdrawal of 150 SOL and this user is top of the priority queue. First, 100 SOL will be taken from this user (see case 2). The next 50 SOL will be withdrawn from the user second in the priority queue.

# Advantages of omniSOL

omniSOL provides **full liquidity** to stakers while giving them **full control**. omniSOL lets you use any staked account to mint omniSOL, and guarantees that your stake account will never be redelegated under the omniSOL pool so long as you maintain your position. This lets you earn the individual validator’s staking returns while gaining access to the full power of Solana DeFi/GameFi.

**omniSOL is capital-efficient.** Unlike current liquid staking solutions that require a liquidity pool for each xSOL/SOL pair, omniSOL unites liquidity, meaning that only a single pool of liquid SOL is needed to service every single staked SOL derivative/staked account.

**omniSOL poses no inherent centralisation risk**. Other liquid staking derivatives hold depositors’ SOL and decide where to put that SOL every epoch. This poses a potential centralisation risk. In contrast, omniSOL cannot decide who SOL is staked with. By design, **any** stake account can be used to mint omniSOL.

- That is to say, even if omniSOL gets big and all SOL becomes omniSOL, there is no way that omniSOL can exert any control on validators. In contrast, liquid staking providers can (and do): who they decide to delegate to (especially with bribing gauges) etc. has a huge impact on the network.

# Conclusion

omniSOL provides full liquidity to users while leaving them full control of who they stake with. It lets native stakers choose with validator to stake with while having full access to DeFi. Because it does not delegate to validators, it is truly decentralised: stakers decide who they stake with, and the network is healthier as a result. 

# FAQ

## Is omniSOL yield-generating?

It can be or it could not be. Yield-generating omniSOL can be implemented by simply setting omniSOL to appreciate over time. The rate of this appreciation can be pegged to whatever is reasonable: the staking rewards rate, the median APY of the stake accounts in omniSOL, etc. Because this yield is low and will not fluctuate greatly, “bad debt” (where the staked SOL withdrawn is insufficient to cover omniSOL’s face value) is very unlikely to happen.

## What will happen to omniSOL if there is slashing?

Slashing will pose significant challenges to all liquid staked derivatives, and omniSOL is no exception. With slashing implemented, the omniSOL pool will need to constantly monitor validators and may need to preemptively unstake or enforce restrictions on the set of validators that can be used as collateral.

## Is the omniSOL pool guaranteed to have enough staked SOL to ensure that 1 omniSOL ≥ 1 stakedSOL?

Yes, if slashing is not implemented. The key invariant is that you have to deposit at least 1 staked SOL to mint 1 omniSOL, and 1 staked SOL is always worth at least 1 SOL.

## How can omniSOL accept stake pool tokens?

Any safe asset that is guaranteed to be worth at least 1 SOL can be used to mint omniSOL.

omniSOL doesn’t even have to delay unstake the stake pool tokens: it can simply return the stake pool token and let the liquidator handle the delay unstake themselves.

## Can someone endlessly loop and rebalance the omniSOL pool in their favor?

Someone can deposit e.g. 100 staked SOL, mint 99 omniSOL, burn that omniSOL, stake that SOL with a validator of their choice, then deposit that staked SOL and repeat the process. In this way, the user can “point” a large amount of SOL to a validator of their choice.

This is possible in theory but can be made unprofitable in practice. Firstly, withdrawal and minting fees can be set to make such a maneuver unprofitable.

Secondly, the priority queue mechanism enforces an effective limit. You can mint more omniSOL, but that means your reserve ratio will be low: you’ll be top of the priority queue, which means you’ll be “liquidated” first when you try to burn the omniSOL. If you mint fewer omniSOL to increase your reserve ratio then you’ll be limited in the amount of omniSOL you can mint.

Lastly, liquidity providers can choose to burn omniSOL at any time. If a validator were somehow abusing this system, liquidity providers could respond by burning omniSOL. This would rapidly dry up liquidity and force you to be liquidated. 

## Can “cascading liquidations” happen? How do we prevent it?

One thing that can happen is a “cascading liquidation”. 

**Example:** Alex deposits 100 SOL staked with validator A. Bob deposits 100 SOL staked with validator B. Both mint 100 omniSOL.

After a year, Alex has 105 staked SOL with validator A. Bob has 106 staked SOL with validator B. 

There is a withdrawal of 100 SOL and Alex is top of the priority queue. After the withdrawal, Alex has 5 staked SOL with validator A and 100 omniSOL.

Alex could keep the omniSOL and gain the yield on it, but he could also choose to burn it. What happens when Alex burns his omniSOL? He will get his 5 staked SOL with validator A, but he will also get 100 staked SOL from validator B. That means that Bob will be “liquidated” and Bob now holds the 100 omniSOL. And if Bob then chooses to withdraw the omniSOL, Charlie will get liquidated… and so on and so forth.

In order to prevent this, the protocol can incentivise holding omniSOL: see the “Providing Liquidity” section for more details. To gate withdrawals, the protocol can even increase the withdrawal fee dynamically depending on the amount of liquidity remaining, subject to a ceiling (thus maintaining a floor price on omniSOL).

## Providing liquidity

A string of people consecutively burning omniSOL could cause a “liquidation cascade”. To prevent this the protocol can incentivise people to hold omniSOL by giving them a share of the withdrawal and minting fees.

A user can deposit staked SOL and mark their account as “open to liquidation”. If they do so, their account goes to the top of the priority queue. In return, they earn a portion of mint fees, and when their account is “liquidated”, they earn the withdrawal fee. 

The effective yield of a liquidity provider is thus (omniSOL yield * percentage of omniSOL held + staked SOL * percentage of staked SOL held) plus (withdrawal fee share + mint fee share + percentage of omniSOL held).

**Example.** A user is holding stSOL (~5.53% APY). They can deposit this stSOL into omniSOL and mark their account as “open to liquidation”. While they haven’t yet been liquidated, they continue to earn 5.53% on their stSOL and can withdraw at any time. They also get a small proportion of the omniSOL mint fees as a reward for staying in the pool.

Someone tries to withdraw omniSOL, which liquidates this user. When this happens, their stSOL will be changed to omniSOL at the prevailing rate. They get the withdraw fees at this time.

Suppose all of the user’s stSOL was converted to omniSOL. Henceforth, the user would earn a larger proportion of the mint fees plus the yield of omniSOL.

We can see that a user is incentivised to stay in the pool and continue to hold omniSOL if the total yield in this LP (mint fee APY + omniSOL APY) exceeds the total yield of holding stSOL. Because liquidations are expected to make up a small amount of the total omniSOL supply, a low mint fee can still effectively incentivise holding omniSOL.

When it is no longer profitable to hold omniSOL, the user should close the position, paying back the withdraw fees he made. His net profit is the difference between the omniSOL APY and the stSOL APY plus his share of the mint fees.

## What are the tradeoffs of omniSOL?

Because of omniSOL’s guarantee that 1 omniSOL can always be redeemed for at least 1 staked SOL, the user can be liquidated even if his liquidation ratio is very healthy. In such an event the user will not lose any of his staked SOL or accumulated staking rewards, but will lose out on future gains if the omniSOL APY is lower than the staked SOL’s APY. In return for this tradeoff, the protocol gives the best-effort guarantee that their staked SOL will remain staked to that particular validator. This aligns incentives between validators, stakers, and the protocol.

In practice, I believe the delta between omniSOL’s yield and staked SOL yield will be minimal since the protocol can adjust omniSOL’s APY higher at any time. This will have the additional advantageous consequence of “raising the bar” — low-performing stake accounts will quickly be liquidated and reassigned.