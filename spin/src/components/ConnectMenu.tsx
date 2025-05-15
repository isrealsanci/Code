// ConnectMenu.tsx
import { useState, useEffect } from "react";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import SpinWheel from "./SpinWheel";
import WinnersHistory from "./WinnersHistory";
import { sdk } from "@farcaster/frame-sdk";

export default function ConnectMenu() {
  const { isConnected, address } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();

  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const [menuOpen, setMenuOpen] = useState(false);
  const [frameAdded, setFrameAdded] = useState(() => {
    return localStorage.getItem("frameAdded") === "true";
  });
  const [isAddingFrame, setIsAddingFrame] = useState(false);

  const shortAddress = (addr: string) => addr.slice(0, 6) + "..." + addr.slice(-4);

  const handleAddFrame = async () => {
    setIsAddingFrame(true);
    try {
      await sdk.actions.addFrame();
      localStorage.setItem("frameAdded", "true");
      setFrameAdded(true);
    } catch (error) {
      console.error("Error adding frame:", error);
    } finally {
      setIsAddingFrame(false);
    }
  };

  useEffect(() => {
    if (!isConnected) {
      localStorage.removeItem("frameAdded");
      setFrameAdded(false);
    }
  }, [isConnected]);

  if (!connectors.length) return <p>No wallet connectors found.</p>;

  if (isConnected && address) {
    return (
      <div className="relative w-full max-w-md flex flex-col items-center gap-4">
        <div className="relative">
          <button
            onClick={() => setMenuOpen((prev) => !prev)}
            className="bg-white px-4 py-2 rounded shadow font-mono text-sm hover:bg-gray-100 transition"
          >
            💼 {shortAddress(address)}
          </button>
          {menuOpen && (
            <div className="absolute right-0 mt-2 w-32 bg-white border rounded shadow z-10">
              <button
                onClick={() => {
                  disconnect();
                  setMenuOpen(false);
                }}
                className="block w-full px-4 py-2 text-left text-red-600 hover:bg-red-100"
              >
                🔌 Disconnect
              </button>
            </div>
          )}
        </div>

        {!frameAdded ? (
          <div className="bg-gray-200 bg-opacity-50 backdrop-blur-sm rounded-lg p-6 w-full flex flex-col items-center gap-4">
            <h2 className="text-lg font-bold text-center">Add Frame to Cast</h2>
            <p className="text-sm text-center mb-2">
              Please add this frame before playing
            </p>
            <button
              className="bg-purple-600 text-white px-6 py-2 rounded hover:bg-purple-700 shadow transition flex items-center gap-2"
              onClick={handleAddFrame}
              disabled={isAddingFrame}
            >
              {isAddingFrame ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Adding...
                </>
              ) : (
                "Add Frame"
              )}
            </button>
          </div>
        ) : (
          <>
            <SpinWheel
              address={address}
              onSpinSuccess={() => setRefreshTrigger((prev) => prev + 1)}
            />
            <WinnersHistory refreshTrigger={refreshTrigger} />
          </>
        )}
      </div>
    );
  }

  return (
    <button
      className="bg-purple-600 text-white px-6 py-3 rounded hover:bg-purple-700 shadow transition"
      type="button"
      onClick={() => connect({ connector: connectors[0] })}
    >
      Connect Wallet
    </button>
  );
}
