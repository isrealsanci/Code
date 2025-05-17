// server.ts (final merged: multi-chain + neynar + broadcast notification)
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fs from "fs";
import { ethers } from "ethers";
import axios from "axios";
import { prizeList, Prize } from "./prizes";
import {
  saveNotificationToken,
  removeNotificationToken,
  sendNotificationToFid,
  sendNotificationToAllUsers,
} from "./lib/notifications";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const historyFile = "./winners.json";

app.use(cors({
  origin: process.env.FRONTEND_URL || "*",
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"]
}));
app.use(express.json());

interface RewardRequest {
  address: string;
  prize: Prize;
}

interface WinnerEntry {
  address: string;
  amount: number;
  chain: string;
  token: string | null;
  txHash: string;
  timestamp: string;
}

async function fetchNeynarUsers(addresses: string[]): Promise<Record<string, any[]>> {
  try {
    const { data } = await axios.get(
      "https://api.neynar.com/v2/farcaster/user/bulk-by-address",
      {
        params: { addresses: addresses.join(","), viewer_fid: 1 },
        headers: {
          'x-api-key': process.env.NEYNAR_API_KEY!,
          'Accept': 'application/json'
        },
        timeout: 10000
      }
    );
    return data || {};
  } catch (error) {
    console.error("Neynar API Error:", error);
    return {};
  }
}

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
  fs.writeFileSync(historyFile, JSON.stringify(winners.slice(0, 100), null, 2));
}

async function sendReward(address: string, prize: Prize): Promise<string> {
  const amountInWei = ethers.parseUnits(prize.amount.toString(), 18);
  let provider: ethers.JsonRpcProvider;
  let wallet: ethers.Wallet;

  switch (prize.chain) {
    case "monad":
      provider = new ethers.JsonRpcProvider(process.env.MONAD_RPC);
      wallet = new ethers.Wallet(process.env.SIGN_PK!, provider);
      break;
    case "celo":
      provider = new ethers.JsonRpcProvider(process.env.CELO_RPC);
      wallet = new ethers.Wallet(process.env.SIGN_PK!, provider);
      break;
    case "base":
      provider = new ethers.JsonRpcProvider(process.env.BASE_RPC);
      wallet = new ethers.Wallet(process.env.SIGN_PK!, provider);
      break;
    default:
      throw new Error("Unsupported chain");
  }

  const tx = await wallet.sendTransaction({ to: address, value: amountInWei });
  return tx.hash;
}

app.post("/api/spin", async (req, res) => {
  const { address, prize }: RewardRequest = req.body;

  if (!ethers.isAddress(address) || prize.amount <= 0) {
    return res.status(400).json({ error: "Invalid input" });
  }

  try {
    const txHash = await sendReward(address, prize);
    const entry: WinnerEntry = {
      address: ethers.getAddress(address),
      amount: prize.amount,
      chain: prize.chain,
      token: prize.token,
      txHash,
      timestamp: new Date().toISOString()
    };
    saveWinner(entry);
    res.json({ success: true, txHash });
  } catch (err: any) {
    console.error("Spin error:", err);
    res.status(500).json({ error: "Failed to send reward", details: err.message });
  }
});

app.post("/api/webhook", async (req, res) => {
  const { event, fid, notification_token, notification_url } = req.body;

  if (event === "frame_added") {
    saveNotificationToken(fid, notification_token, notification_url);
  } else if (event === "frame_removed") {
    removeNotificationToken(fid);
  }

  res.status(200).send("ok");
});

app.post("/api/send-broadcast", async (req, res) => {
  const { title, body, targetUrl } = req.body;

  if (!title || !body || !targetUrl) {
    return res.status(400).json({ error: "Missing parameters" });
  }

  try {
    await sendNotificationToAllUsers(title, body, targetUrl);
    res.status(200).json({ success: true });
  } catch (err) {
    console.error("Broadcast failed:", err);
    res.status(500).json({ error: "Failed to send broadcast" });
  }
});

app.get("/api/enriched-history", async (req, res) => {
  if (!fs.existsSync(historyFile)) return res.json([]);

  try {
    const winners: WinnerEntry[] = JSON.parse(fs.readFileSync(historyFile, "utf-8"));
    const addresses = winners.slice(0, 10).map(w => ethers.getAddress(w.address).toLowerCase());
    const usersMap = await fetchNeynarUsers(addresses);

    const enriched = winners.slice(0, 10).map(w => {
      const user = usersMap[ethers.getAddress(w.address).toLowerCase()]?.[0];
      return {
        ...w,
        username: user?.username,
        displayName: user?.display_name,
        pfp: user?.pfp_url
      };
    });

    res.json(enriched);
  } catch (err) {
    console.error("Failed to enrich history:", err);
    res.status(500).json({ error: "Failed to enrich history" });
  }
});

app.get("/api/history", (req, res) => {
  if (!fs.existsSync(historyFile)) return res.json([]);
  try {
    const data = fs.readFileSync(historyFile, "utf-8");
    const winners = JSON.parse(data);
    res.json(winners.slice(0, 10));
  } catch (err) {
    console.error("Error reading history:", err);
    res.status(500).json({ error: "Failed to load history" });
  }
});

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
  console.log(`Frontend URL: ${process.env.FRONTEND_URL || "All origins allowed"}`);
});
