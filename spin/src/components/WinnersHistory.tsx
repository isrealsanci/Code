import React, { useEffect, useState } from "react";

interface Winner {
  address: string;
  amount: number;
  txHash: string;
  pfp?: string;
  username?: string;
  displayName?: string;
}

export default function WinnersHistory() {
  const [winners, setWinners] = useState<Winner[]>([]);
  const [showAll, setShowAll] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWinners = async () => {
      try {
        const res = await fetch("https://code-production-05c0.up.railway.app/api/enriched-history");
        const data = await res.json();
        setWinners(data);
      } catch (err) {
        console.error("Failed to load enriched data, falling back to basic history");
        const basicRes = await fetch("https://code-production-05c0.up.railway.app/api/history");
        const basicData = await basicRes.json();
        setWinners(basicData);
      } finally {
        setLoading(false);
      }
    };

    fetchWinners();
  }, []);

  const displayedWinners = showAll ? winners : winners.slice(0, 3);

  return (
    <div className="w-full max-w-md">
      <div className="bg-gray-200 bg-opacity-50 backdrop-blur-sm rounded-lg p-4">
        <h2 className="text-lg font-bold mb-3 text-center">🏆 Recent Winners</h2>
        
        {loading ? (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          </div>
        ) : winners.length === 0 ? (
          <div className="text-center py-2 text-gray-600">No winners yet</div>
        ) : (
          <div className={`space-y-3 ${showAll ? 'max-h-96 overflow-y-auto pr-2' : ''}`}>
            {displayedWinners.map((winner, idx) => (
              <div key={idx} className="bg-white bg-opacity-80 p-3 rounded-lg shadow-sm flex items-center gap-3">
                {/* PFP */}
                <div className="flex-shrink-0">
                  {winner.pfp ? (
                    <img 
                      src={winner.pfp} 
                      alt="Profile"
                      className="w-10 h-10 rounded-full object-cover border border-gray-200"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/default-pfp.png';
                      }}
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
                      <span className="text-xs">?</span>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline">
                    <div className="truncate">
                      <p className="font-medium text-gray-900 truncate">
                        {winner.displayName || winner.username || shorten(winner.address)}
                      </p>
                      {winner.username && (
                        <p className="text-xs text-gray-500 truncate">@{winner.username}</p>
                      )}
                    </div>
                    <span className="text-green-600 font-semibold whitespace-nowrap ml-2">
                      {winner.amount} MON
                    </span>
                  </div>

                  {/* Transaction */}
                  <a
                    href={`https://testnet.monadexplorer.com/tx/${winner.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-500 hover:underline flex items-center mt-1"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    {shorten(winner.txHash)}
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}

        {winners.length > 3 && (
          <button
            className="mt-3 w-full py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
            onClick={() => setShowAll(!showAll)}
          >
            {showAll ? "▲ Show Less" : `▼ Show More (${winners.length - 3} more)`}
          </button>
        )}
      </div>
    </div>
  );
}

function shorten(str: string) {
  if (!str) return "";
  return str.length > 10 ? str.slice(0, 6) + "..." + str.slice(-4) : str;
}