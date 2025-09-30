# Environment Setup for FHEVM Development

## Prerequisites
Before we start, make sure you have:
- **Node.js 18+** installed
- **Git** for version control
- **MetaMask** browser extension
- **Basic Solidity knowledge**

## Step 1: Create Project Structure

```bash
# Create main project directory
mkdir anonymous-survey-dapp
cd anonymous-survey-dapp

# Initialize the project
pnpm init

# Create folder structure
mkdir contracts scripts test frontend
mkdir frontend/src frontend/src/components
```

## Step 2: Install Hardhat & FHEVM Dependencies

```bash
# Install Hardhat and FHEVM packages
pnpm add --save-dev hardhat @nomicfoundation/hardhat-toolbox
pnpm add @fhevm/hardhat-plugin @fhevm/hardhat-template

# Install FHEVM Solidity library
pnpm add @fhevm/solidity

# Initialize Hardhat project
npx hardhat init
```

## Step 3: Configure Hardhat for FHEVM

Create `hardhat.config.js`:

```javascript
require("@nomicfoundation/hardhat-toolbox");
require("@fhevm/hardhat-plugin");

module.exports = {
  solidity: "0.8.24",
  networks: {
    zama: {
      url: "https://devnet.zama.ai/",
      accounts: [process.env.PRIVATE_KEY || ""],
      chainId: 8009,
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  }
};
```

## Step 4: Environment Variables

Create `.env` file:

```bash
# Your wallet private key (for deployment)
PRIVATE_KEY=your_private_key_here

# Zama testnet configuration
ZAMA_RPC_URL=https://devnet.zama.ai/
ZAMA_CHAIN_ID=8009
```

## Highlight Lines
15-25