# Encrypt Survey Response

```typescript
import { createFhevmInstance } from 'fhevmjs'

export async function encryptSurveyRating(rating: number, contractAddress: string) {
  // Initialize FHEVM instance for encryption
  const instance = await createFhevmInstance({
    network: window.ethereum.networkVersion
  })
  
  // Create encrypted input for the survey contract
  const input = instance.createEncryptedInput(contractAddress, userAddress)
  
  // Encrypt the rating (1-10 scale)
  input.add8(rating)
  
  // Generate encrypted input with proof
  const encryptedInput = input.encrypt()
  
  return {
    handles: encryptedInput.handles,
    inputProof: encryptedInput.inputProof
  }
}
```

## Highlight Lines
10-17