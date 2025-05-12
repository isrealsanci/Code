import React, { useRef, useState } from "react";

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
  const containerRef = useRef<HTMLDivElement>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [resultIndex, setResultIndex] = useState<number | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSpin = async () => {
    if (isSpinning || !address) return;

    setIsSpinning(true);
    setTxHash(null);
    setError(null);
    setResultIndex(null);

    const prizeIndex = weightedRandom();
    const prize = prizes[prizeIndex];
    setResultIndex(prizeIndex);

    // Scroll to the selected prize
    const itemWidth = 128; // width: w-32 (32 * 4 = 128px)
    const offset = itemWidth * prizeIndex - (containerRef.current!.offsetWidth / 2) + itemWidth / 2;

    containerRef.current?.scrollTo({
      left: offset,
      behavior: "smooth",
    });

    // Wait for scroll animation to finish (2.5 seconds)
    setTimeout(async () => {
      
      if (prize.amount !== 0) {
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
      }

      setIsSpinning(false);
    }, 5000); // Delay
  };

  return (
    <div className="flex flex-col items-center mt-6 w-full max-w-md">
      <div className="relative w-full overflow-hidden border-4 border-purple-400 rounded-lg">
        {/* Penunjuk */}
        <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-red-600 z-10" style={{ transform: "translateX(-50%)" }} />
        
        {/* Kontainer hadiah */}
        <div
          ref={containerRef}
          className="flex overflow-x-auto snap-x scroll-smooth scrollbar-hide"
          style={{ scrollBehavior: "smooth" }}
        >
          {prizes.map((prize, idx) => (
            <div
              key={idx}
              className="flex-none w-32 h-32 flex items-center justify-center text-center text-sm font-bold bg-white border-r snap-center"
            >
              {prize.label}
            </div>
          ))}
        </div>
      </div>

      <button
        className="mt-6 bg-purple-600 text-white px-6 py-2 rounded hover:bg-purple-700 disabled:opacity-50"
        onClick={handleSpin}
        disabled={isSpinning}
      >
        {isSpinning ? "Spinning..." : "Spin Now"}
      </button>

      {resultIndex !== null && (
        <div className="mt-4 text-lg">
          {prizes[resultIndex].amount === 0 ? (
            <span>😅 Thanks for playing!</span>
          ) : (
            <span>🎉 You won {prizes[resultIndex].label}!</span>
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
