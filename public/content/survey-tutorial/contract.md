# Anonymous Survey Smart Contract

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { FHE, euint8, externalEuint8 } from "@fhevm/solidity/lib/FHE.sol";
import { SepoliaConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

contract AnonymousSurvey is SepoliaConfig {
    euint8 private totalRating;
    euint8 private responseCount;
    
    mapping(address => bool) public hasVoted;
    
    event ResponseSubmitted(address indexed participant);
    
    function submitRating(
        externalEuint8 encryptedRating, 
        bytes calldata inputProof
    ) external {
        require(!hasVoted[msg.sender], "Already voted");
        
        // Validate and convert encrypted input
        euint8 rating = FHE.fromExternal(encryptedRating, inputProof);
        
        // Add to total (homomorphic addition)
        totalRating = FHE.add(totalRating, rating);
        responseCount = FHE.add(responseCount, FHE.asEuint8(1));
        
        // Mark as voted and allow access
        hasVoted[msg.sender] = true;
        FHE.allowThis(totalRating);
        FHE.allowThis(responseCount);
        FHE.allow(totalRating, msg.sender);
        FHE.allow(responseCount, msg.sender);
        
        emit ResponseSubmitted(msg.sender);
    }
    
    function getAverageRating() external view returns (euint8) {
        return totalRating; // Client calculates average from total/count
    }
    
    function getResponseCount() external view returns (euint8) {
        return responseCount;
    }
}
```

## Highlight Lines
15-32