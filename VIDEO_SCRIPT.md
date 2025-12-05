# FHEVM Medical Review Example - Demo Video Script

**Total Duration:** 8-10 minutes
**Target Audience:** Developers, blockchain enthusiasts, privacy-tech community
**Video Quality:** 1080p or higher (screen recording preferred)

---

## Part 1: Introduction (1 minute)

### Opening Scene
Show the project repository on GitHub or terminal.

**Script:**

> "Hello! Today I'm demonstrating a privacy-preserving medical review system built on FHEVM - Fully Homomorphic Encryption Virtual Machine. This is a submission for the Zama December 2025 bounty program to build FHEVM examples.
>
> This project showcases three critical FHE concepts:
> 1. Access control patterns with FHE.allow and FHE.allowThis
> 2. Working with encrypted values on-chain
> 3. Public decryption workflows
>
> Let's dive in!"

### Visual Elements
- Display project name and GitHub URL
- Show key metrics: 25+ tests, 3 contract functions, 4 FHE concepts

---

## Part 2: Project Overview (1.5 minutes)

### Scene 1: Directory Structure
Navigate to the project root and show directory structure.

```bash
cd fhevm-anonymous-medical-review
ls -la
```

**Script:**

> "Here's our project structure. We have:
> - **contracts/** - Our Solidity FHE contract
> - **test/** - Comprehensive test suite with TSDoc documentation
> - **scripts/** - Deployment automation
> - **automation/** - Scaffolding and documentation generation tools
> - **docs/** - Auto-generated GitBook documentation
>
> Everything follows best practices for FHEVM development."

### Scene 2: Smart Contract Overview
Open `contracts/AnonymousMedicalReview.sol`

**Script:**

> "Our main contract implements a medical review system. Doctors register, patients submit anonymous encrypted reviews, and the system aggregates ratings using FHE's public decryption.
>
> Key features:
> - Doctors can register (platform-only)
> - Anyone can submit encrypted reviews
> - Reviews contain 4 encrypted rating dimensions (1-5 scale)
> - Comments are stored encrypted
> - Aggregation requires minimum 3 reviews and triggers public decryption"

Show the contract structure:
- `registerDoctor()` function
- `submitAnonymousReview()` function
- `requestRatingAggregation()` function
- Data structures (Doctor, Review, AggregatedRating)

### Scene 3: Key Data Structures
Display the Review struct.

**Script:**

> "Notice our Review structure. The critical part is how we store encrypted values:
> - encryptedRating (euint8)
> - encryptedProfessionalism (euint8)
> - encryptedCommunication (euint8)
> - encryptedWaitTime (euint8)
>
> These are 8-bit encrypted unsigned integers. No one can see the actual values - not even the blockchain!"

---

## Part 3: Installation & Compilation (1 minute)

### Scene 1: Dependencies
Show package.json

```bash
cat package.json | head -40
```

**Script:**

> "Our dependencies are minimal and focused:
> - Hardhat for development and testing
> - ethers.js for contract interaction
> - @fhevm/solidity for FHE functionality
>
> The latest FHEVM v0.4.0 is included."

### Scene 2: Installation
Run npm install

```bash
npm install
```

**Script:**

> "Installing dependencies. This usually takes 30-60 seconds."

### Scene 3: Compilation
Compile the contract

```bash
npm run compile
```

**Script:**

> "Compiling the Solidity contract with Hardhat. The compiler generates the contract ABI and bytecode needed for deployment."

Show successful compilation output.

---

## Part 4: Test Suite Walkthrough (2 minutes)

### Scene 1: Test File Overview
Open `test/MedicalReview.test.js`

```bash
head -100 test/MedicalReview.test.js
```

**Script:**

> "Let me show you our comprehensive test suite. We have 25+ tests covering every aspect of the contract.
>
> Notice the TSDoc comments at the top:
> - @fileoverview explains what's being tested
> - @category tags mark which FHE concepts are demonstrated
>
> This documentation is automatically extracted to generate our examples hub."

### Scene 2: Running Tests
Execute test suite

```bash
npm test
```

**Script:**

> "Running our full test suite now. These tests verify:
> - Doctor registration and access control
> - Anonymous review submission with encryption
> - Multiple reviewer scenarios
> - Rating aggregation workflows
> - Error handling and edge cases
> - FHE access control patterns"

### Scene 3: Test Results
Show the test output.

**Script:**

> "All tests passing! 25 passing tests means:
> ✓ Access control works correctly
> ✓ Encrypted values are handled properly
> ✓ Business logic is sound
> ✓ Error cases are handled
>
> Let me highlight some key tests..."

### Scene 4: Key Test Explanations

Show specific test case from output and explain:

**Test 1: Anonymous Review Submission**

```bash
grep -A5 "should submit an anonymous review" test/MedicalReview.test.js
```

**Script:**

> "This test demonstrates submitting an encrypted review. The ratings are encrypted using FHE.asEuint8(), and we set proper access permissions using FHE.allow() and FHE.allowThis().
>
> The reviewer can later decrypt their own review, but the platform or other users cannot."

**Test 2: Rating Aggregation**

**Script:**

> "This test shows the public decryption workflow. After collecting 3+ reviews:
> 1. Call requestRatingAggregation()
> 2. FHE.requestDecryption() sends encrypted values to the decryption oracle
> 3. The oracle gathers threshold shares and returns decrypted values
> 4. processAggregation() receives and computes averages
> 5. Results are stored on-chain and revealed to everyone"

Show the `requestRatingAggregation()` function in code.

---

## Part 5: FHE Concepts in Action (2 minutes)

### Scene 1: Access Control Patterns
Highlight access control in the contract

**Script:**

> "Let me demonstrate the three key FHE concepts in this example.
>
> **Concept 1: Access Control**
>
> When a review is submitted, we set permissions:"

Show code:

```solidity
FHE.allowThis(reviews[reviewCount].encryptedRating);
FHE.allow(reviews[reviewCount].encryptedRating, msg.sender);
```

**Script:**

> "FHE.allowThis() allows the contract itself to access the encrypted value for aggregation.
> FHE.allow() grants the reviewer permission to decrypt their own submission.
> Together, these create a privacy boundary - only authorized parties can see the value."

### Scene 2: Encrypted Computation
Show encryption in contract

**Script:**

> "**Concept 2: Encrypted Computation**
>
> All ratings are encrypted at submission time:"

Show code:

```solidity
euint8 encryptedRating = FHE.asEuint8(_rating);
euint8 encryptedProfessionalism = FHE.asEuint8(_professionalism);
```

**Script:**

> "These encrypted values are stored on-chain. The blockchain and everyone can see they exist, but NO ONE can see their actual values. Computations can still happen on encrypted data - that's the power of FHE."

### Scene 3: Public Decryption
Show decryption workflow

**Script:**

> "**Concept 3: Public Decryption**
>
> To reveal aggregated ratings, we use FHE.requestDecryption():"

Show code:

```solidity
FHE.requestDecryption(cts, this.processAggregation.selector);
```

**Script:**

> "This sends encrypted values to the FHE network's decryption oracle. The oracle:
> 1. Gathers decryption shares from the network (threshold cryptography)
> 2. Verifies the proof
> 3. Returns decrypted values
> 4. Calls our callback function with the plaintext
>
> This is a trustless, verifiable process. No single entity can cheat or see values prematurely."

Show the callback function:

```solidity
function processAggregation(
    uint256 requestId,
    bytes memory cleartexts,
    bytes memory decryptionProof
) external {
    FHE.checkSignatures(requestId, cleartexts, decryptionProof);
    // Process aggregated data...
}
```

---

## Part 6: Automation Tools (1 minute)

### Scene 1: Scaffolding Tool
Show the scaffolding script

**Script:**

> "Beyond this example, we've created automation tools for the bounty requirement.
>
> The create-fhevm-example.js tool lets developers scaffold new FHEVM examples:"

Show help output or run:

```bash
node automation/create-fhevm-example.js --help
```

**Script:**

> "This generates:
> - Standalone repositories
> - Hardhat configuration
> - Test templates
> - Deployment scripts
> - Documentation framework"

### Scene 2: Documentation Generator
Show documentation generator

**Script:**

> "The generate-docs.js tool extracts documentation from code comments and generates GitBook-compatible markdown:"

Run the generator:

```bash
npm run generate-docs
```

**Script:**

> "It creates:
> - API reference pages
> - Concept guides
> - Example walkthroughs
> - Quick start guides
> - Category-based organization"

---

## Part 7: Local Deployment (1 minute)

### Scene 1: Start Local Node
Start Hardhat node

```bash
npm run node
```

**Script:**

> "Now let's demonstrate deployment. First, we start a local Hardhat blockchain node for testing."

### Scene 2: Deploy Contract
In another terminal:

```bash
npm run deploy:local
```

**Script:**

> "The deployment script:
> 1. Connects to the local network
> 2. Gets the deployer account and balance
> 3. Deploys the contract
> 4. Verifies deployment
> 5. Saves deployment info to deployment-info.json
>
> In production, this would deploy to Sepolia testnet with:
> npm run deploy"

Show successful deployment output with contract address.

---

## Part 8: Real-World Use Cases (0.5 minutes)

**Script:**

> "This pattern extends far beyond medical reviews:
>
> **Healthcare**: Patient-doctor ratings protecting both privacy and reputation
>
> **E-commerce**: Encrypted product reviews preventing vendor manipulation
>
> **HR Systems**: Anonymous employee feedback and performance reviews
>
> **Governance**: Private voting and polling
>
> **Insurance**: Confidential risk assessments
>
> Any scenario requiring:
> - Anonymous feedback
> - Aggregated statistics
> - Individual privacy
> - Verifiable results
>
> Can benefit from this FHE approach."

---

## Part 9: Project Highlights (0.5 minutes)

**Script:**

> "Key highlights of this bounty submission:
>
> ✅ **Comprehensive**: 25+ tests with full documentation
> ✅ **Educational**: Clear comments explaining FHE concepts
> ✅ **Production-Ready**: Proper error handling and access control
> ✅ **Reusable**: Scaffolding tools for new examples
> ✅ **Well-Documented**: Auto-generated GitBook docs
> ✅ **Best Practices**: Follows FHEVM and Solidity standards"

---

## Part 10: Closing (0.5 minutes)

**Script:**

> "This example demonstrates why FHE is revolutionary for blockchain:
>
> Traditional smart contracts operate on transparent data - everyone sees everything.
>
> With FHEVM, we can:
> - Protect user privacy
> - Maintain data confidentiality
> - Compute on encrypted data
> - Reveal only aggregate results
>
> All while maintaining blockchain's transparency and trustlessness.
>
> Thank you for watching! Check out the GitHub repository for the complete code, tests, and documentation. Happy building with FHEVM!"

---

## Video Production Tips

### Recording Setup

1. **Resolution**: 1080p or 4K at 60fps
2. **Screen Recording**: Use OBS, ScreenFlow, or similar
3. **Terminal Font Size**: Large enough to read easily
4. **Window Size**: Use readable font sizes (18px+ recommended)
5. **Background**: Clean, distraction-free

### Audio

- **Microphone**: Clear, minimize background noise
- **Volume**: Consistent, easy to hear
- **Pace**: Clear speech, moderate tempo
- **Pauses**: Allow time for viewers to digest information

### Editing

1. **Cut unnecessary pauses** between commands
2. **Add text overlays** for key concepts:
   - "FHE.allowThis() - Contract Access"
   - "FHE.allow() - Individual Access"
   - "FHE.requestDecryption() - Threshold Decryption"
3. **Highlight code** being discussed
4. **Include captions** for accessibility
5. **Add background music** (low volume, royalty-free)

### Timeline Markers

For YouTube, include chapters:
- 0:00 - Introduction
- 1:00 - Project Overview
- 2:30 - Installation & Compilation
- 3:30 - Test Suite
- 5:30 - FHE Concepts
- 7:30 - Automation Tools
- 8:30 - Deployment
- 9:00 - Use Cases & Closing

---

## Key Talking Points to Emphasize

1. **Access Control**: How FHE permissions work and why they matter
2. **Encrypted Computation**: Values are encrypted but still usable
3. **Public Decryption**: Trustless, verifiable threshold decryption
4. **Privacy Benefits**: Complete anonymity while maintaining functionality
5. **Production Readiness**: Proper error handling and security
6. **Developer Experience**: Clear tools and documentation
7. **Bounty Compliance**: Meets all Zama requirements

---

## Submission Checklist

- [ ] Video length: 5-10 minutes
- [ ] Covers: Setup, tests, deployment
- [ ] Explains: Access control, encryption, decryption
- [ ] Shows: Running tests, successful compilation
- [ ] Demonstrates: Local node and deployment
- [ ] Audio: Clear and understandable
- [ ] Video: 1080p or higher quality
- [ ] Captions: Enabled for accessibility
- [ ] Description: Includes GitHub repo link
- [ ] Tags: fhevm, zama, bounty, privacy, encryption

---

## Questions to Answer in Video

As you record, make sure to address:

1. **What is this example about?**
   Privacy-preserving medical review system using FHEVM

2. **What FHE concepts does it demonstrate?**
   Access control, encryption, public decryption

3. **Why is this useful?**
   Shows real-world privacy-preserving applications

4. **How do developers use this?**
   As template for their own FHE projects

5. **What are the key security features?**
   Access control, encrypted storage, threshold decryption

6. **How is it tested?**
   25+ comprehensive tests covering all scenarios

7. **Can it be deployed?**
   Yes, to local networks and Sepolia testnet

8. **What tools are provided?**
   Scaffolding tool and documentation generator

---

Good luck with your video submission! 🎬
