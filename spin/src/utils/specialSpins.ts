// utils/specialSpins.ts

const specialSpinAddresses: Record<string, number> = {
  "0x5f138c8135a0a2951883e830a5e86bc39e8457df": 20,
  "0x7f748f154b6d180d35fa12460c7e4c631e28a9d7": 10,
  "0x22b2dd2cfef2018d15543c484acef6d9b5435863": 10,
};

export function getMaxSpinsForAddress(address: string | undefined): number {
  if (!address) return 3;
  return specialSpinAddresses[address.toLowerCase()] || 3;
}
