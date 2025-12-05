# Getting Started with FHEVM Medical Review Example

This guide will help you get up and running with the Privacy-Preserving Medical Review System in just a few minutes.

## Prerequisites

Before you begin, ensure you have:

- **Node.js** version 18.0.0 or higher
- **npm** version 9.0.0 or higher
- **Git** (for cloning the repository)

Check your versions:

```bash
node --version   # Should be >= 18.0.0
npm --version    # Should be >= 9.0.0
```

## Quick Setup (5 minutes)

### Step 1: Clone the Repository

```bash
git clone https://github.com/your-username/fhevm-anonymous-medical-review
cd fhevm-anonymous-medical-review
```

### Step 2: Install Dependencies

```bash
npm install
```

This will install:
- Hardhat (Ethereum development environment)
- ethers.js (Ethereum library)
- @fhevm/solidity (FHE functionality)
- Testing libraries (Chai)

Installation takes 1-2 minutes.

### Step 3: Compile the Contract

```bash
npm run compile
```

Expected output:
```
Compiled 1 Solidity file successfully
```

### Step 4: Run Tests

```bash
npm test
```

Expected output:
```
  MedicalReview - Access Control & Encryption
    ✓ should register a doctor and emit DoctorRegistered event
    ✓ should prevent non-platform from registering doctors
    ... (23 more tests)

  25 passing (2s)
```

🎉 **Success!** Your environment is set up correctly.

## Understanding the Project

### What This Example Demonstrates

This project shows how to build privacy-preserving applications using FHEVM:

1. **Access Control**: Who can see encrypted data
2. **Encrypted Computation**: Working with encrypted values
3. **Public Decryption**: Revealing aggregate statistics

### Key Files

```
fhevm-anonymous-medical-review/
├── contracts/
│   └── AnonymousMedicalReview.sol     # Main FHE contract
├── test/
│   └── MedicalReview.test.js          # 25+ test cases
├── scripts/
│   └── deploy.js                      # Deployment script
├── automation/
│   ├── create-fhevm-example.js        # Create new examples
│   └── generate-docs.js               # Generate documentation
└── README.md                          # Full documentation
```

## Next Steps

### Option 1: Deploy Locally (Recommended for Testing)

**Terminal 1** - Start a local blockchain:

```bash
npm run node
```

Keep this terminal open. You'll see:
```
Started HTTP and WebSocket JSON-RPC server at http://127.0.0.1:8545/
```

**Terminal 2** - Deploy the contract:

```bash
npm run deploy:local
```

Expected output:
```
✅ AnonymousMedicalReview deployed to: 0x5FbDB2315678afecb367f032d93F642f64180aa3
```

### Option 2: Explore the Tests

The test suite is the best way to learn FHEVM concepts:

```bash
# Run all tests with verbose output
npm run test:verbose

# Run tests with gas reporting
npm run test:gas
```

Open `test/MedicalReview.test.js` to see:
- How to encrypt values with `FHE.asEuint8()`
- How to set permissions with `FHE.allow()` and `FHE.allowThis()`
- How to request public decryption with `FHE.requestDecryption()`

### Option 3: Generate Documentation

```bash
npm run generate-docs
```

This creates GitBook-compatible documentation in the `docs/` folder:

```
docs/
├── README.md
├── SUMMARY.md
├── quick-start.md
├── concepts/
│   ├── access-control.md
│   ├── public-decryption.md
│   └── encrypted-computation.md
├── examples/
│   └── medical-review.md
└── api/
    └── AnonymousMedicalReview.md
```

### Option 4: Create Your Own FHEVM Example

Use the scaffolding tool to create a new FHEVM example:

```bash
node automation/create-fhevm-example.js my-voting-app governance
```

This creates a complete new repository with:
- Contract templates
- Test structure
- Deployment scripts
- README and documentation

## Deploying to Testnet (Sepolia)

### Step 1: Setup Environment

Create a `.env` file:

```bash
cp .env.template .env
```

Edit `.env` and add:

```env
PRIVATE_KEY=your_private_key_without_0x
INFURA_API_KEY=your_infura_api_key
```

**Getting Keys:**
- Private Key: Export from MetaMask (Settings → Security & Privacy → Reveal Private Key)
- Infura Key: Sign up at https://infura.io/

⚠️ **Security Warning**: Never commit `.env` to Git!

### Step 2: Get Testnet ETH

You need Sepolia ETH for deployment:

1. Go to https://sepoliafaucet.com/
2. Enter your wallet address
3. Request testnet ETH

### Step 3: Deploy

```bash
npm run deploy
```

