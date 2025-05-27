// prizes.ts (updated with multi-chain support)

export interface Prize {
  label: string;
  amount: number;
  chain: 'monad' | 'celo' | 'base' | 'none';
  token: 'MON' | 'CELO' | 'ETH' | null;
}

export const prizeList: Prize[] = [
  
  { label: "0.001 CELO", amount: 0.001, chain: "celo", token: "CELO" }, //5
  { label: "0.01 CELO", amount: 0.01, chain: "celo", token: "CELO" }, //6
  { label: "0.1 CELO", amount: 0.1, chain: "celo", token: "CELO" }, //
  { label: "Thanks", amount: 0, chain: "none", token: null },
];
