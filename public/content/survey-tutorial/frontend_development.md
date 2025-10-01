# Frontend Integration

Welcome to the final section! Let's build a React frontend that connects everything together using the FHEVM SDK.

## What You'll Learn
- How to use `@zama-fhe/relayer-sdk` for client-side encryption
- Connect MetaMask to Sepolia testnet
- Encrypt user ratings before sending to the contract
- Decrypt and display aggregate results

---

## Step 1: Initialize the Frontend (Already Done!)

In the Environment Setup section, we already created the frontend structure. Let's verify:

```bash
cd frontend
ls
```

You should see `package.json`, `src/`, etc. If not, run:

```bash
npm create vite@latest . -- --template react-ts
npm install
npm install @zama-fhe/relayer-sdk ethers
```

---

## Step 2: Create the Survey Component

Create `frontend/src/components/SurveyApp.tsx`:

```typescript
import { useState, useEffect } from 'react';
import { ethers, BrowserProvider } from 'ethers';
import { initSDK, createInstance, SepoliaConfig } from '@zama-fhe/relayer-sdk/bundle';
import type { FhevmInstance } from '@zama-fhe/relayer-sdk/bundle';
import contractInfo from '../contract.json';

export function SurveyApp() {
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [fhevmInstance, setFhevmInstance] = useState<FhevmInstance | null>(null);
  const [connected, setConnected] = useState(false);
  const [rating, setRating] = useState(5);
  const [hasVoted, setHasVoted] = useState(false);
  const [results, setResults] = useState<{total: number, count: number} | null>(null);
  const [loading, setLoading] = useState(false);

  return (
    <div className="survey-app">
      <h1>🔐 Anonymous Survey: Rate This Tutorial</h1>
      <p>Your individual rating stays private forever. Only aggregates are revealed.</p>
      {/* UI will go here */}
    </div>
  );
}
```

---

## Step 3: Implement Wallet Connection

Add the `connectWallet` function inside the component:

```typescript
const connectWallet = async () => {
  if (typeof window.ethereum === 'undefined') {
    alert('Please install MetaMask!');
    return;
  }

  try {
    setLoading(true);

    // Request account access
    await window.ethereum.request({ method: 'eth_requestAccounts' });

    const browserProvider = new BrowserProvider(window.ethereum);
    const userSigner = await browserProvider.getSigner();

    // Switch to Sepolia network
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0xaa36a7' }], // Sepolia chain ID
      });
    } catch (switchError: any) {
      // Network doesn't exist, add it
      if (switchError.code === 4902) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: '0xaa36a7',
            chainName: 'Sepolia Testnet',
            rpcUrls: ['https://sepolia.infura.io/v3/'],
            nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
            blockExplorerUrls: ['https://sepolia.etherscan.io']
          }]
        });
      }
    }

    // Initialize FHEVM SDK
    await initSDK(); // Load WASM
    const config = { ...SepoliaConfig, network: window.ethereum };
    const instance = await createInstance(config);

    // Create contract instance
    const surveyContract = new ethers.Contract(
      contractInfo.address,
      contractInfo.abi,
      userSigner
    );

    setProvider(browserProvider);
    setSigner(userSigner);
    setContract(surveyContract);
    setFhevmInstance(instance);
    setConnected(true);

    // Check if user has already voted
    const userAddress = await userSigner.getAddress();
    const voted = await surveyContract.hasVoted(userAddress);
    setHasVoted(voted);

    setLoading(false);
  } catch (error) {
    console.error('Failed to connect wallet:', error);
    alert('Failed to connect wallet. See console for details.');
    setLoading(false);
  }
};
```

**Key Differences from Old Code:**
- ✅ Uses `@zama-fhe/relayer-sdk/bundle` instead of `fhevmjs`
- ✅ Calls `await initSDK()` to load WASM before creating instance
- ✅ Uses `SepoliaConfig` for proper network configuration
- ✅ Connects to **Sepolia testnet** (chain ID `0xaa36a7`)

{% hint style="info" %}
**FHEVM SDK Initialization:**
1. First call `initSDK()` to load TFHE WASM
2. Then create instance with `createInstance({ ...SepoliaConfig, network: window.ethereum })`
3. This instance is used for encryption/decryption
{% endhint %}

---

## Step 4: Implement Submit Rating Function

Add the `submitRating` function:

