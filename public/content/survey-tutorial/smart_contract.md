# Smart Contract Development

Now that your environment is set up, let's build the heart of our anonymous survey dApp: the **AnonymousSurvey.sol** smart contract.

## What You'll Learn
- How to use FHEVM encrypted types (euint8)
- Perform homomorphic addition on encrypted data
- Implement access control for encrypted values
- Build a survey system where individual votes stay private forever

## Why This Matters
Traditional blockchain surveys expose every vote publicly. With FHEVM:
- ✅ Each rating is **encrypted onchain** (nobody can see individual votes)
- ✅ We can **sum encrypted ratings** without decryption
- ✅ Only **aggregate results** are revealed (total sum + count)

---

## Step 1: Create the Contract File

Navigate to your `contracts/` directory and create `AnonymousSurvey.sol`:

```bash
cd contracts
touch AnonymousSurvey.sol
```

---

## Step 2: Set Up Imports and Inheritance

Add the following code to `AnonymousSurvey.sol`:

```solidity
// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import { FHE, euint8, externalEuint8 } from "@fhevm/solidity/lib/FHE.sol";
import { SepoliaConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title AnonymousSurvey - A confidential survey using FHEVM
/// @notice Submit encrypted ratings (1-10) while keeping individual votes private
contract AnonymousSurvey is SepoliaConfig {
    // Contract code will go here
}
```

**Key Points:**
- **FHE library** - Core FHEVM functions for encrypted operations
- **euint8** - Encrypted 8-bit unsigned integer (perfect for ratings 1-10)
- **externalEuint8** - Encrypted input type from frontend
- **SepoliaConfig** - Automatically configures FHEVM for Sepolia testnet

{% hint style="warning" %}
You **must** inherit from `SepoliaConfig` for FHEVM functionality to work on Sepolia and Hardhat.
{% endhint %}

---

## Step 3: Define State Variables

Add encrypted state variables inside the contract:

```solidity
contract AnonymousSurvey is SepoliaConfig {
    // Encrypted aggregate data (private onchain)
    euint8 private totalRating;
    euint8 private responseCount;

    // Track who has voted (addresses are public, votes are not!)
    mapping(address => bool) public hasVoted;

    // Events for transparency
    event ResponseSubmitted(address indexed participant);
    event SurveyReset();
}
```

