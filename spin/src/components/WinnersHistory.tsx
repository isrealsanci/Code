import React, { useEffect, useState } from "react";

interface Winner {
  address: string;
  amount: number;
  txHash: string;
}

export default function WinnersHistory() {
  const [winners, setWinners] = useState<Winner[]>([]);
  const [showAll, setShowAll] = useState(false);
  const [displayCount, setDisplayCount] = useState(5);

  useEffect(() => {
    fetch("https://code-production-05c0.up.railway.app/api/history")
      .then(res => res.json())
      .then(setWinners)
      .catch(err => console.error("Fetch failed:", err));
  }, []);

  const displayedWinners = showAll ? winners : winners.slice(0, 2);

  return (
    <div className="w-full max-w-md">
      {/* Card Container */}
      <div className="bg-gray-200 bg-opacity-50 backdrop-blur-sm rounded-lg p-4">
        <h2 className="text-lg font-bold mb-3 text-center">🏆 Recent Winners</h2>
        
        {winners.length === 0 ? (
          <div className="text-center py-2 text-gray-600">No winners yet</div>
        ) : (
          <div className={`space-y-3 ${showAll ? 'max-h-64 overflow-y-auto pr-2' : ''}`}>
            {displayedWinners.map((w, idx) => (
              <div key={idx} className="bg-white bg-opacity-80 p-3 rounded-lg shadow-sm">
                <div className="flex justify-between items-center">
                  <span className="font-mono text-sm text-gray-800">
                    {shorten(w.address)}
                  </span>
                  <span className="text-green-600 font-semibold">
                    {w.amount} MON
                  </span>
                </div>
                <a
                  href={`https://testnet.monadexplorer.com/tx/${w.txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-500 hover:underline block mt-1 truncate"
                >
                  {shorten(w.txHash)}
                </a>
              </div>
            ))}
          </div>
        )}

        {winners.length > 2 && (
          <button
            className="mt-3 w-full py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
            onClick={() => setShowAll(!showAll)}
          >
            {showAll ? "▲ Show Less" : "▼ Show More"}
          </button>
        )}
      </div>
    </div>
  );
}

function shorten(str: string) {
  return str.slice(0, 6) + "..." + str.slice(-4);
}