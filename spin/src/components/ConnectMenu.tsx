// ConnectMenu.tsx
import { useState, useEffect } from "react";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import SpinWheel from "./SpinWheel";
import WinnersHistory from "./WinnersHistory";
import { sdk } from "@farcaster/frame-sdk";
import { isAddressBanned } from "../utils/bannedAddresses";
import { parseEther } from 'viem';
import { useWaitForTransactionReceipt, useWriteContract } from 'wagmi';

const DONATE_ADDRESS = "0x893E76AB37Be1b3e26732fE9cede1f0015599B47";
const VIP_CONTRACT = "0xDed766dB5140DE5d36D38500035e470EB28D7fC7";

export default function ConnectMenu() {
  const { isConnected, address } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();

  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [donateOpen, setDonateOpen] = useState(false);
  const [vipOpen, setVipOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [frameAdded, setFrameAdded] = useState(() => localStorage.getItem("frameAdded") === "true");
  const [isAddingFrame, setIsAddingFrame] = useState(false);

  // VIP Mint
  const { 
    data: hash,
    error: mintError,
    isPending: isMintLoading,
    writeContract 
  } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess: isConfirmed } = 
    useWaitForTransactionReceipt({ 
      hash, 
    });

  const handleMint = () => {
    writeContract({
      address: VIP_CONTRACT,
      abi: [{
        inputs: [],
        name: "mint",
        outputs: [],
        stateMutability: "payable",
        type: "function"
      }],
      functionName: "mint",
      value: parseEther("0.00044"),
    });
  };

  // Redirect jika address dibanned
  useEffect(() => {
    if (address && isAddressBanned(address)) {
      window.location.href = "/banned.html";
    }
  }, [address]);

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

  const copyToClipboard = () => {
    navigator.clipboard.writeText(DONATE_ADDRESS);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sliceAddress = (addr: string) => addr.slice(0, 10) + "..." + addr.slice(-6);

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
        <div className="flex justify-between items-center w-full px-2">
          <button
            onClick={() => setMenuOpen((prev) => !prev)}
            className="bg-white px-4 py-2 rounded shadow font-mono text-sm hover:bg-gray-100 transition"
          >
            💼 {shortAddress(address)}
          </button>
          <button
            onClick={() => setVipOpen(true)}
            className="bg-yellow-500 text-white px-4 py-2 rounded shadow text-sm hover:bg-yellow-600 transition"
          >
            ⭐ Buy VIP
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

        {vipOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-sm relative">
              <button
                onClick={() => setVipOpen(false)}
                className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
              >
                ❌
              </button>
              <h2 className="text-xl font-bold mb-2 text-center">VIP Membership</h2>
              <p className="text-sm text-center mb-4">Buy & Hold NFT to get 20 Spin per day forever</p>
              
              <button
                onClick={handleMint}
                disabled={isMintLoading || isConfirming}
                className="w-full bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600 transition flex items-center justify-center gap-2"
              >
                {isMintLoading || isConfirming ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {isConfirming ? "Confirming..." : "Minting..."}
                  </>
                ) : (
                  "Mint VIP NFT (0.00044 ETH)"
                )}
              </button>

              {hash && (
                <div className="mt-4 p-2 bg-gray-100 rounded text-xs break-all">
                  <p>Transaction Hash:</p>
                  <p>{hash}</p>
                </div>
              )}

              {isConfirmed && (
                <div className="mt-4 p-2 bg-green-100 text-green-800 rounded text-center">
                  Successfully minted VIP NFT!
                </div>
              )}

              {mintError && (
                <div className="mt-4 p-2 bg-red-100 text-red-800 rounded text-center">
                  Error: {mintError.message}
                </div>
              )}
            </div>
          </div>
        )}

        {!frameAdded ? (
          <div className="bg-gray-200 bg-opacity-50 backdrop-blur-sm rounded-lg p-6 w-full flex flex-col items-center gap-4">
            <h2 className="text-lg font-bold text-center">Add Frame to Cast</h2>
            <p className="text-sm text-center mb-2">Please add this frame before playing</p>
            <button
              className="bg-purple-600 text-white px-6 py-2 rounded hover:bg-purple-700 shadow transition flex items-center gap-2"
              onClick={handleAddFrame}
              disabled={isAddingFrame}
            >
              {isAddingFrame ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
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