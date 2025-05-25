// utils/bannedAddresses.ts
export const BANNED_ADDRESSES = [
  "0xc86b7b4a1e31ab7854b08539c5f006f5c266d1f1", // Pastikan semua lowercase
  "0x669c4a3d5673ab1c7fe0411bc7fbd122327c5394",
  "0x3fda9d29c7a15804b06573983059ee2228106cf2"
].map(addr => addr.toLowerCase()); // Konversi otomatis ke lowercase

export const isAddressBanned = (address: string | undefined) => {
  if (!address) return false;
  return BANNED_ADDRESSES.includes(address.toLowerCase());
};
