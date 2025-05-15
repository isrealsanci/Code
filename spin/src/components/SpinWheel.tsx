import React, { useState, useEffect } from "react";
import { Wheel } from "react-custom-roulette";
import { sdk } from "@farcaster/frame-sdk";

const data = [
  { option: "Thanks", style: { backgroundColor: "#ddd" } },
  { option: "0.001 MON" },
  { option: "0.05 MON" },
  { option: "0.1 MON" },
  { option: "0.5 MON" },
  { option: "1 MON" },
  { option: "3 MON" },
];

const prizes = [
  { label: "Thanks", amount: 0 },
  { label: "0.001 MON", amount: 0.001 },
  { label: "0.05 MON", amount: 0.05 },
  { label: "0.1 MON", amount: 0.1 },
  { label: "0.5 MON", amount: 0.5 },
  { label: "1 MON", amount: 1 },
  { label: "3 MON", amount: 3 },
];

function weightedRandom() {
  const weights = [40, 39, 20, 1, 0, 0, 0];
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
  const [spinsLeft, setSpinsLeft] = useState(3);
  const [lastSpinTime, setLastSpinTime] = useState<number | null>(null);
  const [showWinModal, setShowWinModal] = useState(false);
  const [winData, setWinData] = useState<{
    amount: number;
    label: string;
    txHash?: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkSpinLimit = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(
          `https://code-production-05c0.up.railway.app/api/spin-status?address=${address}`
        );
        
        if (!response.ok) {
          throw new Error("Failed to fetch spin status");
        }

        const data = await response.json();
        setSpinsLeft(data.spinsLeft);
        setLastSpinTime(data.lastSpinTime);
        setError(null);
      } catch (err) {
        console.error("Error checking spin status:", err);
        setError("Failed to load spin information. Please try again.");
        // Default to 0 spins if there's an error to prevent abuse
        setSpinsLeft(0);
      } finally {
        setIsLoading(false);
      }
    };

    checkSpinLimit();
  }, [address]);

  const handleSpinClick = () => {
    if (mustSpin || spinsLeft <= 0) return;
    const index = weightedRandom();
    setPrizeIndex(index);
    setMustSpin(true);
  };

  const handleStopSpinning = async () => {
    const prize = prizes[prizeIndex];
    setMustSpin(false);

    if (prize.amount > 0) {
      try {
        setIsLoading(true);
        const res = await fetch(
          "https://code-production-05c0.up.railway.app/api/spin",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ address, prize }),
          }
        );

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || "Failed to process spin");
        }

        const data = await res.json();
        setWinData({
          amount: prize.amount,
          label: prize.label,
          txHash: data.txHash,
        });
        setShowWinModal(true);
        setSpinsLeft(data.spinsLeft);
        setLastSpinTime(data.lastSpinTime);
        setError(null);
      } catch (err) {
        console.error("Spin error:", err);
        setError(err instanceof Error ? err.message : "Failed to process spin");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleShareCast = async () => {
    if (!winData) return;
    try {
      await sdk.actions.composeCast({
        text: `I just won ${winData.amount} $MON on Spin Wheel!`,
        embeds: ["https://monad-wheel.vercel.app"],
      });
    } catch (error) {
      console.error("Error sharing cast:", error);
      setError("Failed to share on Farcaster");
    } finally {
      setShowWinModal(false);
    }
  };

  const formatTimeLeft = () => {
    if (!lastSpinTime || spinsLeft > 0) return null;
    
    const now = Date.now();
    const nextSpinTime = lastSpinTime + 24 * 60 * 60 * 1000;
    const timeLeftMs = nextSpinTime - now;
    
    if (timeLeftMs <= 0) return "Spins reset now! Refresh the page.";
    
    const hours = Math.floor(timeLeftMs / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeftMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return `Next spin available in ${hours}h ${minutes}m`;
  };

  return (
    <div className="flex flex-col items-center gap-4 p-6 rounded-xl shadow-lg max-w-xl mx-auto">
      {isLoading && (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {!isLoading && (
        <>
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
              🎯 Spins left: <span className="font-bold">{spinsLeft}/3</span>
            </div>
            {formatTimeLeft() && (
              <div className="text-sm text-gray-600">{formatTimeLeft()}</div>
            )}
            <button
              className={`w-full px-6 py-2 rounded-lg font-semibold transition-colors ${
                mustSpin || spinsLeft <= 0 || isLoading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 text-white"
              }`}
              onClick={handleSpinClick}
              disabled={mustSpin || spinsLeft <= 0 || isLoading}
            >
              {mustSpin ? "Spinning..." : "Spin Now"}
            </button>
          </div>
        </>
      )}

      {showWinModal && winData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-200 bg-opacity-50 backdrop-blur-sm p-6 rounded-lg max-w-sm w-full relative">
            <button
              onClick={() => setShowWinModal(false)}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
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
              disabled={isLoading}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
              </svg>
              {isLoading ? "Sharing..." : "Share on Farcaster"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}