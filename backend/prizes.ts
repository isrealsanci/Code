// prizes.ts (updated with multi-chain support)

export interface Prize {
  label: string;
  amount: number;
  chain: 'monad' | 'celo' | 'base' | 'none';
  token: 'MON' | 'CELO' | 'ETH' | null;
}

export const prizeList: Prize[] = [
  { label: "$0.01 ETH", amount: 0.000005, chain: "base", token: "ETH" },
  { label: "$0.05 ETH", amount: 0.00002, chain: "base", token: "ETH" },
  { label: "$0.1 ETH", amount: 0.00004, chain: "base", token: "ETH" },
  { label: "$0.5 ETH", amount: 0.0002, chain: "base", token: "ETH" },
  { label: "0.001 CELO", amount: 0.001, chain: "celo", token: "CELO" },
  { label: "0.01 CELO", amount: 0.01, chain: "celo", token: "CELO" },
  { label: "0.05 CELO", amount: 0.05, chain: "celo", token: "CELO" },
  { label: "0.1 CELO", amount: 0.1, chain: "celo", token: "CELO" },
  { label: "0.001 MON", amount: 0.001, chain: "monad", token: "MON" },
  { label: "0.01 MON", amount: 0.01, chain: "monad", token: "MON" },
  { label: "0.05 MON", amount: 0.05, chain: "monad", token: "MON" },
  { label: "0.1 MON", amount: 0.1, chain: "monad", token: "MON" },
  { label: "Thanks", amount: 0, chain: "none", token: null },
];
