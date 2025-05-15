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

// Endpoint: Spin
app.post("/api/spin", async (req, res) => {
  const { address, prize }: { address: string; prize: Prize } = req.body;

  if (!ethers.isAddress(address)) {
    return res.status(400).json({ error: "Invalid address" });
  }

  if (prize.amount <= 0) {
    return res.json({ message: "Zonk, no reward sent." });
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
    res.json({ success: true, txHash: tx.hash });
  } catch (err: any) {
    console.error("❌ TX Error:", err);
    res.status(500).json({ error: "Transaction failed." });
  }
});

// Endpoint: Get Basic History
app.get("/api/history", (req, res) => {
  if (!fs.existsSync(historyFile)) return res.json([]);
  try {
    const data = fs.readFileSync(historyFile, "utf-8");
    res.json(JSON.parse(data));
  } catch {
    res.json([]);
  }
});

// Endpoint: Get Enriched History with Farcaster Data
app.get("/api/enriched-history", async (req, res) => {
  if (!fs.existsSync(historyFile)) return res.json([]);
  
  try {
    const winners: WinnerEntry[] = JSON.parse(fs.readFileSync(historyFile, "utf-8"));
    const addresses = winners.map(w => w.address);

    // Correct Neynar SDK method with proper parameters
    const { users } = await neynarClient.fetchBulkUsersByEthOrSolAddress({
      addresses: addresses,
      addressTypes: ['verified_address'], // Correct property name is addressTypes (plural)
      viewerFid: 1 // Optional viewer FID
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
    const winners: WinnerEntry[] = JSON.parse(fs.readFileSync(historyFile, "utf-8"));
    res.json(winners);
  }
});

// Helper function to save winner
function saveWinner(entry: WinnerEntry) {
  let winners: WinnerEntry[] = [];
  if (fs.existsSync(historyFile)) {
    try {
      winners = JSON.parse(fs.readFileSync(historyFile, "utf-8"));
    } catch {
      winners = [];
    }
  }
  winners.unshift(entry);
  fs.writeFileSync(historyFile, JSON.stringify(winners.slice(0, 100), null, 2));
}

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});