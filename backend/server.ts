import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fs from "fs";
import { ethers } from "ethers";
import axios from "axios";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const historyFile = "./winners.json";

app.use(cors());
app.use(express.json());

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

// Helper function to save winners
function saveWinner(entry: WinnerEntry) {
  let winners: WinnerEntry[] = [];
  
  if (fs.existsSync(historyFile)) {
    try {
      winners = JSON.parse(fs.readFileSync(historyFile, "utf-8"));
    } catch (err) {
      console.error("Error reading history file:", err);
    }
  }

  winners.unshift(entry);
  // Keep only the latest 100 winners
  fs.writeFileSync(historyFile, JSON.stringify(winners.slice(0, 100), null, 2));
}

// Spin endpoint
app.post("/api/spin", async (req, res) => {
  const { address, prize }: { address: string; prize: Prize } = req.body;

  if (!ethers.isAddress(address)) {
    return res.status(400).json({ error: "Invalid Ethereum address" });
  }

  if (prize.amount <= 0) {
    return res.json({ message: "No reward sent" });
  }

  try {
    const value = ethers.parseEther(prize.amount.toString());
    const tx = await wallet.sendTransaction({
      to: address,
      value: value,
    });

    const entry: WinnerEntry = {
      address: ethers.getAddress(address), // Store checksum address
      amount: prize.amount,
      txHash: tx.hash,
      timestamp: new Date().toISOString(),
    };

    saveWinner(entry);
    res.json({ success: true, txHash: tx.hash });
  } catch (err: any) {
    console.error("Transaction failed:", err);
    res.status(500).json({ error: "Transaction failed", details: err.message });
  }
});

// Enriched history endpoint
app.get("/api/enriched-history", async (req, res) => {
  if (!fs.existsSync(historyFile)) return res.json([]);

  try {
    const winners: WinnerEntry[] = JSON.parse(fs.readFileSync(historyFile, "utf-8"));
    const addresses = winners.slice(0, 10).map(w => w.address); // Only process first 10

    // Fetch from Neynar API
    const { data } = await axios.get(
      "https://api.neynar.com/v2/farcaster/user/bulk-by-address",
      {
        params: { addresses: addresses.join(","), viewer_fid: 1 },
        headers: { api_key: process.env.NEYNAR_API_KEY! },
      }
    );

    const enrichedWinners = winners.slice(0, 10).map(winner => {
      const user = data.users?.find((u: any) => 
        u.verified_addresses?.eth_addresses?.includes(winner.address.toLowerCase()) ||
        u.custody_address?.toLowerCase() === winner.address.toLowerCase()
      );

      return {
        ...winner,
        pfp: user?.pfp_url,
        username: user?.username,
        displayName: user?.display_name,
      };
    });

    res.json(enrichedWinners);
  } catch (error) {
    console.error("Enrichment failed:", error);
    const winners: WinnerEntry[] = JSON.parse(fs.readFileSync(historyFile, "utf-8"));
    res.json(winners.slice(0, 10)); // Fallback with limit
  }
});

// Basic history endpoint
app.get("/api/history", (req, res) => {
  if (!fs.existsSync(historyFile)) return res.json([]);
  try {
    const data = fs.readFileSync(historyFile, "utf-8");
    res.json(JSON.parse(data).slice(0, 10)); // Return max 10 winners
  } catch (err) {
    console.error("Error reading history:", err);
    res.status(500).json({ error: "Failed to load history" });
  }
});

// Initialize provider and wallet
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const wallet = new ethers.Wallet(process.env.SENDER_PRIVATE_KEY!, provider);

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});