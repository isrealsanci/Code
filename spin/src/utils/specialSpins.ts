// utils/specialSpins.ts

const specialSpinAddresses: Record<string, number> = {
  "0xaB72467fB47A2324dfD9CeC5Af9637c65047943F": 20,
  "0x7f748f154b6d180d35fa12460c7e4c631e28a9d7": 10,
  "0x22b2dd2cfef2018d15543c484acef6d9b5435863": 10,
  "0xfF4e1c153d8D1bf42A29476C79A15E7517Ee549f": 20,
  "0xfDa907EB554AC44B931Cd8E5582358A597A35479": 40,
  "0x5F138C8135A0A2951883e830a5E86Bc39E8457df": 10,
  "0x5266272EF387C42A43467386A5f185F819AC446d": 20,
  "0x3aAe36a436e69692dcfCF8bEB016a4885dD12A58": 20,
  "0xaB8c401a8404DE4C7d0A8D54576c929cB9714D85": 20,
  "0x73c434a366a1296ab2794b1527d921FeDD59a899": 20,
  "0x20100A5dbF7d1872e6Ca51f606d8Ab1a3263f567": 20,
  "0x50E023954E4Ef678e0C906c0d761FEa854B63C6E": 20,
  
};

export function getMaxSpinsForAddress(address: string | undefined): number {
  if (!address) return 3;
  return specialSpinAddresses[address.toLowerCase()] || 3;
}
