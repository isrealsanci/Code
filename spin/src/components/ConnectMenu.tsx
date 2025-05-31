import { useState, useEffect } from "react";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import SpinWheel from "./SpinWheel";
import WinnersHistory from "./WinnersHistory";
import { sdk } from "@farcaster/frame-sdk";
import { isAddressBanned } from "../utils/bannedAddresses";

export default function ConnectMenu() {
  const { isConnected, address } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();

  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isAddingFrame, setIsAddingFrame] = useState(false);
  const [frameAdded, setFrameAdded] = useState(() => localStorage.getItem("frameAdded") === "true");

  useEffect(() => {
    if (address && isAddressBanned(address)) {
      window.location.href = "/banned.html";
    }
  }, [address]);

  useEffect(() => {
    const addFrameIfNeeded = async () => {
      if (isConnected && address && !frameAdded) {
        setIsAddingFrame(true);
        try {
          await sdk.actions.addMiniApp();
          localStorage.setItem("frameAdded", "true");
          setFrameAdded(true);
        } catch (error) {
          console.error("Error adding frame:", error);
        } finally {
          setIsAddingFrame(false);
        }
      }
    };
    addFrameIfNeeded();
  }, [isConnected, address, frameAdded]);

  useEffect(() => {
    if (!isConnected) {
      localStorage.removeItem("frameAdded");
      setFrameAdded(false);
    }
  }, [isConnected]);

  const shortAddress = (addr: string) => addr.slice(0, 6) + "..." + addr.slice(-4);

  if (!connectors.length) return <p>No wallet connectors found.</p>;

  if (isConnected && address) {
    return (
      <div className="relative w-full max-w-md flex flex-col items-center gap-4">
        <div className="flex justify-between items-center w-full px-2">
          <button
            onClick={() => setMenuOpen((prev) => !prev)}
            className="bg-purple px-4 py-2 rounded shadow font-mono text-sm hover:bg-gray-100 transition"
          >
            💼 {shortAddress(address)}
          </button>
        </div>

        {menuOpen && (
          <div className="absolute right-4 mt-2 w-32 bg-white border rounded shadow z-10">
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

        {!frameAdded ? (
          <div className="bg-gray-200 bg-opacity-50 backdrop-blur-sm rounded-lg p-6 w-full flex flex-col items-center gap-4">
            <h2 className="text-lg font-bold text-center">Adding Frame...</h2>
            <p className="text-sm text-center">Please wait while we add the frame.</p>
          </div>
        ) : (
          <>
            <SpinWheel address={address} onSpinSuccess={() => setRefreshTrigger((prev) => prev + 1)} />
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
