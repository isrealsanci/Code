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
    <div className="w-full flex flex-col items-center">

      
      <div
        className="
          text-5xl font-extrabold 
          text-black
          drop-shadow-[4px_4px_0px_#ffde59]
          doodle-text
          mb-6
          text-center
          px-4
          py-2
        "
      >
        ✨ SPIN & WIN ✨
      </div>

      
      <div
        className="
          flex flex-col items-center 
          bg-[#fff5d7]
          border-4 border-black
          rounded-3xl
          shadow-[6px_6px_0px_#000]
          p-6
          max-w-md w-full
          mb-8
        "
      >

        <appkit-button />
      </div>

     
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
    </div>
  );
}
