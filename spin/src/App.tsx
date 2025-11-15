// App.tsx
import { sdk } from "@farcaster/frame-sdk";
import { useEffect } from "react";
import ConnectMenu from "./components/ConnectMenu";

function App() {
  useEffect(() => {
    sdk.actions.ready();
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-start p-6 bg-[#fefefe]">
      <ConnectMenu />
    </div>
  );
}

export default App;