Expected output:
```
Deploying contracts with the account: 0x...
Account balance: 0.5 ETH
✅ AnonymousMedicalReview deployed to: 0x...
✅ Transaction hash: 0x...
```

## Understanding the Code

### 1. Encrypting Values

```solidity
// In AnonymousMedicalReview.sol
euint8 encryptedRating = FHE.asEuint8(_rating);
```

**What it does**: Converts a plaintext value (1-5) into an encrypted euint8.

**Why it matters**: The value is now hidden on-chain. No one can see the actual rating.

### 2. Setting Permissions

```solidity
// Allow the contract to use this value
FHE.allowThis(encryptedRating);

// Allow the reviewer to decrypt their own rating
FHE.allow(encryptedRating, msg.sender);
```

**What it does**: Sets who can access the encrypted value.

**Why it matters**: This is how we maintain privacy while allowing necessary operations.

### 3. Public Decryption

```solidity
// Request threshold decryption
FHE.requestDecryption(ciphertexts, this.callbackFunction.selector);

// Receive decrypted values
function callbackFunction(
    uint256 requestId,
    bytes memory cleartexts,
    bytes memory proof
) external {
    FHE.checkSignatures(requestId, cleartexts, proof);
    // Use decrypted values...
}
```

**What it does**: Requests the FHE network to decrypt values and return them.

**Why it matters**: This is how aggregate statistics are computed without revealing individual data.

## Common Commands

```bash
# Development
npm run compile           # Compile contracts
npm test                 # Run all tests
npm run test:verbose     # Verbose test output
npm run test:gas         # Include gas reporting
npm run coverage         # Generate coverage report

# Deployment
npm run node             # Start local Hardhat node
npm run deploy:local     # Deploy to local node
npm run deploy           # Deploy to Sepolia testnet

# Automation
npm run generate-docs    # Generate documentation
npm run scaffold         # Alias for create-fhevm-example

# Linting (if configured)
npm run lint             # Run linter
npm run format           # Format code
```

## Troubleshooting

### "Module not found" errors

```bash
rm -rf node_modules package-lock.json
npm install
```

### "Invalid nonce" during deployment

Reset your account in MetaMask:
1. MetaMask → Settings → Advanced
2. Click "Clear activity tab data"

### "Insufficient funds" during deployment

Get more Sepolia ETH from https://sepoliafaucet.com/

### Tests failing

Ensure you're using:
- Node.js >= 18.0.0
- Latest dependencies: `npm install`

### Compilation errors

```bash
npx hardhat clean
npm run compile
```

## Learning Resources

### FHEVM Documentation

- [Official FHEVM Docs](https://docs.zama.ai/fhevm)
- [Solidity API Reference](https://docs.zama.ai/fhevm/solidity-api)
- [FHEVM GitHub](https://github.com/zama-ai/fhevm)

### Tutorials

1. **Read the Tests**: `test/MedicalReview.test.js` contains detailed comments
2. **Read the Contract**: `contracts/AnonymousMedicalReview.sol` has inline documentation
3. **Watch Demo Video**: See `VIDEO_SCRIPT.md` for walkthrough

### Community

- [Zama Discord](https://discord.gg/zama)
- [Zama Twitter](https://twitter.com/zama_fhe)
- [YouTube Channel](https://www.youtube.com/@zama_fhe)

## What to Build Next

Now that you understand the basics, try building:

### Beginner Projects

1. **Anonymous Voting**: Vote without revealing choice
2. **Private Auction**: Bid without showing amount
3. **Encrypted Leaderboard**: Rankings without revealing scores

### Intermediate Projects

1. **Confidential Token**: ERC20 with hidden balances
2. **Private Marketplace**: Buy/sell with hidden prices
3. **Anonymous Survey**: Collect responses privately

### Advanced Projects

1. **Privacy-Preserving Insurance**: Risk assessment with encrypted data
2. **Confidential DeFi**: Lending/borrowing with private amounts
3. **Zero-Knowledge Identity**: Verify credentials without revealing data

## Getting Help

If you get stuck:

1. **Check Documentation**: See README.md
2. **Read Tests**: See `test/MedicalReview.test.js`
3. **Open Issue**: Create a GitHub issue
4. **Ask Community**: Join Zama Discord

## Next: Dive Deeper

- 📖 **Read**: `README.md` for complete documentation
- 🧪 **Study**: `test/MedicalReview.test.js` for examples
- 📹 **Watch**: Use `VIDEO_SCRIPT.md` to create a demo
- 🏗️ **Build**: Use `create-fhevm-example.js` to scaffold new projects
- 🎓 **Learn**: Visit https://docs.zama.ai/fhevm

---

**Welcome to FHEVM development!** 🎉

You're now ready to build privacy-preserving decentralized applications.
