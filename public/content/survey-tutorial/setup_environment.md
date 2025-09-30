# Environment Setup for FHEVM Development

Welcome! In this section, you'll set up a complete development environment for building confidential smart contracts with FHEVM (Fully Homomorphic Encryption Virtual Machine).

## What You'll Learn
- How to use the official FHEVM Hardhat template
- Set up your development environment in under 5 minutes
- Configure your wallet for Sepolia testnet deployment

## Prerequisites
Before starting, ensure you have:
- **Node.js LTS** (v18.x or v20.x - **use even-numbered versions only**)
- **npm** or **pnpm** package manager
- **Git** for version control
- **MetaMask** browser extension
- **Basic Solidity knowledge** (writing simple smart contracts)

{% hint style="warning" %}
Hardhat does not support odd-numbered Node.js versions (e.g., v19, v21, v23). Always use LTS even versions.
{% endhint %}

## Why FHEVM?
Traditional smart contracts expose all data publicly on the blockchain. FHEVM allows you to:
- ✅ Keep user inputs **private** (encrypted onchain)
- ✅ Perform **computations on encrypted data** without decryption
- ✅ Only reveal **aggregate results** while protecting individual privacy

Perfect for surveys, voting, auctions, and confidential DeFi!

---

## Step 1: Use the Official FHEVM Hardhat Template (Recommended)

The fastest way to start is using Zama's pre-configured template. It includes:
- ✅ Hardhat with FHEVM plugin pre-installed
- ✅ Proper TypeScript configuration
- ✅ Example contracts and tests
- ✅ Ready-to-use project structure

```bash
# Create a new GitHub repository from the template
# 1. Go to: https://github.com/zama-ai/fhevm-hardhat-template
# 2. Click "Use this template" → "Create a new repository"
# 3. Clone your newly created repository

git clone https://github.com/<your-username>/your-repo-name anonymous-survey-dapp
cd anonymous-survey-dapp

# Install dependencies
npm install
```

## Highlight Lines
10-13

✅ **Template includes:**
- `contracts/` - For your Solidity contracts
- `test/` - Test files with FHEVM helpers
- `tasks/` - Hardhat deployment tasks
- `hardhat.config.ts` - Pre-configured for FHEVM

---

## Step 2: Configure Hardhat Variables (Optional for Sepolia Deployment)

If you plan to deploy to **Sepolia testnet**, configure these Hardhat variables:

### Set up MNEMONIC
A 12-word seed phrase to generate your wallet:

```bash
npx hardhat vars set MNEMONIC
# Enter your MetaMask seed phrase when prompted
```

### Set up INFURA_API_KEY
Get an Infura API key to connect to Sepolia:

1. Follow the [Infura + MetaMask setup guide](https://docs.metamask.io/services/get-started/infura/)
2. Configure in your project:

```bash
npx hardhat vars set INFURA_API_KEY
# Enter your Infura API key when prompted
```

{% hint style="info" %}
**Default values** (if you skip this step):
- `MNEMONIC` = "test test test test test test test test test test test junk"
- `INFURA_API_KEY` = "zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz"

These defaults work for local testing but **NOT for real deployments**.
{% endhint %}

---

## Step 3: Clean the Template (Start Fresh)

Remove example contracts to start building your survey dApp:

```bash
# Navigate to project root
cd anonymous-survey-dapp

# Remove example files
rm -rf test/* contracts/* tasks/*
```

---

## Step 4: Verify Your Setup

Test that everything works:

```bash
# Compile (should succeed even with no contracts)
npx hardhat compile

# Check Hardhat is working
npx hardhat
```

You should see Hardhat's available commands and tasks.

---

## Step 5: Install Frontend Dependencies (We'll use this later)

We'll build a React frontend in a later section. For now, create the structure:

```bash
# In project root, create frontend directory
mkdir -p frontend/src/components
cd frontend

# Initialize Vite + React + TypeScript
npm create vite@latest . -- --template react-ts
npm install

# Install FHEVM SDK and ethers
npm install @zama-fhe/relayer-sdk ethers
```

---

## What's Next?

✅ Your development environment is ready!

In the next section, we'll write the `AnonymousSurvey.sol` smart contract with:
- Encrypted survey responses (euint8 ratings)
- Homomorphic aggregation (sum encrypted values)
- Access control (only reveal aggregate results)

---

## Troubleshooting

**Error: "Cannot find configuration variable 'MNEMONIC'"**
→ Run: `npx hardhat vars set MNEMONIC`

**Error: "Hardhat not found"**
→ Run: `npm install` in your project root

**Node.js version warning**
→ Install Node.js LTS (v20.x) from https://nodejs.org
