export interface Prize {
  label: string;
  amount: number;
  chance: number; // percent
}

export const prizes: Prize[] = [
  { label: "Thanks 🎉", amount: 0, chance: 40 },
  { label: "0.001 MON", amount: 0.001, chance: 39 },
  { label: "0.05 MON", amount: 0.05, chance: 20 },
  { label: "0.1 MON", amount: 0.1, chance: 1 },
  { label: "1 MON", amount: 1, chance: 0 },
  { label: "2.5 MON", amount: 2.5, chance: 0 },
  { label: "5 MON", amount: 5, chance: 0 },
];
