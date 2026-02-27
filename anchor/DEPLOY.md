# Identity Registry — Devnet Deployment Guide

## Prerequisites

| Tool       | Version | Install                                                                                                       |
| ---------- | ------- | ------------------------------------------------------------------------------------------------------------- |
| Rust       | stable  | `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs \| sh`                                             |
| Solana CLI | 1.18+   | `sh -c "$(curl -sSfL https://release.anza.xyz/stable/install)"`                                               |
| Anchor CLI | 0.30+   | `cargo install --git https://github.com/coral-xyz/anchor avm --force && avm install 0.30.1 && avm use 0.30.1` |

## 1. Configure Solana for Devnet

```bash
solana config set --url https://api.devnet.solana.com
solana-keygen new --outfile ~/.config/solana/id.json   # skip if you already have a keypair
solana airdrop 2                                        # fund your wallet
```

## 2. Build

```bash
cd anchor
anchor build
```

After the first build, Anchor generates a keypair at `target/deploy/identity_registry-keypair.json`.  
Retrieve the program ID:

```bash
solana address -k target/deploy/identity_registry-keypair.json
```

## 3. Update Program ID

Replace the placeholder ID in **two** places:

1. `programs/identity_registry/src/lib.rs` → `declare_id!("YOUR_PROGRAM_ID");`
2. `anchor/Anchor.toml` → `identity_registry = "YOUR_PROGRAM_ID"`

## 4. Rebuild & Deploy

```bash
anchor build
anchor deploy --provider.cluster devnet
```

## 5. Verify

```bash
solana program show <YOUR_PROGRAM_ID>
```

You should see the program listed with `Deployable: true` on Devnet.

## Account Structure (reference)

```
IdentityAccount (84 bytes)
├── discriminator   8 bytes
├── authority      32 bytes  (Pubkey)
├── handle          4 + 32   (String prefix + max chars)
└── created_at      8 bytes  (i64 unix timestamp)
```

PDA seeds: `["identity", authority.key().as_ref()]`
