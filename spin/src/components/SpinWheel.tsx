import React, { useRef, useState } from "react";
import "./SpinWheel.css";

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
  const [isSpinning, setIsSpinning] = useState(false);
  const [resultIndex, setResultIndex] = useState<number | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const wheelRef = useRef<HTMLDivElement>(null);

  const handleSpin = async () => {
    if (isSpinning || !address) return;

    setIsSpinning(true);
    setTxHash(null);
    setError(null);
    setResultIndex(null);

    const prizeIndex = weightedRandom();
    const prize = prizes[prizeIndex];
    setResultIndex(prizeIndex);

    const totalSegments = prizes.length;
    const degreesPerSegment = 360 / totalSegments;
    const extraSpins = 7; // putar beberapa kali untuk efek
    const randomOffset = Math.random() * degreesPerSegment;
    const targetAngle =
      360 * extraSpins + (360 - prizeIndex * degreesPerSegment - randomOffset);

    if (wheelRef.current) {
      wheelRef.current.style.transition = "transform 4s ease-out";
      wheelRef.current.style.transform = `rotate(${targetAngle}deg)`;
    }

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
    }, 2500); // 4 detik animasi + buffer
  };

  return (
    <div className="spin-container">
      <div className="wheel-wrapper">
        <div className="wheel-pointer" />
        <div className="wheel" ref={wheelRef}>
          {prizes.map((prize, idx) => {
            const angle = (360 / prizes.length) * idx;
            return (
              <div
                key={idx}
                className="wheel-segment"
                style={{
                  transform: `rotate(${angle}deg) skewY(-45deg)`,
                }}
              >
                <span style={{ transform: `skewY(45deg) rotate(${360 / prizes.length / 2}deg)` }}>
                  {prize.label}
                </span>
              </div>
            );
          })}
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
