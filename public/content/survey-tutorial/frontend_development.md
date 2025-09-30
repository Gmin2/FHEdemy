# Frontend Integration

## Setup React Frontend

```bash
# Navigate to frontend directory
cd frontend

# Initialize React app
pnpm create vite . --template react-ts
pnpm install

# Install FHEVM frontend dependencies
pnpm add fhevmjs ethers
pnpm add @types/node
```

## Create Survey Component

Create `frontend/src/components/SurveyApp.tsx`:

```typescript
import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { createFhevmInstance, FhevmInstance } from 'fhevmjs';
import contractInfo from '../contract.json';

export function SurveyApp() {
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [fhevmInstance, setFhevmInstance] = useState<FhevmInstance | null>(null);
  const [connected, setConnected] = useState(false);
  const [rating, setRating] = useState(5);
  const [hasVoted, setHasVoted] = useState(false);
  const [results, setResults] = useState<{total: number, count: number} | null>(null);

  // Connect wallet and initialize FHEVM
  const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        // Request account access
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        
        const browserProvider = new ethers.BrowserProvider(window.ethereum);
        const userSigner = await browserProvider.getSigner();
        
        // Switch to Zama testnet
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x1F49' }], // 8009 in hex
          });
        } catch (switchError: any) {
          if (switchError.code === 4902) {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: '0x1F49',
                chainName: 'Zama Testnet',
                rpcUrls: ['https://devnet.zama.ai/'],
                nativeCurrency: { name: 'ZAMA', symbol: 'ZAMA', decimals: 18 }
              }]
            });
          }
        }

        // Initialize FHEVM instance
        const instance = await createFhevmInstance({
          network: window.ethereum.networkVersion,
          gatewayUrl: 'https://gateway.devnet.zama.ai'
        });

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

      } catch (error) {
        console.error('Failed to connect wallet:', error);
      }
    }
  };

  // Submit encrypted rating
  const submitRating = async () => {
    if (!fhevmInstance || !contract || !signer) return;

    try {
      const userAddress = await signer.getAddress();
      
      // Create encrypted input
      const input = fhevmInstance.createEncryptedInput(
        contractInfo.address,
        userAddress
      );
      input.add8(rating);
      const encryptedInput = input.encrypt();

      // Submit to contract
      const tx = await contract.submitRating(
        encryptedInput.handles[0],
        encryptedInput.inputProof
      );
      
      await tx.wait();
      setHasVoted(true);
      alert('Rating submitted successfully!');
      
    } catch (error) {
      console.error('Failed to submit rating:', error);
      alert('Failed to submit rating');
    }
  };

  // Decrypt and display results
  const viewResults = async () => {
    if (!fhevmInstance || !contract || !signer) return;

    try {
      const userAddress = await signer.getAddress();
      
      // Get encrypted results
      const encryptedTotal = await contract.getTotalRating();
      const encryptedCount = await contract.getResponseCount();
      
      // Decrypt results
      const total = await fhevmInstance.decrypt(encryptedTotal, userAddress);
      const count = await fhevmInstance.decrypt(encryptedCount, userAddress);
      
      setResults({ total: Number(total), count: Number(count) });
      
    } catch (error) {
      console.error('Failed to decrypt results:', error);
      alert('Failed to load results');
    }
  };

  return (
    <div className="survey-app">
      <h1>Anonymous Survey: Rate This Tutorial</h1>
      
      {!connected ? (
        <button onClick={connectWallet}>
          Connect Wallet
        </button>
      ) : (
        <div>
          <p>✅ Connected to Zama Testnet</p>
          
          {!hasVoted ? (
            <div>
              <h3>Rate this tutorial (1-10):</h3>
              <input
                type="range"
                min="1"
                max="10"
                value={rating}
                onChange={(e) => setRating(parseInt(e.target.value))}
              />
              <span>{rating}/10</span>
              <br />
              <button onClick={submitRating}>
                Submit Anonymous Rating
              </button>
            </div>
          ) : (
            <div>
              <p>✅ Your vote has been submitted anonymously</p>
              <button onClick={viewResults}>
                View Aggregate Results
              </button>
              
              {results && (
                <div>
                  <h3>Survey Results:</h3>
                  <p>Average Rating: {(results.total / results.count).toFixed(1)}/10</p>
                  <p>Total Responses: {results.count}</p>
                  <small>Individual responses remain private forever</small>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

## Main App Component

Update `frontend/src/App.tsx`:

```typescript
import { SurveyApp } from './components/SurveyApp'
import './App.css'

function App() {
  return <SurveyApp />
}

export default App
```

## Run the Complete dApp

```bash
# In the frontend directory
pnpm dev
```

Your anonymous survey dApp is now ready! Users can:
1. Connect their wallet to Zama testnet
2. Submit encrypted ratings privately
3. View aggregate results while individual votes stay secret

## Highlight Lines
67-85