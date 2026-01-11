import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import {
  mainnet,
  sepolia,
  polygon,
  optimism,
  arbitrum,
  base,
  anvil,
} from "wagmi/chains";

export const config = getDefaultConfig({
  appName: "rpc-proxy",
  // Get a free projectId at https://cloud.walletconnect.com
  projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || "demo",
  chains: [mainnet, sepolia, polygon, optimism, arbitrum, base, anvil],
});
