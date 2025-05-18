// utils/bannedAddresses.ts
export const BANNED_ADDRESSES = [
  "0xc86B7B4A1e31aB7854b08539C5f006f5C266D1f1", 
  "0x669C4a3D5673Ab1c7FE0411Bc7FBd122327C5394",
  "0x3fda9d29c7a15804b06573983059ee2228106cf2",
  "0xC78952BC9C9d09Ff00F0620106052bf4daA0b872"
];

export const isAddressBanned = (address: string) => {
  return BANNED_ADDRESSES.includes(address.toLowerCase());
};