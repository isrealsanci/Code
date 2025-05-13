import React, { useEffect, useRef, useState } from "react";
import "./SpinWheel.css";
import { sdk } from "@farcaster/frame-sdk";

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
  const [showModal, setShowModal] = useState(false);
  const [spinCount, setSpinCount] = useState(0);
  const [canSpin, setCanSpin] = useState(true);
  const wheelRef = useRef<HTMLDivElement>(null);

  const SPIN_LIMIT = 5;

  // Reset logic per hari
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    const localKey = `spin-data-${address}`;
    const data = JSON.parse(localStorage.getItem(localKey) || "{}");

    if (data.date !== today) {
      localStorage.setItem(
        localKey,
        JSON.stringify({ date: today, count: 0 })
      );
      setSpinCount(0);
      setCanSpin(true);
    } else {
      setSpinCount(data.count || 0);
      setCanSpin((data.count || 0) < SPIN_LIMIT);
    }
  }, [address]);

  const updateSpinCount = () => {
    const localKey = `spin-data-${address}`;
    const data = JSON.parse(localStorage.getItem(localKey) || "{}");
    const newCount = (data.count || 0) + 1;
    localStorage.setItem(
      localKey,
      JSON.stringify({ date: data.date, count: newCount })
    );
    setSpinCount(newCount);
    if (newCount >= SPIN_LIMIT) setCanSpin(false);
  };

  const handleSpin = async () => {
    if (isSpinning || !address || !canSpin) return;

    setIsSpinning(true);
    setTxHash(null);
    setError(null);
    setResultIndex(null);

    const prizeIndex = weightedRandom();
    const prize = prizes[prizeIndex];
    setResultIndex(prizeIndex);

    const totalSegments = prizes.length;
    const degreesPerSegment = 360 / totalSegments;
    const extraSpins = 7;
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
          const res = await fetch(
            "https://code-production-05c0.up.railway.app/api/spin",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ address, prize }),
            }
          );

          const data = await res.json();
          if (res.ok && data.txHash) {
            setTxHash(data.txHash);
            setShowModal(true); 
          } else {
            setError(data.error || "Spin failed.");
          }
        } catch (err) {
          console.error(err);
          setError("Server error. Try again.");
        }
      }

      updateSpinCount();
      setIsSpinning(false);
    }, 10000);
  };

  const handleShareCast = async () => {
    try {
      await sdk.actions.composeCast({
        text: "I just claimed free $MON from @return",
        embeds: ["https://monad-wheel.vercel.app"],
      });
    } catch (err) {
      console.error("Failed to share cast:", err);
    } finally {
      setShowModal(false); 
    }
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
                <span
                  style={{
                    transform: `skewY(45deg) rotate(${360 / prizes.length / 2}deg)`,
                  }}
                >
                  {prize.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <button
        className="spin-button"
        onClick={handleSpin}
        disabled={isSpinning || !canSpin}
      >
        {isSpinning
          ? "Spinning..."
          : !canSpin
          ? "Wait until tomorrow"
          : "Spin Now"}
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

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>🎉 You won a reward!</h2>
            <p>Share your luck with your friends?</p>
            <button onClick={handleShareCast}>Share</button>
          </div>
        </div>
      )}
    </div>
  );
}
