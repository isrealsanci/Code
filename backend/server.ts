import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fs from "fs";
import { ethers } from "ethers";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const historyFile = "./winners.json";

app.use(cors());
app.use(express.json());

// Setup provider dan wallet
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const wallet = new ethers.Wallet(process.env.SENDER_PRIVATE_KEY!, provider);

interface Prize {
  label: string;
  amount: number;
}

// Endpoint untuk spin dan kirim reward
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

    // Logging untuk debug
    console.log("➡️ Sending", prize.amount, "MON to", address);
    console.log("📤 From Wallet:", wallet.address);
    const network = await provider.getNetwork();
    const balance = await provider.getBalance(wallet.address);
    console.log("🔗 Network:", network.name);
    console.log("💰 Balance:", ethers.formatEther(balance));

    if (balance < value) {
      return res.status(400).json({ error: "Insufficient balance to send reward" });
    }

    const tx = await wallet.sendTransaction({
      to: address,
      value: value,
    });

    const entry = {
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

// Endpoint untuk get history winners
app.get("/api/history", (req, res) => {
  if (!fs.existsSync(historyFile)) return res.json([]);
  const data = fs.readFileSync(historyFile, "utf-8");
  res.json(JSON.parse(data));
});

// Simpan data winner ke file
function saveWinner(entry: any) {
  let winners = [];
  if (fs.existsSync(historyFile)) {
    winners = JSON.parse(fs.readFileSync(historyFile, "utf-8"));
  }
  winners.unshift(entry);
  fs.writeFileSync(historyFile, JSON.stringify(winners.slice(0, 100), null, 2));
}

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
