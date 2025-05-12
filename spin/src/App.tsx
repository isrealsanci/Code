import { sdk } from "@farcaster/frame-sdk";
import { useEffect } from "react";
import { useAccount, useConnect } from "wagmi";
import SpinWheel from "./components/SpinWheel";
import WinnersHistory from "./components/WinnersHistory";

function App() {
  useEffect(() => {
    sdk.actions.ready(); // Notifikasi ke Farcaster Frame
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-start p-6">
      <h1 className="text-2xl font-bold mb-6">🎯 Spin & Win MON</h1>
      <ConnectMenu />
    </div>
  );
}

function ConnectMenu() {
  const { isConnected, address } = useAccount();
  const { connect, connectors } = useConnect();

  if (!connectors.length) return <p>No wallet connectors found.</p>;

  if (isConnected && address) {
    return (
      <>
        <p className="mb-2 text-sm text-gray-600">💼 Connected: {address}</p>
        <SpinWheel address={address} />
        <WinnersHistory />
      </>
    );
  }

  return (
    <button
      className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
      type="button"
      onClick={() => connect({ connector: connectors[0] })}
    >
      Connect Wallet
    </button>
  );
}

export default App;
