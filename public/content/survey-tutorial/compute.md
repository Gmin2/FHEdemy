# Submit Encrypted Survey Response

```typescript
import { Contract } from 'ethers'

export async function submitSurveyResponse(
  contract: Contract, 
  encryptedRating: string, 
  inputProof: string,
  signer: any
) {
  // Submit encrypted rating to the survey contract
  const tx = await contract.connect(signer).submitRating(
    encryptedRating,
    inputProof
  )
  
  // Wait for transaction confirmation
  const receipt = await tx.wait()
  
  console.log('Survey response submitted anonymously!')
  return receipt
}
```

## Highlight Lines
10-15