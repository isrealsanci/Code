import React, { useState } from "react";

const prizes = [
  { label: "Thanks", amount: 0 },
  { label: "0.001 MON", amount: 0.001 },
  { label: "0.05 MON", amount: 0.05 },
  { label: "0.1 MON", amount: 0.1 },
  { label: "1 MON", amount: 1 },
  { label: "2.5 MON", amount: 2.5 },
  { label: "5 MON", amount: 5 },
];

function weightedRandom() {
  const weights = [35, 25, 15, 10, 8, 5, 2];
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
  const [isSpinning, setIsSpinning] = useState(false);
  const [result, setResult] = useState<null | typeof prizes[0]>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSpin = async () => {
    if (isSpinning || !address) return;

    setIsSpinning(true);
    setResult(null);
    setTxHash(null);
    setError(null);

    setTimeout(async () => {
      const prizeIndex = weightedRandom();
      const prize = prizes[prizeIndex];
      setResult(prize);

      try {
        const res = await fetch("https://code-production-05c0.up.railway.app/api/spin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ address, prize }),
        });

        const data = await res.json();
        if (res.ok && data.txHash) {
          setTxHash(data.txHash);
        } else {
          setError(data.error || "Spin failed.");
        }
      } catch (err) {
        console.error(err);
        setError("Server error. Try again.");
      }

      setIsSpinning(false);
    }, 2000);
  };

  return (
    <div className="flex flex-col items-center mt-6">
      <div
        className={`w-48 h-48 rounded-full border-8 border-purple-400 flex items-center justify-center text-xl font-bold transition-transform duration-1000 ${
          isSpinning ? "rotate-[1440deg]" : ""
        }`}
      >
        🎡
      </div>

      <button
        className="mt-6 bg-purple-600 text-white px-6 py-2 rounded hover:bg-purple-700 disabled:opacity-50"
        onClick={handleSpin}
        disabled={isSpinning || !address}
      >
        {isSpinning ? "Spinning..." : "Spin Now"}
      </button>

      {result && (
        <div className="mt-4 text-lg">
          {result.amount === 0 ? (
            <span>😅 Thanks for playing!</span>
          ) : (
            <span>🎉 You won {result.label}!</span>
          )}
        </div>
      )}

      {txHash && (
        <div className="mt-2 text-sm text-green-500">
          ✅ Reward sent!{" "}
          <a
            href={`https://explorer.monad.xyz/tx/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            View Transaction
          </a>
        </div>
      )}

      {error && <div className="mt-2 text-sm text-red-500">❌ {error}</div>}
    </div>
  );
}
