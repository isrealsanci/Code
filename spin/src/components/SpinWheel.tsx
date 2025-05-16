// SpinWheel.tsx (Updated for Multi-Chain Rewards)
import React, { useState, useEffect } from "react";
import { Wheel } from "react-custom-roulette";
import { sdk } from "@farcaster/frame-sdk";

const data = [
  { option: "$0.01 ETH" },
  { option: "$0.05 ETH" },
  { option: "$0.1 ETH" },
  { option: "$0.5 ETH" },
  { option: "0.001 CELO" },
  { option: "0.01 CELO" },
  { option: "0.05 CELO" },
  { option: "0.1 CELO" },
  { option: "0.001 MON" },
  { option: "0.01 MON" },
  { option: "0.05 MON" },
  { option: "0.1 MON" },
  { option: "Thanks" },
];

const prizes = [
  { label: "$0.01 ETH", amount: 0.000005, chain: "base", token: "ETH" },
  { label: "$0.05 ETH", amount: 0.00002, chain: "base", token: "ETH" },
  { label: "$0.1 ETH", amount: 0.00004, chain: "base", token: "ETH" },
  { label: "$0.5 ETH", amount: 0.0002, chain: "base", token: "ETH" },
  { label: "0.001 CELO", amount: 0.001, chain: "celo", token: "CELO" },
  { label: "0.01 CELO", amount: 0.01, chain: "celo", token: "CELO" },
  { label: "0.05 CELO", amount: 0.05, chain: "celo", token: "CELO" },
  { label: "0.1 CELO", amount: 0.1, chain: "celo", token: "CELO" },
  { label: "0.001 MON", amount: 0.001, chain: "monad", token: "MON" },
  { label: "0.01 MON", amount: 0.01, chain: "monad", token: "MON" },
  { label: "0.05 MON", amount: 0.05, chain: "monad", token: "MON" },
  { label: "0.1 MON", amount: 0.1, chain: "monad", token: "MON" },
  { label: "Thanks", amount: 0, chain: "none", token: null },
];

function weightedRandom() {
  const weights = [5, 2, 1, 0, 15, 3, 1, 0, 25, 18, 4, 1, 25];
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
  onSpinSuccess?: () => void;
}

export default function SpinWheel({ address, onSpinSuccess }: SpinWheelProps) {
  const [mustSpin, setMustSpin] = useState(false);
  const [prizeIndex, setPrizeIndex] = useState(0);
  const [spinsLeft, setSpinsLeft] = useState(3);
  const [showWinModal, setShowWinModal] = useState(false);
  const [winData, setWinData] = useState<{
    amount: number;
    label: string;
    txHash?: string;
  } | null>(null);

  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    const localKey = `spin-data-${address}`;
    const data = JSON.parse(localStorage.getItem(localKey) || "{}");

    if (data.date !== today) {
      localStorage.setItem(localKey, JSON.stringify({ date: today, count: 0 }));
      setSpinsLeft(3);
    } else {
      const count = data.count || 0;
      setSpinsLeft(Math.max(3 - count, 0));
    }
  }, [address]);

  const updateSpinCount = () => {
    const today = new Date().toISOString().split("T")[0];
    const localKey = `spin-data-${address}`;
    const data = JSON.parse(localStorage.getItem(localKey) || "{}");
    const count = (data.count || 0) + 1;
    localStorage.setItem(localKey, JSON.stringify({ date: today, count }));
    setSpinsLeft(Math.max(3 - count, 0));
  };

  const handleSpinClick = () => {
    if (mustSpin || spinsLeft <= 0) return;
    const index = weightedRandom();
    setPrizeIndex(index);
    setMustSpin(true);
  };

  const handleStopSpinning = async () => {
    const prize = prizes[prizeIndex];
    updateSpinCount();
    setMustSpin(false);

    if (prize.amount > 0) {
      try {
        const res = await fetch("https://code-production-05c0.up.railway.app/api/spin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ address, prize }),
        });
        const data = await res.json();
        if (res.ok && data.txHash) {
          setWinData({
            amount: prize.amount,
            label: prize.label,
            txHash: data.txHash,
          });
          setShowWinModal(true);
          if (onSpinSuccess) onSpinSuccess();
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleShareCast = async () => {
    if (!winData) return;
    try {
      await sdk.actions.composeCast({
        text: `I just won ${winData.label} on Spin Wheel!`,
        embeds: ["https://monad-wheel.vercel.app"],
      });
    } catch (error) {
      console.error("Error sharing cast:", error);
    } finally {
      setShowWinModal(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 p-6 rounded-xl shadow-lg max-w-xl mx-auto">
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

      <div className="bg-gray-200 rounded-lg p-4 w-full max-w-xs flex flex-col items-center gap-3">
        <div className="text-black font-medium text-sm">
          🎯 Spins left: <span className="font-medium">{spinsLeft}/3</span>
        </div>
        <button
          className={`w-full px-6 py-2 rounded-lg font-semibold transition-colors ${
            mustSpin || spinsLeft <= 0
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700 text-white"
          }`}
          onClick={handleSpinClick}
          disabled={mustSpin || spinsLeft <= 0}
        >
          {mustSpin ? "Spinning..." : "Spin Now"}
        </button>
      </div>

      {showWinModal && winData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-200 bg-opacity-50 backdrop-blur-sm p-6 rounded-lg max-w-sm w-full relative">
            <button
              onClick={() => setShowWinModal(false)}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
            >
              ✖
            </button>
            <h2 className="text-xl font-bold mb-2">🎉 You won!</h2>
            <p className="text-lg mb-4">{winData.label}</p>
            {winData.txHash && (
              <div className="mb-4">
                <p className="text-sm mb-1">Transaction:</p>
                <a
                  href={`https://testnet.monadexplorer.com/tx/${winData.txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline text-sm break-all"
                >
                  {winData.txHash.slice(0, 12)}...{winData.txHash.slice(-6)}
                </a>
              </div>
            )}
            <button
              onClick={handleShareCast}
              className="w-full bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 flex items-center justify-center gap-2"
            >
              Share on Farcaster
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
