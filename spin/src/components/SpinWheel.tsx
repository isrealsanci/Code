import React, { useState, useEffect } from "react";
import { Wheel } from "react-custom-roulette";
import { sdk } from "@farcaster/frame-sdk";

const data = [
  { option: "Thanks", style: { backgroundColor: "#ddd" } },
  { option: "0.001 MON" },
  { option: "0.05 MON" },
  { option: "0.1 MON" },
  { option: "0.1 MON" },
  { option: "0.5 MON" },
  { option: "0.5 MON" },
];

const prizes = [
  { label: "Thanks", amount: 0 },
  { label: "0.001 MON", amount: 0.001 },
  { label: "0.05 MON", amount: 0.05 },
  { label: "0.1 MON", amount: 0.1 },
  { label: "0.1 MON", amount: 0.1 },
  { label: "0.5 MON", amount: 0.5 },
  { label: "0.5 MON", amount: 0.5 },
];

function weightedRandom() {
  const weights = [40, 40, 15, 4, 1, 0, 0];
  const total = weights.reduce((a, b) => a + b, 0);
  const rand = Math.random() * total;
  let sum = 0;
  for (let i = 0; i < weights.length; i++) {
    sum += weights[i];
    if (rand < sum) return i;
  }
  return 0;
}

interface SpinWheelProps {
  address: string;
}

export default function SpinWheel({ address }: SpinWheelProps) {
  const [mustSpin, setMustSpin] = useState(false);
  const [prizeIndex, setPrizeIndex] = useState(0);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [resultMsg, setResultMsg] = useState("");
  const [spinsLeft, setSpinsLeft] = useState(5);

  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    const localKey = `spin-data-${address}`;
    const data = JSON.parse(localStorage.getItem(localKey) || "{}");

    if (data.date !== today) {
      localStorage.setItem(localKey, JSON.stringify({ date: today, count: 0 }));
      setSpinsLeft(5);
    } else {
      const count = data.count || 0;
      setSpinsLeft(Math.max(5 - count, 0));
    }
  }, [address]);

  const updateSpinCount = () => {
    const today = new Date().toISOString().split("T")[0];
    const localKey = `spin-data-${address}`;
    const data = JSON.parse(localStorage.getItem(localKey) || "{}");
    const count = (data.count || 0) + 1;
    localStorage.setItem(localKey, JSON.stringify({ date: today, count }));
    setSpinsLeft(Math.max(5 - count, 0));
  };

  const handleSpinClick = () => {
    if (mustSpin || spinsLeft <= 0) return;
    const index = weightedRandom();
    setPrizeIndex(index);
    setMustSpin(true);
  };

  const handleStopSpinning = async () => {
    const prize = prizes[prizeIndex];
    setResultMsg(prize.amount === 0 ? "😅 Thanks for playing!" : `🎉 You won ${prize.label}!`);

    if (prize.amount > 0) {
      try {
        const res = await fetch("https://code-production-05c0.up.railway.app/api/spin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ address, prize }),
        });
        const data = await res.json();
        if (res.ok && data.txHash) setTxHash(data.txHash);
      } catch (err) {
        console.error(err);
      }
    }

    updateSpinCount();
    setMustSpin(false);
  };

  return (
    <div className="flex flex-col items-center gap-4 p-6 rounded-xl shadow-lg  max-w-xl mx-auto">
      <Wheel
        mustStartSpinning={mustSpin}
        prizeNumber={prizeIndex}
        data={data}
        onStopSpinning={handleStopSpinning}
        backgroundColors={["#a855f7", "#2563eb"]}
        textColors={["#ffffff"]}
        outerBorderColor="#000"
        outerBorderWidth={4}
        radiusLineColor="#fff"
        radiusLineWidth={2}
        fontSize={16}
      />
      <div className="text-gray-800 font-medium text-sm">
        🎯 Spins left: <span className="font-bold">{spinsLeft}/5</span>
      </div>
      <button
        className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
          mustSpin || spinsLeft <= 0
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-blue-600 hover:bg-blue-700 text-white"
        }`}
        onClick={handleSpinClick}
        disabled={mustSpin || spinsLeft <= 0}
      >
        {mustSpin ? "Spinning..." : "Spin Now"}
      </button>
      {resultMsg && <div className="text-lg text-center font-semibold text-green-700">{resultMsg}</div>}
      {txHash && (
        <div className="text-sm text-center">
          ✅ Reward sent!{" "}
          <a
            className="text-blue-600 underline"
            href={`https://testnet.monadexplorer.com/tx/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            View Transaction
          </a>
        </div>
      )}
    </div>
  );
}
