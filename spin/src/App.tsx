// App.tsx
import { sdk } from "@farcaster/frame-sdk";
import { useEffect } from "react";
import ConnectMenu from "./components/ConnectMenu";

function App() {
  useEffect(() => {
    sdk.actions.ready();
  }, []);

  return (
    <div
      className="min-h-screen flex flex-col items-center p-6 bg-cover bg-center relative"
      style={{ backgroundImage: "url('/bg.png')" }}
    >
      {/* Doodle header */}
      <h1 className="
        text-4xl font-extrabold 
        text-white drop-shadow-[3px_3px_0px_#000]
        mb-4
        tracking-wider
        doodle-text
      ">
        🎨 SPIN & WIN 🎉
      </h1>

      <ConnectMenu />
    </div>
  );
}

export default App;
