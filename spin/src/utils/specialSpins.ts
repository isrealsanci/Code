// utils/specialSpins.ts

const specialSpinAddresses: Record<string, number> = {
  "0xab72467fb47a2324dfd9cec5af9637c65047943f": 20,
  "0x7f748f154b6d180d35fa12460c7e4c631e28a9d7": 10,
  "0x22b2dd2cfef2018d15543c484acef6d9b5435863": 10,
  "0xff4e1c153d8d1bf42a29476c79a15e7517ee549f": 20,
  "0xfda907eb554ac44b931cd8e5582358a597a35479": 40,
  "0x5f138c8135a0a2951883e830a5e86bc39e8457df": 10,
  "0x5266272ef387c42a43467386a5f185f819ac446d": 20,
  "0x3aae36a436e69692dcfcf8beb016a4885dd12a58": 20,
  "0xab8c401a8404de4c7d0a8d54576c929cb9714d85": 20,
  "0x73c434a366a1296ab2794b1527d921fedd59a899": 20,
  "0x20100a5dbf7d1872e6ca51f606d8ab1a3263f567": 20,
  "0x50e023954e4ef678e0c906c0d761fea854b63c6e": 20,
};

export function getMaxSpinsForAddress(address: string | undefined): number {
  if (!address) return 3;
  return specialSpinAddresses[address.toLowerCase()] || 3;
}