```typescript
const submitRating = async () => {
  if (!fhevmInstance || !contract || !signer) {
    alert('Please connect your wallet first');
    return;
  }

  try {
    setLoading(true);
    const userAddress = await signer.getAddress();

    // Create encrypted input using FHEVM SDK
    const input = fhevmInstance.createEncryptedInput(
      contractInfo.address,
      userAddress
    );
    input.add8(rating); // Encrypt the rating value
    const encryptedInput = await input.encrypt();

    // Submit encrypted rating to contract
    const tx = await contract.submitRating(
      encryptedInput.handles[0], // externalEuint8
      encryptedInput.inputProof   // ZK proof
    );

    console.log('Transaction sent:', tx.hash);
    await tx.wait();

    console.log('Rating submitted successfully!');
    setHasVoted(true);
    alert('✅ Rating submitted successfully! Your vote is encrypted onchain.');
    setLoading(false);
  } catch (error: any) {
    console.error('Failed to submit rating:', error);
    alert('Failed to submit rating: ' + (error.message || error));
    setLoading(false);
  }
};
```

**How Encryption Works:**
1. **Create encrypted input** - Bound to contract address and user address
2. **Add value** - `input.add8(rating)` encrypts the rating
3. **Generate proof** - `encrypt()` creates ZK proof
4. **Submit transaction** - Send encrypted handle + proof to contract

{% hint style="warning" %}
The encrypted input is **bound** to both the user's address and the contract address. This prevents replay attacks and ensures Bob can't steal Alice's encrypted vote.
{% endhint %}

---

## Step 5: Implement View Results Function

Add the `viewResults` function to decrypt aggregate results:

```typescript
const viewResults = async () => {
  if (!fhevmInstance || !contract || !signer) {
    alert('Please connect your wallet first');
    return;
  }

  try {
    setLoading(true);
    const userAddress = await signer.getAddress();

    // Get encrypted results from contract
    const encryptedTotal = await contract.getTotalRating();
    const encryptedCount = await contract.getResponseCount();

    console.log('Encrypted total handle:', encryptedTotal);
    console.log('Encrypted count handle:', encryptedCount);

    // Decrypt results using FHEVM SDK
    const total = await fhevmInstance.decrypt(contractInfo.address, encryptedTotal);
    const count = await fhevmInstance.decrypt(contractInfo.address, encryptedCount);

    console.log('Decrypted total:', total);
    console.log('Decrypted count:', count);

    setResults({
      total: Number(total),
      count: Number(count)
    });

    setLoading(false);
  } catch (error: any) {
    console.error('Failed to decrypt results:', error);
    alert('Failed to load results: ' + (error.message || error));
    setLoading(false);
  }
};
```

**Decryption Flow:**
1. **Get encrypted handles** - Call `getTotalRating()` and `getResponseCount()`
2. **Decrypt client-side** - `fhevmInstance.decrypt(contractAddress, handle)`
3. **Display results** - Show aggregate statistics

{% hint style="info" %}
Decryption happens **off-chain** using the FHEVM relayer. The contract must have granted proper ACL permissions via `FHE.allowThis()`.
{% endhint %}

---

## Step 6: Build the UI

Add the JSX for the user interface:

```typescript
return (
  <div className="survey-app">
    <h1>🔐 Anonymous Survey: Rate This Tutorial</h1>
    <p>Your individual rating stays private forever. Only aggregates are revealed.</p>

    {!connected ? (
      <div>
        <button onClick={connectWallet} disabled={loading}>
          {loading ? 'Connecting...' : '🦊 Connect MetaMask'}
        </button>
        <p style={{ fontSize: '14px', color: '#666', marginTop: '10px' }}>
          Make sure you're on Sepolia testnet
        </p>
      </div>
    ) : (
      <div>
        <p style={{ color: 'green' }}>✅ Connected to Sepolia Testnet</p>

        {!hasVoted ? (
          <div style={{ marginTop: '20px' }}>
            <h3>Rate this tutorial (1-10):</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input
                type="range"
                min="1"
                max="10"
                value={rating}
                onChange={(e) => setRating(parseInt(e.target.value))}
                style={{ flexGrow: 1 }}
              />
              <span style={{ fontSize: '24px', fontWeight: 'bold' }}>{rating}/10</span>
            </div>
            <button onClick={submitRating} disabled={loading} style={{ marginTop: '15px' }}>
              {loading ? 'Submitting...' : '🔒 Submit Anonymous Rating'}
            </button>
            <p style={{ fontSize: '12px', color: '#888', marginTop: '8px' }}>
              Your rating will be encrypted before sending to the blockchain
            </p>
          </div>
        ) : (
          <div style={{ marginTop: '20px' }}>
            <p style={{ color: 'blue' }}>✅ Your vote has been submitted anonymously!</p>
            <button onClick={viewResults} disabled={loading} style={{ marginTop: '10px' }}>
              {loading ? 'Loading...' : '📊 View Aggregate Results'}
            </button>

            {results && (
              <div style={{
                marginTop: '15px',
                padding: '15px',
                backgroundColor: '#f0f0f0',
                borderRadius: '8px'
              }}>
                <h3>Survey Results:</h3>
                <p><strong>Average Rating:</strong> {(results.total / results.count).toFixed(2)}/10</p>
                <p><strong>Total Responses:</strong> {results.count}</p>
                <p style={{ fontSize: '12px', color: '#888', marginTop: '10px' }}>
                  ℹ️ Individual responses remain private forever. Only aggregates are revealed.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    )}
  </div>
);
```

