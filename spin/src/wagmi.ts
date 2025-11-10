// wagmi.ts

import { createAppKit } from "@reown/appkit/react";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { base } from "@reown/appkit/networks";

const projectId = "";

export const wagmiAdapter = new WagmiAdapter({
  projectId,
  networks: [base],
  ssr: true,
  connectors: [],
});

createAppKit({
  adapters: [wagmiAdapter],
  networks: [base],
  projectId,
  metadata: {
    name: "Spin Wheel Multichain",
    description: "Spin Wheel Game with prize multichain reward",
    url: "https://wheel.exapp.xyz/",
    icons: ["https://wheel.exapp.xyz//logo.png"],
  },
  features: {
    history: false,
  },
  themeMode: "light",
});

export const config = wagmiAdapter.wagmiConfig;