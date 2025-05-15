import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fs from "fs";
import { ethers } from "ethers";
import { NeynarAPIClient } from "@neynar/nodejs-sdk";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const historyFile = "./winners.json";

// Initialize Neynar client with proper configuration
const neynarClient = new NeynarAPIClient({
  apiKey: process.env.NEYNAR_API_KEY!,
  basePath: "https://api.neynar.com/v2"
});

app.use(cors());
app.use(express.json());

// Setup provider and wallet
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const wallet = new ethers.Wallet(process.env.SENDER_PRIVATE_KEY!, provider);

// Interfaces
interface Prize {
  label: string;
  amount: number;
}

interface WinnerEntry {
  address: string;
  amount: number;
  txHash: string;
  timestamp: string;
}

interface EnrichedWinner extends WinnerEntry {
  pfp?: string;
  username?: string;
  displayName?: string;
}

interface SpinRecord {
  count: number;
  lastSpin: number;
}

// In-memory storage for spin records (consider using Redis in production)
const spinRecords: Record<string, SpinRecord> = {};

// Helper function to check spin limit
function checkSpinLimit(address: string): { allowed: boolean; spinsLeft: number; lastSpinTime: number | null } {
  const now = Date.now();
  const twentyFourHours = 24 * 60 * 60 * 1000;
  const record = spinRecords[address];

  // If no record or last spin was more than 24 hours ago, reset
  if (!record || now - record.lastSpin > twentyFourHours) {
    spinRecords[address] = { count: 0, lastSpin: now };
    return { allowed: true, spinsLeft: 3, lastSpinTime: null };
  }

  const spinsLeft = Math.max(3 - record.count, 0);
  return {
    allowed: record.count < 3,
    spinsLeft,
    lastSpinTime: record.lastSpin
  };
}

// Endpoint: Check spin status
app.get("/api/spin-status", (req, res) => {
  const { address } = req.query;

  if (!address || typeof address !== 'string') {
    return res.status(400).json({ error: "Invalid address" });
  }

  const { spinsLeft, lastSpinTime } = checkSpinLimit(address);
  res.json({ spinsLeft, lastSpinTime });
});

// Endpoint: Spin
app.post("/api/spin", async (req, res) => {
  const { address, prize }: { address: string; prize: Prize } = req.body;

  if (!ethers.isAddress(address)) {
    return res.status(400).json({ error: "Invalid address" });
  }

  // Check spin limit
  const { allowed, spinsLeft, lastSpinTime } = checkSpinLimit(address);
  if (!allowed) {
    return res.status(429).json({ 
      error: "Daily spin limit reached (3 spins per 24 hours)",
      spinsLeft,
      lastSpinTime
    });
  }

  if (prize.amount <= 0) {
    return res.json({ 
      message: "No reward sent",
      spinsLeft,
      lastSpinTime
    });
  }

  try {
    const value = ethers.parseEther(prize.amount.toString());

    console.log("➡️ Sending", prize.amount, "MON to", address);
    const tx = await wallet.sendTransaction({
      to: address,
      value: value,
    });

    const entry: WinnerEntry = {
      address,
      amount: prize.amount,
      txHash: tx.hash,
      timestamp: new Date().toISOString(),
    };

    saveWinner(entry);
    
    // Update spin record
    spinRecords[address].count += 1;
    spinRecords[address].lastSpin = Date.now();

    res.json({ 
      success: true, 
      txHash: tx.hash,
      spinsLeft: 3 - spinRecords[address].count,
      lastSpinTime: spinRecords[address].lastSpin
    });
  } catch (err: any) {
    console.error("❌ TX Error:", err);
    res.status(500).json({ 
      error: "Transaction failed",
      spinsLeft: checkSpinLimit(address).spinsLeft,
      lastSpinTime: checkSpinLimit(address).lastSpinTime
    });
  }
});

// Endpoint: Get Basic History
app.get("/api/history", (req, res) => {
  if (!fs.existsSync(historyFile)) return res.json([]);
  try {
    const data = fs.readFileSync(historyFile, "utf-8");
    res.json(JSON.parse(data));
  } catch (err) {
    console.error("Error reading history file:", err);
    res.json([]);
  }
});

// Endpoint: Get Enriched History with Farcaster Data
app.get("/api/enriched-history", async (req, res) => {
  if (!fs.existsSync(historyFile)) return res.json([]);
  
  try {
    const winners: WinnerEntry[] = JSON.parse(fs.readFileSync(historyFile, "utf-8"));
    const addresses = winners.map(w => w.address);

    // Fetch user data from Neynar
    const { users } = await neynarClient.fetchBulkUsersByEthOrSolAddress({
      addresses: addresses,
      addressTypes: ['verified_address'],
      viewerFid: 1
    });

    const enrichedWinners = winners.map(winner => {
      const user = users.find(u => 
        u.verified_addresses.eth_addresses?.includes(winner.address.toLowerCase()) ||
        u.custody_address?.toLowerCase() === winner.address.toLowerCase()
      );
      
      return {
        ...winner,
        pfp: user?.pfp_url,
        username: user?.username,
        displayName: user?.display_name
      };
    });

    res.json(enrichedWinners);
  } catch (error) {
    console.error('Error enriching data:', error);
    // Fallback to basic history
    try {
      const winners: WinnerEntry[] = JSON.parse(fs.readFileSync(historyFile, "utf-8"));
      res.json(winners);
    } catch (err) {
      console.error('Error loading fallback history:', err);
      res.status(500).json({ error: "Failed to load winner data" });
    }
  }
});

// Helper function to save winner
function saveWinner(entry: WinnerEntry) {
  let winners: WinnerEntry[] = [];
  if (fs.existsSync(historyFile)) {
    try {
      winners = JSON.parse(fs.readFileSync(historyFile, "utf-8"));
    } catch (err) {
      console.error("Error reading winners file:", err);
      winners = [];
    }
  }
  winners.unshift(entry);
  fs.writeFileSync(historyFile, JSON.stringify(winners.slice(0, 100), null, 2));
}

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`Neynar API ${neynarClient ? 'connected' : 'not configured'}`);
  console.log(`Ethereum provider ${provider ? 'connected' : 'not configured'}`);
});