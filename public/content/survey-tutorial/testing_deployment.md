# Testing & Deployment

## Create Test Suite

Create `test/AnonymousSurvey.test.js`:

```javascript
const { expect } = require("chai");
const { ethers, fhevm } = require("hardhat");

describe("AnonymousSurvey", function () {
  let survey, owner, addr1, addr2, contractAddress;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    
    const Survey = await ethers.getContractFactory("AnonymousSurvey");
    survey = await Survey.deploy();
    await survey.waitForDeployment();
    contractAddress = await survey.getAddress();
  });

  describe("Survey Submission", function () {
    it("Should accept encrypted rating submission", async function () {
      // Create encrypted input for rating of 8
      const input = fhevm.createEncryptedInput(contractAddress, addr1.address);
      input.add8(8);
      const encryptedInput = await input.encrypt();
      
      // Submit rating
      await survey.connect(addr1).submitRating(
        encryptedInput.handles[0],
        encryptedInput.inputProof
      );
      
      // Check that user has voted
      expect(await survey.hasVoted(addr1.address)).to.be.true;
    });

    it("Should prevent double voting", async function () {
      // Submit first vote
      const input = fhevm.createEncryptedInput(contractAddress, addr1.address);
      input.add8(7);
      const encryptedInput = await input.encrypt();
      
      await survey.connect(addr1).submitRating(
        encryptedInput.handles[0],
        encryptedInput.inputProof
      );
      
      // Try to vote again - should fail
      await expect(
        survey.connect(addr1).submitRating(
          encryptedInput.handles[0],
          encryptedInput.inputProof
        )
      ).to.be.revertedWith("Already voted in this survey");
    });

    it("Should decrypt results correctly", async function () {
      // Submit multiple ratings
      const ratings = [8, 6, 9];
      
      for (let i = 0; i < ratings.length; i++) {
        const signer = [addr1, addr2, owner][i];
        const input = fhevm.createEncryptedInput(contractAddress, signer.address);
        input.add8(ratings[i]);
        const encryptedInput = await input.encrypt();
        
        await survey.connect(signer).submitRating(
          encryptedInput.handles[0],
          encryptedInput.inputProof
        );
      }
      
      // Decrypt results
      const encryptedTotal = await survey.connect(addr1).getTotalRating();
      const encryptedCount = await survey.connect(addr1).getResponseCount();
      
      const total = await fhevm.decrypt8(encryptedTotal);
      const count = await fhevm.decrypt8(encryptedCount);
      
      expect(total).to.equal(23); // 8 + 6 + 9
      expect(count).to.equal(3);
    });
  });
});
```

## Deployment Script

Create `scripts/deploy.js`:

```javascript
const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying AnonymousSurvey contract...");
  
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  
  const Survey = await ethers.getContractFactory("AnonymousSurvey");
  const survey = await Survey.deploy();
  
  await survey.waitForDeployment();
  const contractAddress = await survey.getAddress();
  
  console.log("AnonymousSurvey deployed to:", contractAddress);
  
  // Save contract address and ABI for frontend
  const fs = require('fs');
  const contractInfo = {
    address: contractAddress,
    abi: survey.interface.format('json')
  };
  
  fs.writeFileSync(
    './frontend/src/contract.json',
    JSON.stringify(contractInfo, null, 2)
  );
  
  console.log("Contract info saved to frontend/src/contract.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```

## Run Tests and Deploy

```bash
# Run tests
npx hardhat test

# Deploy to Zama testnet
npx hardhat run scripts/deploy.js --network zama

# Verify deployment
npx hardhat verify --network zama DEPLOYED_CONTRACT_ADDRESS
```

## Highlight Lines
16-35