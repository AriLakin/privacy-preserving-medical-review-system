# Vercel Deployment Guide

This guide explains how to deploy the Anonymous Medical Review Platform to Vercel.

## Prerequisites

- Vercel account (free at https://vercel.com)
- GitHub account with this repository
- Node.js 18+ installed locally

## Deployment Steps

### 1. Push to GitHub

First, ensure your code is pushed to GitHub:

```bash
git add .
git commit -m "Prepare for Vercel deployment"
git push origin main
```

### 2. Connect to Vercel

1. Go to https://vercel.com/dashboard
2. Click "Add New Project"
3. Select "Import Git Repository"
4. Search for and select your GitHub repository
5. Click "Import"

### 3. Configure Environment Variables

In Vercel's project settings:

1. Go to Settings → Environment Variables
2. Add the following variables (if you plan to use contract deployment):
   - `PRIVATE_KEY`: Your Ethereum private key (without 0x prefix)
   - `INFURA_API_KEY`: Your Infura API key
   - `ETHERSCAN_API_KEY`: Optional, for contract verification

### 4. Deploy

Vercel will automatically deploy when you push to main branch.

## What Gets Deployed

The Vercel deployment includes:

- **Express.js Server**: Serves the frontend interface
- **API Endpoints**:
  - `/api/deployment-info` - Returns contract deployment information
  - `/api/health` - Health check endpoint
- **Static Files**: HTML, CSS, JavaScript for the frontend interface

### Production Dependencies Only

Vercel installs only production dependencies (using `npm install --omit=dev`):
- `express` - Web server
- `cors` - Cross-origin resource sharing
- `dotenv` - Environment variable management
- `ethers` - Ethereum library for frontend

Development dependencies (Hardhat, testing tools, etc.) are **NOT** installed on Vercel to:
- Reduce build time
- Minimize deployment size
- Avoid version conflicts with serverless environment

## Important Notes

### About Contract Compilation

The Vercel deployment does **NOT** include:
- Hardhat node
- Contract compilation during deployment
- Direct contract interaction

This is by design because:
- Serverless functions have resource limitations
- Hardhat compilation requires significant disk space
- Smart contract operations need to be done locally

### Workflow

1. **Local Development**:
   ```bash
   npm run compile
   npm run test
   npm run node  # Start local network
   npm run deploy:local  # Deploy to local network
   ```

2. **Vercel Deployment**: Deploys the web interface only
3. **Contract Interaction**: Use local Hardhat node or testnet

## Health Check

To verify your deployment is running:

```bash
curl https://your-project.vercel.app/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2025-12-05T...",
  "service": "Anonymous Medical Review Platform"
}
```

## Understanding Vercel Warnings

You may see these warnings during deployment (they are **NOT errors**):

### Warning 1: "builds existing in your configuration file"
```
WARN! Due to builds existing in your configuration file, the Build and
Development Settings defined in your Project Settings will not apply.
```

**What it means:** The `vercel.json` configuration file overrides Vercel dashboard settings.

**Action needed:** ✅ None - this is expected behavior. Our `vercel.json` properly configures the Express.js serverless deployment.

### Warning 2: "node version will automatically upgrade"
```
Warning: Detected "engines": { "node": "18.x" } in your package.json
```

**What it means:** We're pinning to Node.js 18.x (18.0.0, 18.1.0, etc.) to ensure stability.

**Action needed:** ✅ None - we've pinned to a specific major version to prevent breaking changes.

## Troubleshooting

### Build Fails with "Cannot find module"

If you see errors like `Cannot find module '@fhevm/solidity'`:

1. Check that `package.json` has correct versions
2. Delete `node_modules` and `package-lock.json` locally
3. Run `npm install`
4. Push changes to GitHub
5. Trigger rebuild in Vercel dashboard

### Deployment Info Not Found

The `/api/deployment-info` endpoint looks for `deployment-info.json`.

To fix:
1. Deploy contract locally: `npm run deploy:local`
2. This creates `deployment-info.json` in the project root
3. Commit and push to GitHub
4. Redeploy in Vercel

### Port Already in Use

Vercel automatically manages ports. If testing locally:

```bash
PORT=3001 npm start
```

## Viewing Logs

In Vercel Dashboard:
1. Go to your project
2. Click "Deployments"
3. Select the latest deployment
4. Click "Logs" to see build and runtime logs

## Custom Domain

To add a custom domain:

1. In Vercel project settings → Domains
2. Add your domain
3. Update DNS records as instructed
4. Wait for DNS propagation (typically 24-48 hours)

## Performance Optimization

The deployment is optimized for:
- Fast frontend loading
- Minimal API response times
- Efficient static file serving

For contract operations, consider:
- Using Infura for JSON-RPC instead of local node
- Deploying contracts to testnet (Sepolia)
- Using The Graph for querying historical data

## Support

For issues:
- Check Vercel deployment logs
- Verify environment variables are set correctly
- Ensure repository is up to date
- Review this guide for common issues

---

**Happy deploying!**
