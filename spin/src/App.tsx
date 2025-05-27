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
      className="min-h-screen flex flex-col items-center justify-start p-6 bg-cover bg-center"
      style={{ backgroundImage: "url('/bg.png')" }}
    >
      <h1 className="text-2xl font-bold mb-6 text-white drop-shadow-md">
        🎯SPIN & WIN
      </h1>

      > 
       <h4 className="text-5xl font-bold mb-6 text-red drop-shadow-md">
         Maintenance
      </h4>
      
    </div>
  );
}

export default App;
