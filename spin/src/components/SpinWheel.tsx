// SpinWheel.tsx (Updated with Buy Spin functionality)
import React, { useState, useEffect } from "react";
import { Wheel } from "react-custom-roulette";
import { sdk } from "@farcaster/frame-sdk";
import { useAccount, useSendTransaction } from "wagmi";
import { parseEther } from "viem";

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
  const weights = [5, 1, 0, 0, 15, 5, 1, 0, 25, 18, 4, 1, 25];
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

const DONATE_ADDRESS = "0x893E76AB37Be1b3e26732fE9cede1f0015599B47";

export default function SpinWheel({ address, onSpinSuccess }: SpinWheelProps) {
  const { sendTransaction, isPending } = useSendTransaction();
  const { isConnected } = useAccount();
  const [mustSpin, setMustSpin] = useState(false);
  const [prizeIndex, setPrizeIndex] = useState(0);
  const [spinsLeft, setSpinsLeft] = useState(3);
  const [showWinModal, setShowWinModal] = useState(false);
  const [winData, setWinData] = useState<{
    amount: number;
    label: string;
    txHash?: string;
  } | null>(null);
  const [showBuySpinModal, setShowBuySpinModal] = useState(false);
  const [buySpinTxHash, setBuySpinTxHash] = useState("");

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

  const updateSpinCount = (additionalSpins = 0) => {
    const today = new Date().toISOString().split("T")[0];
    const localKey = `spin-data-${address}`;
    const data = JSON.parse(localStorage.getItem(localKey) || "{}");
    const count = (data.count || 0) + additionalSpins;
    localStorage.setItem(localKey, JSON.stringify({ date: today, count }));
    setSpinsLeft(Math.max(3 - count, 0));
  };

  const handleSpinClick = () => {
    if (mustSpin || spinsLeft <= 0) return;
    const index = weightedRandom();
    setPrizeIndex(index);
    setMustSpin(true);
  };

  const handleBuySpin = async () => {
    if (!isConnected) return;
    
    sendTransaction({
      to: DONATE_ADDRESS,
      value: parseEther("0.00004"),
    }, {
      onSuccess: (hash) => {
        setBuySpinTxHash(hash);
        // Wait for transaction to be mined
        const checkConfirmation = setInterval(async () => {
          try {
            const receipt = await fetch(`https://api.basescan.org/api?module=transaction&action=gettxreceiptstatus&txhash=${hash}&apikey=${import.meta.env.VITE_BASESCAN_API}`);
            const data = await receipt.json();
            if (data.result?.status === "1") {
              clearInterval(checkConfirmation);
              updateSpinCount(-2); // Add 2 spins (since count is subtracted from 3)
              setShowBuySpinModal(false);
            }
          } catch (error) {
            console.error("Error checking transaction:", error);
          }
        }, 5000);
      },
      onError: (error) => {
        console.error("Transaction failed:", error);
      }
    });
  };

  const handleStopSpinning = async () => {
    const prize = prizes[prizeIndex];
    updateSpinCount();
    setMustSpin(false);

    if (prize.amount > 0) {
      try {
        const res = await fetch(import.meta.env.VITE_API_SPIN, {
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
        
        {spinsLeft <= 0 && (
          <button
            className="w-full px-6 py-2 rounded-lg font-semibold bg-green-600 hover:bg-green-700 text-white transition-colors"
            onClick={() => setShowBuySpinModal(true)}
          >
            Buy Spin 
          </button>
        )}
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

      {showBuySpinModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-200 bg-opacity-50 backdrop-blur-sm p-6 rounded-lg max-w-sm w-full relative">
            <button
              onClick={() => setShowBuySpinModal(false)}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
            >
              ✖
            </button>
            <h2 className="text-xl font-bold mb-2">Buy Additional Spins</h2>
            <p className="text-lg mb-4">Pay 0.00004 ETH to get 2 additional spins</p>
            
            {isPending ? (
              <div className="flex items-center justify-center gap-2">
                <svg
                  className="animate-spin h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Waiting for transaction...
              </div>
            ) : (
              <button
                onClick={handleBuySpin}
                className="w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              >
                Confirm Payment
              </button>
            )}

            {buySpinTxHash && (
              <div className="mt-4">
                <p className="text-sm mb-1">Transaction:</p>
                <a
                  href={`https://basescan.org/tx/${buySpinTxHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline text-sm break-all"
                >
                  {buySpinTxHash.slice(0, 12)}...{buySpinTxHash.slice(-6)}
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}