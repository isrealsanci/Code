// utils/bannedAddresses.ts
export const BANNED_ADDRESSES = [
  "0x000c4a3d5673ab1c7fe0411bc7fbd122327c0000"
].map(addr => addr.toLowerCase()); 

export const isAddressBanned = (address: string | undefined) => {
  if (!address) return false;
  return BANNED_ADDRESSES.includes(address.toLowerCase());
};
