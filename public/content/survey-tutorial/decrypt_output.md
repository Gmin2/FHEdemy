# Decrypt Survey Results

```typescript
import { FhevmInstance } from 'fhevmjs'

export async function getSurveyResults(
  contract: Contract, 
  fhevmInstance: FhevmInstance,
  userAddress: string
) {
  // Get encrypted aggregate results from contract
  const encryptedAverage = await contract.getAverageRating()
  const encryptedCount = await contract.getResponseCount()
  
  // Decrypt the public results (averages only, not individual responses)
  const averageRating = await fhevmInstance.decrypt(encryptedAverage, userAddress)
  const totalResponses = await fhevmInstance.decrypt(encryptedCount, userAddress)
  
  return {
    averageRating: averageRating / 10, // Convert back to decimal
    totalResponses: totalResponses
  }
}
```

## Highlight Lines
9-16