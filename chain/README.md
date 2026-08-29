# ConsentLayer onchain package

`ConsentLayerRegistry.sol` is the testnet contract baseline for passport commitments, policy versions, owner revocation, EIP-712 free-license approvals, and atomic native-0G paid licenses.

It is not audited and must not be used with valuable funds or deployed to mainnet without an independent audit.

## Compile

```bash
pnpm install
pnpm compile
```

## Deploy to Galileo

Set the deployer key in the shell only. Never commit it or place it in a `NEXT_PUBLIC_` variable.

```bash
set OG_DEPLOYER_PRIVATE_KEY=...
set OG_RPC_URL=https://evmrpc-testnet.0g.ai
pnpm deploy:galileo
```

The script refuses to deploy unless the connected RPC reports chain ID `16602` and waits for two confirmations. It writes `deployment-galileo.json`, which is ignored by git.
