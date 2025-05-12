import React, { useEffect, useState } from "react";

interface Winner {
  address: string;
  username?: string;
  amount: number;
  timestamp: string;
}

export default function WinnersHistory() {
  const [winners, setWinners] = useState<Winner[]>([]);

  useEffect(() => {
    fetchHistory();

    // Optional: auto refresh setiap 30 detik
    const interval = setInterval(fetchHistory, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await fetch("/api/history");
      const data = await res.json();
      setWinners(data);
    } catch (err) {
      console.error("Gagal fetch history:", err);
    }
  };

  return (
    <div className="mt-10 w-full max-w-md">
      <h2 className="text-xl font-bold mb-4">🏆 Recent Winners</h2>
      <ul className="space-y-2">
        {winners.length === 0 && <li>No winners yet.</li>}
        {winners.map((winner, idx) => (
          <li
            key={idx}
            className="bg-white p-3 rounded shadow flex justify-between items-center text-sm"
          >
            <div>
              <span className="font-semibold">
                {winner.username || shortenAddress(winner.address)}
              </span>
              <div className="text-xs text-gray-500">{new Date(winner.timestamp).toLocaleString()}</div>
            </div>
            <div className="text-green-600 font-bold">{winner.amount} MON</div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function shortenAddress(addr: string) {
  return addr.slice(0, 6) + "..." + addr.slice(-4);
}
