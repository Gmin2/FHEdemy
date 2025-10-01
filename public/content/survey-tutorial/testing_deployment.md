# Testing & Deployment

Now that we've built the `AnonymousSurvey.sol` contract, let's write comprehensive tests to ensure it works correctly with encrypted inputs.

## What You'll Learn
- How to create encrypted inputs in Hardhat tests
- Test encrypted operations with FHEVM
- Decrypt encrypted values in tests
- Deploy to Sepolia testnet

---

## Step 1: Create the Test File

Navigate to your `test/` directory and create `AnonymousSurvey.test.ts`:

```bash
cd test
touch AnonymousSurvey.test.ts
```

---

## Step 2: Set Up Test Imports and Structure

Add the following boilerplate to `AnonymousSurvey.test.ts`:

```typescript
import { AnonymousSurvey, AnonymousSurvey__factory } from "../types";
import { FhevmType } from "@fhevm/hardhat-plugin";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers, fhevm } from "hardhat";

type Signers = {
  deployer: HardhatEthersSigner;
  alice: HardhatEthersSigner;
  bob: HardhatEthersSigner;
  carol: HardhatEthersSigner;
};

async function deployFixture() {
  const factory = (await ethers.getContractFactory("AnonymousSurvey")) as AnonymousSurvey__factory;
  const surveyContract = (await factory.deploy()) as AnonymousSurvey;
  const surveyContractAddress = await surveyContract.getAddress();

  return { surveyContract, surveyContractAddress };
}

describe("AnonymousSurvey", function () {
  let signers: Signers;
  let surveyContract: AnonymousSurvey;
  let surveyContractAddress: string;

  before(async function () {
    const ethSigners: HardhatEthersSigner[] = await ethers.getSigners();
    signers = {
      deployer: ethSigners[0],
      alice: ethSigners[1],
      bob: ethSigners[2],
      carol: ethSigners[3]
    };
  });

  beforeEach(async () => {
    ({ surveyContract, surveyContractAddress } = await deployFixture());
  });

  // Tests will go here
});
```

**Key Components:**
- **fhevm** - Hardhat's FHEVM plugin for encryption/decryption
- **FhevmType** - Enum for encrypted types (euint8, euint16, etc.)
- **deployFixture** - Deploys a fresh contract before each test

---

## Step 3: Test Contract Deployment

Add your first test to verify deployment:

```typescript
it("should deploy successfully", async function () {
  expect(ethers.isAddress(surveyContractAddress)).to.be.true;
  console.log(`AnonymousSurvey deployed at: ${surveyContractAddress}`);
});
```

**Run the test:**

```bash
npx hardhat test
```

Expected output:
```
AnonymousSurvey
  AnonymousSurvey deployed at: 0x...
  ✔ should deploy successfully (XXms)

1 passing
```

---

## Step 4: Test Encrypted Rating Submission

Add a test for submitting an encrypted rating:

```typescript
it("should accept encrypted rating submission", async function () {
  // Create encrypted input for rating of 8 (from Alice)
  const ratingValue = 8;
  const input = fhevm.createEncryptedInput(surveyContractAddress, signers.alice.address);
  input.add8(ratingValue);
  const encryptedInput = await input.encrypt();

  // Submit the encrypted rating
  const tx = await surveyContract
    .connect(signers.alice)
    .submitRating(encryptedInput.handles[0], encryptedInput.inputProof);

  await tx.wait();

  // Verify Alice has voted
  expect(await surveyContract.hasVoted(signers.alice.address)).to.be.true;
});
```

**Key Points:**
- `fhevm.createEncryptedInput()` - Creates encrypted input bound to Alice and the contract
- `input.add8(8)` - Encrypts the value 8 as euint8
- `encryptedInput.handles[0]` - The encrypted handle (externalEuint8)
- `encryptedInput.inputProof` - Zero-knowledge proof for validation

{% hint style="info" %}
The encrypted input is bound to both **Alice's address** and the **contract address**. Bob cannot reuse this encrypted value, ensuring data confidentiality.
{% endhint %}

---

## Step 5: Test Double Voting Prevention

Add a test to ensure users can't vote twice:

```typescript
it("should prevent double voting", async function () {
  // Alice votes once
  const input1 = fhevm.createEncryptedInput(surveyContractAddress, signers.alice.address);
  input1.add8(7);
  const encryptedInput1 = await input1.encrypt();

  await surveyContract
    .connect(signers.alice)
    .submitRating(encryptedInput1.handles[0], encryptedInput1.inputProof);

  // Alice tries to vote again - should fail
  const input2 = fhevm.createEncryptedInput(surveyContractAddress, signers.alice.address);
  input2.add8(9);
  const encryptedInput2 = await input2.encrypt();

  await expect(
    surveyContract
      .connect(signers.alice)
      .submitRating(encryptedInput2.handles[0], encryptedInput2.inputProof)
  ).to.be.revertedWith("Already voted in this survey");
});
```

---

