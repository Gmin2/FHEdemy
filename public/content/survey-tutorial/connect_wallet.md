# Connect Wallet for Survey Participation

```typescript
import { ethers } from 'ethers'

export async function connectWallet() {
  // Check if MetaMask is available
  if (!(window as any).ethereum) {
    throw new Error('Please install MetaMask to participate in surveys')
  }
  
  // Request account access
  await (window as any).ethereum.request({ 
    method: 'eth_requestAccounts' 
  })
  
  // Create provider and signer for survey interactions
  const provider = new ethers.BrowserProvider((window as any).ethereum)
  const signer = await provider.getSigner()
  
  console.log('Survey participant connected:', await signer.getAddress())
  return { provider, signer }
}
```

## Highlight Lines
7-16