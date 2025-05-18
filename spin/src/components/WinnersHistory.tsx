// WinnersHistory.tsx (updated with dynamic explorer link by chain)
import { useState, useEffect, useRef } from "react";

interface Winner {
  address: string;
  amount: number;
  txHash: string;
  chain?: string;
  token?: string | null;
  pfp?: string;
  username?: string;
  displayName?: string;
}

interface WinnersHistoryProps {
  refreshTrigger: number;
}

export default function WinnersHistory({ refreshTrigger }: WinnersHistoryProps) {
  const [winners, setWinners] = useState<Winner[]>([]);
  const [visibleCount, setVisibleCount] = useState(2);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const MAX_WINNERS = 6;
  const hasFetchedRef = useRef(false);

  useEffect(() => {
    if (hasFetchedRef.current && refreshTrigger === 0) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch( import.meta.env.VITE_API_ENRICHED,);
        if (!response.ok) throw new Error("Failed to fetch data");

        const data = await response.json();
        setWinners(data);
        setVisibleCount(2);
        hasFetchedRef.current = true;
      } catch (err) {
        console.error("Fetch error:", err);
        setError("Failed to load winners. Please try again.");

        try {
          const basicResponse = await fetch(import.meta.env.VITE_API_HISTORY,);
          const basicData = await basicResponse.json();
          setWinners(basicData);
          setVisibleCount(2);
        } catch (fallbackError) {
          console.error("Fallback failed:", fallbackError);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [refreshTrigger]);

  const totalWinners = winners.length;
  const winnersToShow = winners.slice(0, Math.min(visibleCount, MAX_WINNERS));
  const canShowMore = visibleCount < Math.min(totalWinners, MAX_WINNERS);

  const handleToggleShowMore = () => {
    if (canShowMore) {
      setVisibleCount((prev) => Math.min(prev + 3, MAX_WINNERS, totalWinners));
    } else {
      setVisibleCount(2);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        {error}
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-gray-200 bg-opacity-50 backdrop-blur-sm rounded-lg p-4">
        <h2 className="text-lg font-bold mb-4 text-center">🏆 Recent Winners</h2>

        {totalWinners === 0 ? (
          <p className="text-center text-gray-600">No winners yet</p>
        ) : (
          <>
            <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
              {winnersToShow.map((winner, index) => (
                <WinnerCard key={index} winner={winner} />
              ))}
            </div>

            {totalWinners > 2 && (
              <button
                onClick={handleToggleShowMore}
                className="mt-3 w-full py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
              >
                {canShowMore
                  ? `▼ Show More (${Math.min(totalWinners - visibleCount, 3)} more)`
                  : "▲ Show Less"}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

const WinnerCard = ({ winner }: { winner: Winner }) => {
  const displayName = winner.displayName || winner.username || shortenAddress(winner.address);
  const tokenSymbol = winner.token || "MON";

  return (
    <div className="bg-white bg-opacity-80 p-3 rounded-lg shadow-sm flex items-center gap-3">
      <div className="flex-shrink-0">
        {winner.pfp ? (
          <img
            src={winner.pfp}
            alt="Profile"
            className="w-10 h-10 rounded-full object-cover border border-gray-200"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "/default-pfp.png";
            }}
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
            <span className="text-xs">?</span>
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-baseline">
          <div className="truncate">
            <p className="font-medium text-gray-900 truncate">{displayName}</p>
            {winner.username && <p className="text-xs text-gray-500 truncate">@{winner.username}</p>}
          </div>
          <span className="text-green-600 font-semibold whitespace-nowrap ml-2">
            {winner.amount} {tokenSymbol}
          </span>
        </div>

        <TransactionLink txHash={winner.txHash} chain={winner.chain} />
      </div>
    </div>
  );
};

const TransactionLink = ({ txHash, chain }: { txHash: string; chain?: string }) => {
  const getExplorer = (chain: string | undefined) => {
    switch (chain) {
      case "monad":
        return `https://testnet.monadexplorer.com/tx/${txHash}`;
      case "celo":
        return `https://celoscan.io/tx/${txHash}`;
      case "base":
        return `https://basescan.org/tx/${txHash}`;
      default:
        return `https://testnet.monadexplorer.com/tx/${txHash}`;
    }
  };

  return (
    <a
      href={getExplorer(chain)}
      target="_blank"
      rel="noopener noreferrer"
      className="text-xs text-blue-500 hover:underline flex items-center mt-1"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-3 w-3 mr-1"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
      </svg>
      {shortenHash(txHash)}
    </a>
  );
};

function shortenAddress(address: string) {
  return address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "";
}

function shortenHash(hash: string) {
  return hash ? `${hash.slice(0, 6)}...${hash.slice(-4)}` : "";
}