**Understanding the State:**
- `totalRating` - Sum of all encrypted ratings (stays encrypted until we decrypt)
- `responseCount` - Number of responses (also encrypted)
- `hasVoted` - Prevents double-voting (addresses are public, but their votes aren't!)

---

## Step 4: Initialize in Constructor

Add the constructor to initialize encrypted values:

```solidity
constructor() {
    // Initialize encrypted variables to zero
    totalRating = FHE.asEuint8(0);
    responseCount = FHE.asEuint8(0);

    // Grant permission for this contract to access these values
    FHE.allowThis(totalRating);
    FHE.allowThis(responseCount);
}
```

**What's Happening:**
- `FHE.asEuint8(0)` - Converts plaintext 0 into encrypted euint8
- `FHE.allowThis()` - Grants the contract permission to read these encrypted values

{% hint style="info" %}
FHEVM uses an **Access Control List (ACL)** system. You must explicitly grant permissions for who can access encrypted data.
{% endhint %}

---

## Step 5: Implement submitRating() Function

Add the core function to submit encrypted ratings:

```solidity
/// @notice Submit an encrypted rating (1-10)
/// @param encryptedRating The encrypted rating from the frontend
/// @param inputProof Zero-knowledge proof validating the encrypted input
function submitRating(
    externalEuint8 encryptedRating,
    bytes calldata inputProof
) external {
    // Prevent double voting
    require(!hasVoted[msg.sender], "Already voted in this survey");

    // Validate and convert encrypted input
    euint8 rating = FHE.fromExternal(encryptedRating, inputProof);

    // Homomorphic addition on encrypted data (no decryption!)
    totalRating = FHE.add(totalRating, rating);
    responseCount = FHE.add(responseCount, FHE.asEuint8(1));

    // Update permissions so users can decrypt aggregate results
    FHE.allowThis(totalRating);
    FHE.allowThis(responseCount);

    // Mark as voted
    hasVoted[msg.sender] = true;

    emit ResponseSubmitted(msg.sender);
}
```

**Step-by-Step Breakdown:**

1. **Prevent double voting** - Check if user already voted
2. **Validate input** - `FHE.fromExternal()` verifies the zero-knowledge proof
3. **Homomorphic addition** - `FHE.add()` adds encrypted values **without decryption**
4. **Update ACL** - Grant permissions for future decryption
5. **Track voter** - Mark address as having voted

{% hint style="info" %}
The **magic of FHE**: We're adding encrypted numbers without ever seeing their plaintext values!
{% endhint %}

---

## Step 6: Add Getter Functions

Add view functions to retrieve encrypted results:

```solidity
/// @notice Get the encrypted total rating sum
/// @return The encrypted sum of all ratings
function getTotalRating() external view returns (euint8) {
    return totalRating;
}

/// @notice Get the encrypted response count
/// @return The encrypted number of responses
function getResponseCount() external view returns (euint8) {
    return responseCount;
}
```

**Note:** These return **encrypted values**. Users will need to decrypt them off-chain using the FHEVM SDK.

---

## Step 7: Add Reset Function (Optional)

For demo purposes, add an admin reset function:

```solidity
/// @notice Reset the survey (admin function for demo)
function resetSurvey() external {
    totalRating = FHE.asEuint8(0);
    responseCount = FHE.asEuint8(0);

    // Re-grant permissions
    FHE.allowThis(totalRating);
    FHE.allowThis(responseCount);

    emit SurveyReset();
}
```

---

## Step 8: Compile the Contract

From your project root, compile the contract:

```bash
npx hardhat compile
```

You should see:
```
Compiled 1 Solidity file successfully
```

✅ **Success!** You've built an FHEVM smart contract that:
- Accepts encrypted ratings
- Performs homomorphic aggregation
- Keeps individual votes private forever
- Only reveals aggregate statistics

---

## Complete Contract Code

Here's the full `AnonymousSurvey.sol`:

```solidity
// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import { FHE, euint8, externalEuint8 } from "@fhevm/solidity/lib/FHE.sol";
import { SepoliaConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

contract AnonymousSurvey is SepoliaConfig {
    euint8 private totalRating;
    euint8 private responseCount;
    mapping(address => bool) public hasVoted;

    event ResponseSubmitted(address indexed participant);
    event SurveyReset();

    constructor() {
        totalRating = FHE.asEuint8(0);
        responseCount = FHE.asEuint8(0);
        FHE.allowThis(totalRating);
        FHE.allowThis(responseCount);
    }

    function submitRating(externalEuint8 encryptedRating, bytes calldata inputProof) external {
        require(!hasVoted[msg.sender], "Already voted in this survey");
        euint8 rating = FHE.fromExternal(encryptedRating, inputProof);
        totalRating = FHE.add(totalRating, rating);
        responseCount = FHE.add(responseCount, FHE.asEuint8(1));
        FHE.allowThis(totalRating);
        FHE.allowThis(responseCount);
        hasVoted[msg.sender] = true;
        emit ResponseSubmitted(msg.sender);
    }

    function getTotalRating() external view returns (euint8) {
        return totalRating;
    }

    function getResponseCount() external view returns (euint8) {
        return responseCount;
    }

    function resetSurvey() external {
        totalRating = FHE.asEuint8(0);
        responseCount = FHE.asEuint8(0);
        FHE.allowThis(totalRating);
        FHE.allowThis(responseCount);
        emit SurveyReset();
    }
}
```

## Highlight Lines
22-30

---

## Key FHEVM Concepts Recap

### 1. Encrypted Types
- **euint8** - Encrypted 8-bit unsigned integer (stored onchain as ciphertext)
- **externalEuint8** - Encrypted input from frontend (includes ZK proof)

### 2. Homomorphic Operations
- **FHE.add()** - Add encrypted values without decryption
- **FHE.sub()** - Subtract encrypted values
- **FHE.mul()** - Multiply encrypted values
- All operations happen on **ciphertext**, not plaintext!

### 3. Input Validation
- **FHE.fromExternal()** - Validates ZK proof and converts external input
- Ensures the encrypted value was created by `msg.sender` for this contract

### 4. Access Control (ACL)
- **FHE.allowThis()** - Grants the contract permission to access encrypted data
- **FHE.allow(ciphertext, address)** - Grants specific address permission
- Without permissions, decryption will fail!

---

## What's Next?

In the next section, we'll:
- Write comprehensive tests for this contract
- Learn how to create encrypted inputs in Hardhat tests
- Deploy to Sepolia testnet

---

## Common Pitfalls

❌ **Forgetting to call `FHE.allowThis()`** → Decryption will fail
❌ **Not validating inputs with `FHE.fromExternal()`** → Security vulnerability
❌ **Missing `SepoliaConfig` inheritance** → Contract won't work with FHEVM