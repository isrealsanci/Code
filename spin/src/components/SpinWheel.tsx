import { useState, useEffect } from "react";
import { Wheel } from "react-custom-roulette";
import { sdk } from "@farcaster/frame-sdk";
import { getMaxSpinsForAddress } from "../utils/specialSpins";

const data = [
  { option: "0.05 MON" },
  { option: "0.1 MON" },
  { option: "0.3 MON" },
  { option: "0.5 MON" },
  { option: "1 MON" },
  { option: "2 MON" },
  { option: "3 MON" },
  { option: "Thanks" },
];

const prizes = [
  { label: "0.05 MON", amount: 0.05, chain: "monad", token: "MON" },
  { label: "0.1 MON", amount: 0.1, chain: "monad", token: "MON" },
  { label: "0.3 MON", amount: 0.3, chain: "monad", token: "MON" },
  { label: "0.5 MON", amount: 0.5, chain: "monad", token: "MON" },
  { label: "1 MON", amount: 1, chain: "monad", token: "MON" },
  { label: "2 MON", amount: 2, chain: "monad", token: "MON" },
  { label: "3 MON", amount: 3, chain: "monad", token: "MON" },
  { label: "Thanks", amount: 0, chain: "none", token: null },
];

function weightedRandom() {
  const weights = [40, 13, 5, 1, 1, 0, 0, 40,];
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
  const [spinsLeft, setSpinsLeft] = useState(0);
  const [showWinModal, setShowWinModal] = useState(false);
  const [winData, setWinData] = useState<{ amount: number; label: string; txHash?: string } | null>(null);

  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    const localKey = `spin-data-${address}`;
    const localData = JSON.parse(localStorage.getItem(localKey) || "{}");
    const maxSpins = getMaxSpinsForAddress(address);
    if (localData.date !== today) {
      localStorage.setItem(localKey, JSON.stringify({ date: today, count: 0 }));
      setSpinsLeft(maxSpins);
    } else {
      const count = localData.count || 0;
      setSpinsLeft(Math.max(maxSpins - count, 0));
    }
  }, [address]);

  const updateSpinCount = () => {
    const today = new Date().toISOString().split("T")[0];
    const localKey = `spin-data-${address}`;
    const localData = JSON.parse(localStorage.getItem(localKey) || "{}");
    const count = (localData.count || 0) + 1;
    localStorage.setItem(localKey, JSON.stringify({ date: today, count }));
    const maxSpins = getMaxSpinsForAddress(address);
    setSpinsLeft(Math.max(maxSpins - count, 0));
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
        const res = await fetch(import.meta.env.VITE_API_SPIN, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ address, prize }),
        });
        const data = await res.json();
        if (res.ok && data.txHash) {
          setWinData({ amount: prize.amount, label: prize.label, txHash: data.txHash });
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
        embeds: ["https://wheel.exapp.xyz"],
      });
    } catch (error) {
      console.error("Error sharing cast:", error);
    } finally {
      setShowWinModal(false);
    }
  };

  return (
  <div
    className="
      flex flex-col items-center gap-6 p-6 
      rounded-3xl
      shadow-[6px_6px_0px_#000]
      bg-[#fff1da]
      border-4 border-black
      max-w-xl mx-auto
    "
  >
    {/* WHEEL */}
    <Wheel
      mustStartSpinning={mustSpin}
      prizeNumber={prizeIndex}
      data={data}
      onStopSpinning={handleStopSpinning}
      backgroundColors={[
        "#ffb6c1", "#87cefa", "#ffdd57", "#a3e635",
        "#ffd1dc", "#b5e8f7", "#ffe680", "#c4f0c2"
      ]}
      textColors={["#000"]}
      outerBorderColor="#000"
      outerBorderWidth={6}
      radiusLineColor="#000"
      radiusLineWidth={3}
      fontSize={18}
    />

    {/* Spins Counter */}
    <div
      className="
        bg-[#ffeb99]
        border-4 border-black
        rounded-2xl
        p-4
        w-full max-w-xs
        shadow-[4px_4px_0px_#000]
        flex flex-col items-center gap-2
        text-center
      "
    >
      <div className="text-black font-bold text-lg">
        🎯 Spins left: <span className="font-extrabold">{spinsLeft}</span>
      </div>

      {/* Spin Button */}
      <button
        className={`
          w-full px-6 py-3 rounded-2xl border-4 border-black
          shadow-[4px_4px_0px_#000]
          font-bold text-lg
          transition-transform active:translate-y-1
          ${
            mustSpin || spinsLeft <= 0
              ? "bg-gray-300 cursor-not-allowed"
              : "bg-[#ff9ecb] hover:bg-[#ff84c2]"
          }
        `}
        onClick={handleSpinClick}
        disabled={mustSpin || spinsLeft <= 0}
      >
        {mustSpin ? "🎡 Spinning..." : "✨ Spin Now!"}
      </button>
    </div>

    {/* WIN MODAL */}
    {showWinModal && winData && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div
          className="
            bg-[#fff5d7]
            border-4 border-black
            shadow-[6px_6px_0px_#000]
            rounded-3xl
            p-6
            max-w-sm w-full
            relative
          "
        >
          <button
            onClick={() => setShowWinModal(false)}
            className="absolute top-2 right-2 text-black font-bold text-xl"
          >
            ✖
          </button>

          <h2 className="text-2xl font-extrabold mb-2">🎉 You Won!</h2>
          <p className="text-xl mb-4 font-bold">{winData.label}</p>

          {winData.txHash && (
            <div className="mb-4 bg-white border-4 border-black p-3 rounded-xl shadow-[3px_3px_0px_#000]">
              <p className="text-sm font-bold mb-1">Transaction:</p>
              <a
                href={`https://testnet.monadexplorer.com/tx/${winData.txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-700 underline text-sm break-all"
              >
                {winData.txHash.slice(0, 12)}...{winData.txHash.slice(-6)}
              </a>
            </div>
          )}

          <button
            onClick={handleShareCast}
            className="
              w-full bg-[#a78bfa] text-white px-4 py-3 
              rounded-2xl border-4 border-black
              shadow-[4px_4px_0px_#000]
              hover:bg-[#8b6cf8]
              font-bold text-lg
              flex items-center justify-center gap-2
            "
          >
            📣 Share on Farcaster
          </button>
        </div>
      </div>
    )}
  </div>
);
}