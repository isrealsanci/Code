import { farcasterFrame } from "@farcaster/frame-wagmi-connector";
import { http, createConfig } from "wagmi";
import { base, mainnet } from "wagmi/chains";
import {metaMask} from "wagmi/connectors";

export const config = createConfig({
  chains: [base, mainnet],
  connectors: [farcasterFrame(), metaMask()],
  transports: {
    [base.id]: http(),
    [mainnet.id]: http(),
  },
});



declare module "wagmi" {
  interface Register {
    config: typeof config;
  }
}
