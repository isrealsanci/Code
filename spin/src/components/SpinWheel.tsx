import React, { useRef, useState } from "react";
import "./SpinWheel.css";

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
  const weights = [40, 40, 10, 5, 3, 1.5, 0.5];
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

    const itemWidth = 128;
    const containerWidth = containerRef.current?.offsetWidth || 0;
    const baseScroll = itemWidth * prizeIndex - containerWidth / 2 + itemWidth / 2;

    // Tambahkan spin palsu
    const fakeRounds = 5;
    const totalItems = prizes.length;
    const scrollDistance = itemWidth * totalItems * fakeRounds + baseScroll;

    containerRef.current?.scrollTo({
      left: scrollDistance,
      behavior: "smooth",
    });

    setTimeout(async () => {
      setResultIndex(prizeIndex);

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
    }, 3000); // Tampilkan hasil setelah animasi
  };

  return (
    <div className={`spin-container ${isSpinning ? "spinning" : ""}`}>
      <div className="spin-box">
        <div className="spin-pointer" />
        <div ref={containerRef} className="spin-carousel">
          {prizes.map((prize, idx) => (
            <div key={idx} className="spin-item">
              {prize.label}
            </div>
          ))}
        </div>
      </div>

      <button className="spin-button" onClick={handleSpin} disabled={isSpinning}>
        {isSpinning ? "Spinning..." : "Spin Now"}
      </button>

      {resultIndex !== null && (
        <div className="spin-message">
          {prizes[resultIndex].amount === 0 ? (
            <span>😅 Thanks for playing!</span>
          ) : (
            <span>🎉 You won {prizes[resultIndex].label}!</span>
          )}
        </div>
      )}

      {txHash && (
        <div className="spin-success">
          ✅ Reward sent!{" "}
          <a
            href={`https://testnet.monadexplorer.com/tx/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            View Transaction
          </a>
        </div>
      )}

      {error && <div className="spin-error">❌ {error}</div>}
    </div>
  );
}
