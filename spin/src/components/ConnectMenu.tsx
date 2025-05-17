// ConnectMenu.tsx (integrated with updated server.ts)
import { useState, useEffect } from "react";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import SpinWheel from "./SpinWheel";
import WinnersHistory from "./WinnersHistory";
import { sdk } from "@farcaster/frame-sdk";

const DONATE_ADDRESS = "0x893E76AB37Be1b3e26732fE9cede1f0015599B47";
const API_SERVER_URL = process.env.NEXT_PUBLIC_API_SERVER_URL || "http://localhost:3000";

export default function ConnectMenu() {
  const { isConnected, address } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();

  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [donateOpen, setDonateOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [fid, setFid] = useState<number | null>(null);
  const [frameAdded, setFrameAdded] = useState(false);
  const [isAddingFrame, setIsAddingFrame] = useState(false);
  const [notificationToken, setNotificationToken] = useState("");

  const shortAddress = (addr: string) => addr.slice(0, 6) + "..." + addr.slice(-4);
  const sliceAddress = (addr: string) => addr.slice(0, 10) + "..." + addr.slice(-6);

  // Check for existing frame state on load
  useEffect(() => {
    if (isConnected && address) {
      const storedFrameAdded = localStorage.getItem(`frameAdded_${address}`);
      if (storedFrameAdded === "true") {
        setFrameAdded(true);
      }
    }
  }, [isConnected, address]);

  const handleAddFrame = async () => {
    setIsAddingFrame(true);
    try {
      // Step 1: Add frame to cast
      await sdk.actions.addFrame();
      
      // Generate a unique notification token for this session
      const token = `notif-token-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      setNotificationToken(token);
      
      // Step 2: Register with our server
      await registerFrameAdded(token);
      
      // Mark frame as added
      setFrameAdded(true);
      localStorage.setItem(`frameAdded_${address}`, "true");
      
      // Step 3: Send welcome notification
      await sendWelcomeNotification();
      
    } catch (error) {
      console.error("Error adding frame:", error);
    } finally {
      setIsAddingFrame(false);
    }
  };

  const registerFrameAdded = async (token: string) => {
    try {
      await fetch(`${API_SERVER_URL}/api/webhook`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: "frame_added",
          fid: fid || 0, // In production, you'd get this from Neynar API
          notification_token: token,
          notification_url: `${API_SERVER_URL}/api/webhook`
        })
      });
    } catch (error) {
      console.error("Frame registration failed:", error);
    }
  };

  const sendWelcomeNotification = async () => {
    try {
      await fetch(`${API_SERVER_URL}/api/send-broadcast`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Welcome to Spin Wheel!",
          body: "Your frame has been added successfully. Spin to win prizes!",
          targetUrl: window.location.href
        })
      });
    } catch (error) {
      console.error("Welcome notification failed:", error);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(DONATE_ADDRESS);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Clean up on disconnect
  useEffect(() => {
    return () => {
      if (!isConnected && fid) {
        // Unregister notifications when disconnecting
        fetch(`${API_SERVER_URL}/api/webhook`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            event: "frame_removed",
            fid: fid
          })
        }).catch(console.error);
      }
    };
  }, [isConnected, fid]);

  if (!connectors.length) return <p>No wallet connectors found.</p>;

  if (isConnected && address) {
    return (
      <div className="relative w-full max-w-md flex flex-col items-center gap-4">
        <div className="flex justify-between items-center w-full px-2">
          <button
            onClick={() => setMenuOpen((prev) => !prev)}
            className="bg-white px-4 py-2 rounded shadow font-mono text-sm hover:bg-gray-100 transition"
          >
            💼 {shortAddress(address)}
          </button>
          <button
            onClick={() => setDonateOpen(true)}
            className="bg-pink-500 text-white px-4 py-2 rounded shadow text-sm hover:bg-pink-600 transition"
          >
            ❤️ Donate
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

        {donateOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-sm relative">
              <button
                onClick={() => setDonateOpen(false)}
                className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
              >
                ❌
              </button>
              <h2 className="text-xl font-bold mb-2 text-center">Donate For Spin Wheel</h2>
              <p className="text-sm text-center mb-4">Only Send - ETH Base - Monad - Celo</p>
              <div
                onClick={copyToClipboard}
                className="bg-gray-100 border text-center text-sm px-4 py-3 rounded-lg cursor-pointer hover:bg-gray-200 select-all truncate"
                title={DONATE_ADDRESS}
              >
                {sliceAddress(DONATE_ADDRESS)}
              </div>
              {copied && <p className="text-green-600 text-xs text-center mt-2">Address copied to clipboard!</p>}
            </div>
          </div>
        )}

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