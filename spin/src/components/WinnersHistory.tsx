import React, { useEffect, useState } from "react";

interface Winner {
  address: string;
  amount: number;
  txHash: string;
}

export default function WinnersHistory() {
  const [winners, setWinners] = useState<Winner[]>([]);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetch("https://code-production-05c0.up.railway.app/api/history")
      .then(res => res.json())
      .then(setWinners)
      .catch(err => console.error("Fetch failed:", err));
  }, []);

  const displayWinners = showModal ? winners.slice(0, 20) : winners.slice(0, 2);

  return (
    <div className="w-full max-w-md p-4">
      <h2 className="text-xl font-bold mb-2">🏆 Recent Winners</h2>
      <ul className="space-y-2">
        {displayWinners.length === 0 && <li>No winners yet.</li>}
        {displayWinners.map((w, idx) => (
          <li key={idx} className="bg-white p-2 rounded shadow text-sm">
            <div className="font-mono text-gray-800">{shorten(w.address)}</div>
            <div className="text-green-600 font-semibold">{w.amount} MON</div>
            <a
              href={`https://testnet.monadexplorer.com/tx/${w.txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 underline text-xs"
            >
              {shorten(w.txHash)}
            </a>
          </li>
        ))}
      </ul>
      <button
        className="mt-4 text-sm text-blue-600 underline"
        onClick={() => setShowModal(!showModal)}
      >
        {showModal ? "Hide History" : "Show Full History"}
      </button>
    </div>
  );
}

function shorten(str: string) {
  return str.slice(0, 6) + "..." + str.slice(-4);
}