## Step 6: Test Aggregate Decryption

Add a test to verify we can decrypt aggregate results:

```typescript
it("should decrypt aggregate results correctly", async function () {
  // Submit three encrypted ratings: 8, 6, 9
  const ratings = [
    { signer: signers.alice, value: 8 },
    { signer: signers.bob, value: 6 },
    { signer: signers.carol, value: 9 }
  ];

  for (const { signer, value } of ratings) {
    const input = fhevm.createEncryptedInput(surveyContractAddress, signer.address);
    input.add8(value);
    const encryptedInput = await input.encrypt();

    await surveyContract
      .connect(signer)
      .submitRating(encryptedInput.handles[0], encryptedInput.inputProof);
  }

  // Get encrypted results
  const encryptedTotal = await surveyContract.getTotalRating();
  const encryptedCount = await surveyContract.getResponseCount();

  // Decrypt using Alice's permissions
  const decryptedTotal = await fhevm.userDecryptEuint(
    FhevmType.euint8,
    encryptedTotal,
    surveyContractAddress,
    signers.alice
  );

  const decryptedCount = await fhevm.userDecryptEuint(
    FhevmType.euint8,
    encryptedCount,
    surveyContractAddress,
    signers.alice
  );

  // Verify aggregate results
  expect(decryptedTotal).to.equal(23); // 8 + 6 + 9 = 23
  expect(decryptedCount).to.equal(3);

  // Calculate average
  const average = decryptedTotal / decryptedCount;
  console.log(`Average rating: ${average.toFixed(2)}/10`);
  expect(average).to.be.closeTo(7.67, 0.01);
});
```

**Understanding Decryption:**
- `fhevm.userDecryptEuint()` - Decrypts an encrypted value
- **FhevmType.euint8** - Specifies the encrypted type
- **surveyContractAddress** - Contract that has permission
- **signers.alice** - User who has permission (due to `FHE.allowThis()` in contract)

{% hint style="warning" %}
Decryption requires proper ACL permissions set in the contract using `FHE.allowThis()` and `FHE.allow()`.
{% endhint %}

---

## Step 7: Run All Tests

Run the complete test suite:

```bash
npx hardhat test
```

Expected output:
```
AnonymousSurvey
  ✔ should deploy successfully
  ✔ should accept encrypted rating submission
  ✔ should prevent double voting
  ✔ should decrypt aggregate results correctly
  Average rating: 7.67/10

4 passing (XXms)
```

✅ All tests passing! Your FHEVM contract works correctly.

---

## Step 8: Create Deployment Script

Create `scripts/deploy.ts`:

```typescript
import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  console.log("Deploying AnonymousSurvey contract...");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  const Survey = await ethers.getContractFactory("AnonymousSurvey");
  const survey = await Survey.deploy();

  await survey.waitForDeployment();
  const contractAddress = await survey.getAddress();

  console.log("✅ AnonymousSurvey deployed to:", contractAddress);

  // Save contract address and ABI for frontend
  const contractInfo = {
    address: contractAddress,
    abi: JSON.parse(survey.interface.formatJson())
  };

  const frontendPath = path.join(__dirname, "../frontend/src/contract.json");
  fs.mkdirSync(path.dirname(frontendPath), { recursive: true });
  fs.writeFileSync(frontendPath, JSON.stringify(contractInfo, null, 2));

  console.log("✅ Contract info saved to frontend/src/contract.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```

---

## Step 9: Deploy to Sepolia Testnet

Make sure you've configured Hardhat variables (Step 2 of Environment Setup), then deploy:

```bash
# Deploy to Sepolia
npx hardhat run scripts/deploy.ts --network sepolia
```

Expected output:
```
Deploying AnonymousSurvey contract...
Deploying with account: 0x...
✅ AnonymousSurvey deployed to: 0x...
✅ Contract info saved to frontend/src/contract.json
```

---

## Step 10: Verify Contract on Etherscan (Optional)

Verify your deployed contract:

```bash
npx hardhat verify --network sepolia <DEPLOYED_CONTRACT_ADDRESS>
```

---

## Testing Best Practices

### ✅ Do:
- Create fresh encrypted inputs for each test
- Test both success and failure cases
- Verify ACL permissions are working
- Test with multiple users

### ❌ Don't:
- Reuse encrypted inputs across tests
- Forget to call `await tx.wait()`
- Try to decrypt without proper permissions
- Test with only one user

---

## Common Testing Errors

**Error: "Decryption failed"**
→ Check that `FHE.allowThis()` is called in the contract

**Error: "Invalid proof"**
→ Make sure encrypted input is bound to correct contract and user

**Error: "Already voted"**
→ Use `beforeEach` to deploy fresh contract for each test

---

## What's Next?

✅ Your smart contract is tested and deployed!

In the next section, we'll build a React frontend that:
- Connects to MetaMask
- Encrypts user ratings with the FHEVM SDK
- Submits encrypted transactions
- Decrypts and displays aggregate results
