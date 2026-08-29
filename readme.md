# ConsentLayer

ConsentLayer is a permission and payment workspace for AI datasets. A data owner creates a machine-readable Data Passport, defines which AI uses are free, paid, or denied, and sets the validity period for new licenses. A requester can inspect those terms, sign a free license, or pay the owner in native 0G on the 0G Galileo testnet. Every successful request creates an exportable receipt.

The product is designed as permission infrastructure. A connected owner can optionally encrypt a dataset in the browser, upload it to 0G Storage, and commit the resulting storage root when publishing the passport onchain. Automated license-bound key delivery is not yet included; owners receive a recovery-key package and must protect it offline.

## Product promise

ConsentLayer helps both sides prove what was agreed:

- Data owners publish explicit AI training, fine-tuning, inference, research, commercial-use, and redistribution rules.
- Requesters can see the applicable policy and price before taking action.
- Denied purposes cannot issue a license.
- Paid purposes settle native 0G atomically through the registry contract when onchain mode is configured.
- Free purposes can be wallet-signed or saved as a clearly labelled local-only receipt.
- Revoked passports stop future licenses without rewriting the terms of existing receipts.

## Working feature set

### Wallet and 0G Galileo

- Detects an injected EVM wallet such as MetaMask or Rabby.
- Reads the currently authorized account directly from the wallet provider; wallet identity is never trusted from browser storage.
- Adds or switches to 0G Galileo when the user connects.
- Reads chain ID, RPC, explorer, faucet, Storage indexer, and registry address from environment configuration, with Galileo development defaults.
- Provides a link to the official Galileo faucet.

### Data Passports

- Creates a passport from user-entered metadata; there are no seeded or fake marketplace listings.
- Records name, description, type, record count, owner, privacy label, provenance hash, policy, price, version, status, timestamps, and license duration.
- Supports `allowed`, `paid`, and `denied` decisions for six usage categories.
- Requires a connected wallet when any permission is paid, ensuring payments have a valid recipient.
- Exports an individual passport as JSON.
- Lets the local or connected-wallet owner revoke a passport.
- Excludes revoked passports from the public marketplace while retaining them in the owner's workspace history.
- Optionally performs client-side AES-256 encryption and a real 0G Storage upload, then records the Storage root and transaction in the passport.

### Licenses and receipts

- Resolves Research, AI training, Commercial training, Fine-tuning, and Inference requests against the passport policy.
- Blocks denied requests and all requests against revoked passports.
- Uses an EIP-712 `FreeLicense` signature and onchain issuance when a deployed registry is configured.
- Clearly labels unsigned free receipts as `Local only`.
- Uses contract-based atomic paid-license issuance when a deployed registry is configured. The direct-transfer path remains only as an explicit compatibility fallback for legacy local passports.
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
| `/compute` | License-gated 0G Compute inference workspace |
| `/settings` | Wallet/network status, backup, restore, and local reset |
| `/api/health` | Non-secret deployment and integration status |

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
  lib/storage.ts          Browser encryption and 0G Storage upload client
chain/
  contracts/              ConsentLayerRegistry Solidity source
  scripts/                Reproducible compile and Galileo deployment scripts
```

State-changing wallet operations are centralized in `ConsentProvider`. Domain rules and runtime validation live in `lib/consent-data.ts`. Pages consume this shared layer instead of duplicating payment or permission logic.

## Data and verification model

There are three receipt verification levels:

1. `local` — browser-local evidence for a free license; no external cryptographic proof.
2. `wallet` — the license was wallet-signed; configured onchain passports use chain-bound EIP-712 terms.
3. `payment` — a native 0G transaction was submitted and can be verified on ChainScan; configured passports settle through the registry contract.

The browser currently caches passport and receipt JSON locally, while configured onchain passports commit policy metadata, storage roots, ownership, version, revocation, and issued licenses to the registry. Exported JSON files keep records portable and machine-readable. A shared event index/database is still required for a globally synchronized catalog.

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

Copy `frontend/.env.example` to `.env.local` and configure `NEXT_PUBLIC_CONSENTLAYER_REGISTRY_ADDRESS` after deploying the registry. `OG_COMPUTE_API_KEY` is server-only and must never use the `NEXT_PUBLIC_` prefix.

Compile and deploy the Galileo registry:

```bash
cd chain
pnpm install
pnpm compile
set OG_DEPLOYER_PRIVATE_KEY=<set this only in your local shell>
pnpm deploy:galileo
```

## Privacy and security boundaries

- Never put secrets, private keys, or raw private datasets into passport metadata.
- Browser storage is convenient for this testnet prototype but is not a shared database and is cleared when site data is removed. Use workspace backups.
- Wallet signatures prove control of an account at signing time; they are not legal advice or an automatic guarantee of regulatory compliance.
- A blockchain receipt cannot force a requester to delete files already received. Revocation blocks new licenses only.
- Uploaded files are encrypted client-side, but the downloaded recovery key is owner-custodied. A KMS-backed, revocation-aware key-release service is required before accepting sensitive production data.
- Native 0G testnet tokens have no production monetary value.

## Production roadmap

The following ideas are intentionally documented as future work and are not presented as shipped functionality:

- Independently audit the included registry contract before mainnet deployment and add indexed historical policy snapshots.
- Add KMS-backed license-bound key delivery, verified downloads, replication monitoring, retry/cancellation, and larger resumable Storage uploads.
- Add stable-token pricing, escrow, refunds, platform fees, subscriptions, pay-per-use accounting, and payment finality handling.
- Add authenticated shared accounts and a server-side database so marketplace listings work across users and devices.
- Add requester identities, organization profiles, Agentic ID rules, and reputation.
- Extend the included license-gated 0G Compute inference gateway with TEE verification, provider funding/status, fine-tuning jobs, and compute receipts.
- Publish a permission-check API and SDK for autonomous agents.
- Add contract tests, RPC failover, monitoring, rate limiting, CSP/security headers, legal terms, privacy policy, and an external security review before mainnet use.

## Honest submission summary

This repository is a tested Galileo application with a deployable ConsentLayerRegistry baseline, optional encrypted 0G Storage uploads, onchain EIP-712/free and atomic paid licensing, and a license-gated 0G Compute gateway. Passport creation, policy enforcement, local fallback receipts, payment reconciliation, revocation, exports, backups, responsive UI, health reporting, and all listed routes work end to end. Onchain mode becomes active when `NEXT_PUBLIC_CONSENTLAYER_REGISTRY_ADDRESS` is configured; Compute activates when the server-only API key is configured.

It is not yet safe to call this mainnet-production-ready. The registry is an unaudited testnet baseline, the catalog cache remains browser-local without a configured database/indexer, and encrypted-file key release is owner-managed rather than KMS-backed. Those infrastructure and external-audit boundaries cannot be solved by frontend code alone and remain explicit launch blockers.