---

## Step 7: Update Main App Component

Update `frontend/src/App.tsx`:

```typescript
import { SurveyApp } from './components/SurveyApp'
import './App.css'

function App() {
  return (
    <div className="App">
      <SurveyApp />
    </div>
  );
}

export default App;
```

---

## Step 8: Add TypeScript Declarations

Create `frontend/src/vite-env.d.ts` (if it doesn't exist):

```typescript
/// <reference types="vite/client" />

interface Window {
  ethereum?: any;
}
```

---

## Step 9: Run the Frontend

Start the development server:

```bash
cd frontend
npm run dev
```

Open your browser to `http://localhost:5173`

---

## Step 10: Test the Complete dApp

1. **Click "Connect MetaMask"** → Approve connection and switch to Sepolia
2. **Adjust the rating slider** → Choose a value from 1-10
3. **Click "Submit Anonymous Rating"** → Sign the transaction in MetaMask
4. **Wait for confirmation** → Transaction mines onchain
5. **Click "View Aggregate Results"** → See decrypted statistics

✅ **Congratulations!** You've built a fully functional anonymous survey dApp with FHEVM!

---

## Complete Flow Diagram

```
┌─────────────┐
│   Browser   │
│  (Rating: 8)│
└──────┬──────┘
       │ 1. Encrypt with FHEVM SDK
       ↓
┌──────────────────────┐
│ Encrypted Input (CT) │
│ + ZK Proof           │
└──────┬───────────────┘
       │ 2. Submit transaction
       ↓
┌──────────────────────┐
│  Sepolia Blockchain  │
│  AnonymousSurvey.sol │
│  (FHE.add on CT)     │
└──────┬───────────────┘
       │ 3. Return encrypted result
       ↓
┌──────────────────────┐
│   FHEVM Relayer      │
│ (Decrypt aggregate)  │
└──────┬───────────────┘
       │ 4. Return plaintext
       ↓
┌─────────────┐
│   Browser   │
│ (Average:   │
│  7.5/10)    │
└─────────────┘
```

---

## Key Differences from Old Tutorial

### ❌ Old (Incorrect):
```typescript
import { createFhevmInstance } from 'fhevmjs';
const instance = await createFhevmInstance({ ... });
```

### ✅ New (Correct):
```typescript
import { initSDK, createInstance, SepoliaConfig } from '@zama-fhe/relayer-sdk/bundle';
await initSDK();
const instance = await createInstance({ ...SepoliaConfig, network: window.ethereum });
```

---

## Common Frontend Issues

**Error: "initSDK is not a function"**
→ Make sure you're importing from `@zama-fhe/relayer-sdk/bundle`

**Error: "Failed to decrypt"**
→ Check that contract called `FHE.allowThis()` for the encrypted values

**Error: "Invalid proof"**
→ Ensure encrypted input is created with correct contract and user address

**MetaMask shows wrong network**
→ Switch to Sepolia testnet manually in MetaMask

---

## What You've Built

🎉 **Amazing work!** You've created a production-ready FHEVM dApp that:

1. ✅ Uses the **official FHEVM Hardhat template**
2. ✅ Deploys a **confidential smart contract** on Sepolia
3. ✅ **Encrypts user inputs** client-side with FHEVM SDK
4. ✅ Performs **homomorphic computations** onchain
5. ✅ **Decrypts aggregate results** while keeping individual votes private
6. ✅ Provides a **complete user experience** with React + MetaMask

---

## Next Steps

Want to build more with FHEVM? Try these ideas:

1. **Confidential Voting** - Build a DAO voting system with private ballots
2. **Sealed-Bid Auction** - Create an auction where bids stay secret until reveal
3. **Private Token Balances** - ERC20 with encrypted balances
4. **Confidential NFT Attributes** - NFTs with hidden metadata

Check out more examples at:
- [FHEVM Documentation](https://docs.zama.ai/fhevm)
- [Example Contracts](https://github.com/zama-ai/fhevm-contracts)
