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

// Enhanced CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || "*",
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"]
}));

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

// Initialize provider and wallet
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const wallet = new ethers.Wallet(process.env.SENDER_PRIVATE_KEY!, provider);

// Helper function to save winners
function saveWinner(entry: WinnerEntry) {
  let winners: WinnerEntry[] = [];

  if (fs.existsSync(historyFile)) {
    try {
      winners = JSON.parse(fs.readFileSync(historyFile, "utf-8"));
    } catch (err) {
      console.error("Error reading history file:", err);
      winners = [];
    }
  }

  winners.unshift(entry);
  fs.writeFileSync(historyFile, JSON.stringify(winners.slice(0, 100), null, 2));
}

// Improved Neynar API fetch function with proper error handling and updated response format
async function fetchNeynarUsers(addresses: string[]): Promise<Record<string, any[]>> {
  try {
    const { data } = await axios.get(
      "https://api.neynar.com/v2/farcaster/user/bulk-by-address",
      {
        params: { 
          addresses: addresses.join(","),
          viewer_fid: 1
        },
        headers: { 
          'x-api-key': process.env.NEYNAR_API_KEY!,
          'Accept': 'application/json'
        },
        timeout: 10000
      }
    );
    // Data is an object keyed by lowercase address with array of users as values
    return data || {};
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Neynar API Error:', {
        status: error.response?.status,
        data: error.response?.data,
        url: error.config?.url
      });
    } else if (error instanceof Error) {
      console.error('Unexpected Error:', error.message);
    } else {
      console.error('Unknown Error:', error);
    }
    return {};
  }
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
      to: ethers.getAddress(address),
      value: value,
    });

    const entry: WinnerEntry = {
      address: ethers.getAddress(address),
      amount: prize.amount,
      txHash: tx.hash,
      timestamp: new Date().toISOString(),
    };

    saveWinner(entry);
    res.json({ 
      success: true, 
      txHash: tx.hash,
      explorerUrl: `https://testnet.monadexplorer.com/tx/${tx.hash}`
    });
  } catch (err: any) {
    console.error("Transaction failed:", err);
    res.status(500).json({ 
      error: "Transaction failed",
      details: err.message 
    });
  }
});

// Enriched history endpoint
app.get("/api/enriched-history", async (req, res) => {
  if (!fs.existsSync(historyFile)) {
    return res.json([]);
  }

  try {
    const winners: WinnerEntry[] = JSON.parse(fs.readFileSync(historyFile, "utf-8"));
    const addresses = winners.slice(0, 10).map(w => ethers.getAddress(w.address).toLowerCase());

    // Fetch users mapped by address (lowercase)
    const usersMap = await fetchNeynarUsers(addresses);

    const enrichedWinners = winners.slice(0, 10).map(winner => {
      const normalizedAddress = ethers.getAddress(winner.address).toLowerCase();
      const userList = usersMap[normalizedAddress] || [];
      const user = userList[0]; // Usually one user per address

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
    try {
      const winners: WinnerEntry[] = JSON.parse(fs.readFileSync(historyFile, "utf-8"));
      res.json(winners.slice(0, 10));
    } catch (parseError) {
      console.error("Fallback failed:", parseError);
      res.status(500).json({ error: "Failed to load winners" });
    }
  }
});

// Basic history endpoint
app.get("/api/history", (req, res) => {
  if (!fs.existsSync(historyFile)) {
    return res.json([]);
  }

  try {
    const data = fs.readFileSync(historyFile, "utf-8");
    const winners = JSON.parse(data);
    res.json(winners.slice(0, 10));
  } catch (err) {
    console.error("Error reading history:", err);
    res.status(500).json({ error: "Failed to load history" });
  }
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ 
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime() 
  });
});

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`Neynar API ${process.env.NEYNAR_API_KEY ? "configured" : "not configured"}`);
  console.log(`Ethereum RPC: ${process.env.RPC_URL}`);
  console.log(`Frontend URL: ${process.env.FRONTEND_URL || "All origins allowed"}`);
});
