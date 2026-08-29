# ConsentLayer

ConsentLayer is a permission and payment workspace for AI datasets. A data owner creates a machine-readable Data Passport, defines which AI uses are free, paid, or denied, and sets the validity period for new licenses. A requester can inspect those terms, sign a free license, or pay the owner in native 0G on the 0G Galileo testnet. Every successful request creates an exportable receipt.

The product is designed as permission infrastructure, not as a file-hosting claim. The current application manages dataset metadata, policies, payment transactions, and receipts. It does not upload, encrypt, deliver, or remotely delete dataset files.

## Product promise

ConsentLayer helps both sides prove what was agreed:

- Data owners publish explicit AI training, fine-tuning, inference, research, commercial-use, and redistribution rules.
- Requesters can see the applicable policy and price before taking action.
- Denied purposes cannot issue a license.
- Paid purposes submit a real native 0G transfer to the passport owner's wallet.
- Free purposes can be wallet-signed or saved as a clearly labelled local-only receipt.
- Revoked passports stop future licenses without rewriting the terms of existing receipts.

## Working feature set

### Wallet and 0G Galileo

- Detects an injected EVM wallet such as MetaMask or Rabby.
- Reads the currently authorized account directly from the wallet provider; wallet identity is never trusted from browser storage.
- Adds or switches to 0G Galileo when the user connects.
- Uses chain ID `16602` (`0x40da`), native currency `0G`, RPC `https://evmrpc-testnet.0g.ai`, and explorer `https://chainscan-galileo.0g.ai`.
- Provides a link to the official Galileo faucet.

### Data Passports

- Creates a passport from user-entered metadata; there are no seeded or fake marketplace listings.
- Records name, description, type, record count, owner, privacy label, provenance hash, policy, price, version, status, timestamps, and license duration.
- Supports `allowed`, `paid`, and `denied` decisions for six usage categories.
- Requires a connected wallet when any permission is paid, ensuring payments have a valid recipient.
- Exports an individual passport as JSON.
- Lets the local or connected-wallet owner revoke a passport.
- Excludes revoked passports from the public marketplace while retaining them in the owner's workspace history.

### Licenses and receipts

- Resolves Research, AI training, Commercial training, Fine-tuning, and Inference requests against the passport policy.
- Blocks denied requests and all requests against revoked passports.
- Signs free license terms with `personal_sign` when a wallet is connected.
- Clearly labels unsigned free receipts as `Local only`.
- Submits paid access with `eth_sendTransaction`, transferring native testnet 0G directly to the passport owner.
- Stores paid receipts as `PENDING`, then reconciles them with `eth_getTransactionReceipt` to mark them `ACTIVE` or `FAILED`.
- Computes `EXPIRED` from the receipt's validity date instead of displaying every license as active.
- Links payment-backed receipts to their real ChainScan transaction.
- Exports every receipt as JSON and copies its receipt hash.

### Workspace safety

- Saves passports and receipts to browser `localStorage` only after initial hydration, preventing accidental overwrite during startup.
- Validates and migrates saved records with Zod before using them.
- Synchronizes updates across browser tabs.
- Exports a versioned full-workspace JSON backup.
- Validates imported backups before replacing current state.
- Requires an inline confirmation before clearing receipts, revoking a passport, or resetting the local workspace.
- Keeps backup, restore, connection state, and reset controls on a dedicated Settings page.

## Pages

| Route | Purpose |
| --- | --- |
| `/` | Product overview and explanation |
| `/dashboard` | Workspace metrics, owned passports, active receipt counts, and network state |
| `/marketplace` | Searchable catalog of active passports |
| `/passports/new` | Focused passport creation flow |
| `/passports/[id]` | Passport policy, ownership, export, revocation, and license request flow |
| `/receipts` | Receipt audit trail, payment reconciliation, explorer links, and exports |
| `/settings` | Wallet/network status, backup, restore, and local reset |

The application deliberately uses separate pages instead of putting every feature into one dashboard.

## Architecture

The app is a Next.js 16 application using React 19 and TypeScript.

```text
frontend/
  app/                    Next.js routes, metadata, manifest, favicon, global styles
  components/             Page-level and reusable interface components
  components/consent-provider.tsx
                          Validated workspace state, wallet actions, payments, receipts
  lib/consent-data.ts     Domain types, schemas, permission resolver, hashes, exports
```

State-changing wallet operations are centralized in `ConsentProvider`. Domain rules and runtime validation live in `lib/consent-data.ts`. Pages consume this shared layer instead of duplicating payment or permission logic.

## Data and verification model

There are three receipt verification levels:

1. `local` — browser-local evidence for a free license; no external cryptographic proof.
2. `wallet` — the user signed the complete free-license terms with their connected wallet.
3. `payment` — a native 0G payment transaction was submitted and can be verified on ChainScan.

Passport metadata and complete license terms are currently stored in the local workspace. A payment transaction proves the value transfer, but it does not by itself anchor the full passport or license JSON onchain. Exported JSON files make the current records portable and machine-readable.

## Run locally

Requirements:

- Node.js 20 or newer
- pnpm
- An injected EVM wallet for signed or paid flows
- Galileo testnet 0G from `https://faucet.0g.ai` for payments

```bash
cd frontend
pnpm install
pnpm dev
```

Open `http://localhost:3000`.

Production checks:

```bash
pnpm typecheck
pnpm build
```

Run the production build:

```bash
pnpm start
```

Set `NEXT_PUBLIC_APP_URL` to the deployed HTTPS origin so generated social metadata uses the production URL.

## Privacy and security boundaries

- Never put secrets, private keys, or raw private datasets into passport metadata.
- Browser storage is convenient for this testnet prototype but is not a shared database and is cleared when site data is removed. Use workspace backups.
- Wallet signatures prove control of an account at signing time; they are not legal advice or an automatic guarantee of regulatory compliance.
- A blockchain receipt cannot force a requester to delete files already received. Revocation blocks new licenses only.
- Private is currently a metadata classification. File encryption and access delivery must be provided by a future storage integration.
- Native 0G testnet tokens have no production monetary value.

## Production roadmap

The following ideas are intentionally documented as future work and are not presented as shipped functionality:

- Deploy audited 0G smart contracts for passport ownership, policy versions, full license commitments, revocation, and indexed history.
- Store encrypted datasets and manifests through 0G Storage, with key delivery tied to active licenses.
- Add stable-token pricing, escrow, refunds, platform fees, subscriptions, pay-per-use accounting, and payment finality handling.
- Add authenticated shared accounts and a server-side database so marketplace listings work across users and devices.
- Add requester identities, organization profiles, Agentic ID rules, and reputation.
- Add 0G Compute-assisted classification, sensitive-data scanning, quality checks, and policy suggestions.
- Publish a permission-check API and SDK for autonomous agents.
- Add contract tests, RPC failover, monitoring, rate limiting, CSP/security headers, legal terms, privacy policy, and an external security review before mainnet use.

## Honest submission summary

This repository is a polished Galileo testnet prototype with a deployable ConsentLayerRegistry contract baseline. Passport creation, policy enforcement, free-license signing, direct native 0G payment, payment confirmation checks, revocation, receipt status, exports, backups, responsive UI, and all listed routes work end to end in the browser. Onchain mode becomes active when `NEXT_PUBLIC_CONSENTLAYER_REGISTRY_ADDRESS` is configured.

It is not yet a decentralized file marketplace or a complete production licensing protocol. The registry contract is a testnet baseline, not an audited production contract. Persistent backend indexing, encrypted 0G Storage access, and 0G Compute workflows still require the infrastructure and credentials described in the roadmap above.
