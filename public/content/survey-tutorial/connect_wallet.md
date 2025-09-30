# Connect Wallet for Survey Participation

```typescript
import { ethers } from "ethers"

declare global {
  interface Window {
    ethereum?: any
  }
}

export async function connectWallet() {
  // Check if MetaMask is installed
  if (!window.ethereum) {
    throw new Error("Please install MetaMask to participate in surveys")
  }

  // Request account access
  await window.ethereum.request({ method: "eth_requestAccounts" })

  // Ensure Zama Devnet (chainId 8009 → hex 0x1F49)
  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: "0x1F49" }],
    })
  } catch (e: any) {
    if (e.code === 4902) {
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: "0x1F49",
            chainName: "Zama Devnet",
            rpcUrls: ["https://devnet.zama.ai/"],
            nativeCurrency: { name: "ZAMA", symbol: "ZAMA", decimals: 18 },
          },
        ],
      })
    } else {
      throw e
    }
  }

  // Create provider and signer for survey interactions
  const provider = new ethers.BrowserProvider(window.ethereum)
  const signer = await provider.getSigner()

  console.log("Survey participant connected:", await signer.getAddress())
  return { provider, signer, address: await signer.getAddress() }
}
```

## Highlight Lines

7-16