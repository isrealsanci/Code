// utils/specialSpins.ts

const specialSpinAddresses: Record<string, number> = {
  "0xaB72467fB47A2324dfD9CeC5Af9637c65047943F": 20,
  "0x7f748f154b6d180d35fa12460c7e4c631e28a9d7": 10,
  "0x22b2dd2cfef2018d15543c484acef6d9b5435863": 10,
  "0xfF4e1c153d8D1bf42A29476C79A15E7517Ee549f": 20,
  "0xfDa907EB554AC44B931Cd8E5582358A597A35479": 40,
  "0x5F138C8135A0A2951883e830a5E86Bc39E8457df": 10,
  
};

export function getMaxSpinsForAddress(address: string | undefined): number {
  if (!address) return 3;
  return specialSpinAddresses[address.toLowerCase()] || 3;
}
