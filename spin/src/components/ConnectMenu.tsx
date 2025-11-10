import { useAccount } from "wagmi";
import SpinWheel from "./SpinWheel";
import WinnersHistory from "./WinnersHistory";
import { isAddressBanned } from "../utils/bannedAddresses";
import { useEffect, useState } from "react";

export default function ConnectMenu() {
  const { isConnected, address } = useAccount();
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    if (address && isAddressBanned(address)) {
      window.location.href = "/banned.html";
    }
  }, [address]);

  return (
    <>
      {/* Global connect button in top-right corner */}
      <div className="fixed top-4 right-4 z-50">
        <appkit-button />
      </div>

      {/* Game only appears when connected */}
      <div className="w-full max-w-md flex flex-col items-center gap-4">
        {isConnected && address && (
          <>
            <SpinWheel
              address={address}
              onSpinSuccess={() => setRefreshTrigger((prev) => prev + 1)}
            />
            <WinnersHistory refreshTrigger={refreshTrigger} />
          </>
        )}
      </div>
    </>
  );
}
