// prizes.ts (updated with multi-chain support)

export interface Prize {
  label: string;
  amount: number;
  chain: 'monad' | 'celo' | 'base' | 'none';
  token: 'MON' | 'CELO' | 'ETH' | null;
}

export const prizeList: Prize[] = [
  { label: "0.05 MON", amount: 0.05, chain: "monad", token: "MON" },
  { label: "0.1 MON", amount: 0.1, chain: "monad", token: "MON" },
  { label: "0.3 MON", amount: 0.3, chain: "monad", token: "MON" },
  { label: "0.5 MON", amount: 0.5, chain: "monad", token: "MON" },
  { label: "1 MON", amount: 1, chain: "monad", token: "MON" },
  { label: "2 MON", amount: 2, chain: "monad", token: "MON" },
  { label: "3 MON", amount: 3, chain: "monad", token: "MON" },
  { label: "5 MON", amount: 5, chain: "monad", token: "MON" },
  { label: "Thanks", amount: 0, chain: "none", token: null },

];
