# Smart Contract Development

## Create AnonymousSurvey.sol

Create `contracts/AnonymousSurvey.sol`:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { FHE, euint8, externalEuint8 } from "@fhevm/solidity/lib/FHE.sol";
import { SepoliaConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

contract AnonymousSurvey is SepoliaConfig {
    // Encrypted state variables
    euint8 private totalRating;
    euint8 private responseCount;
    
    // Track who has voted (addresses are public)
    mapping(address => bool) public hasVoted;
    
    // Events for transparency
    event ResponseSubmitted(address indexed participant);
    event SurveyReset();
    
    constructor() {
        // Initialize encrypted variables to zero
        totalRating = FHE.asEuint8(0);
        responseCount = FHE.asEuint8(0);
    }
    
    function submitRating(
        externalEuint8 encryptedRating, 
        bytes calldata inputProof
    ) external {
        require(!hasVoted[msg.sender], "Already voted in this survey");
        
        // Validate and convert encrypted input
        euint8 rating = FHE.fromExternal(encryptedRating, inputProof);
        
        // Homomorphic operations on encrypted data
        totalRating = FHE.add(totalRating, rating);
        responseCount = FHE.add(responseCount, FHE.asEuint8(1));
        
        // Mark as voted
        hasVoted[msg.sender] = true;
        
        // Set up access control for encrypted results
        FHE.allowThis(totalRating);
        FHE.allowThis(responseCount);
        FHE.allow(totalRating, msg.sender);
        FHE.allow(responseCount, msg.sender);
        
        emit ResponseSubmitted(msg.sender);
    }
    
    function getTotalRating() external view returns (euint8) {
        require(FHE.isSenderAllowed(totalRating), "Not authorized to view results");
        return totalRating;
    }
    
    function getResponseCount() external view returns (euint8) {
        require(FHE.isSenderAllowed(responseCount), "Not authorized to view results");
        return responseCount;
    }
    
    // Admin function to reset survey (for demo purposes)
    function resetSurvey() external {
        totalRating = FHE.asEuint8(0);
        responseCount = FHE.asEuint8(0);
        emit SurveyReset();
    }
}
```

## Key FHEVM Concepts Explained

### 1. Encrypted Types
- `euint8` - Encrypted 8-bit unsigned integer
- `externalEuint8` - External encrypted input type

### 2. Homomorphic Operations
- `FHE.add()` - Addition on encrypted values
- Operations work without decrypting data

### 3. Access Control
- `FHE.allow()` - Grant decryption permissions
- `FHE.isSenderAllowed()` - Check permissions

## Highlight Lines
24-42