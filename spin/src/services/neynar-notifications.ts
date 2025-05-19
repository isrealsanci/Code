// src/services/neynar-notifications.ts
import { NeynarAPIClient } from "@neynar/nodejs-sdk";

const client = new NeynarAPIClient({
  apiKey: process.env.NEXT_PUBLIC_NEYNAR_API || "YOUR_NEYNAR_API_KEY"
});

type NotificationOptions = {
  signerUuid: string;
  message: string;
  parentUrl?: string;  // Previously called frameUrl
  imageUrl?: string;
  userFids?: number[];
};

export const sendFrameNotification = async (
  options: NotificationOptions
): Promise<{ success: boolean; sentCount?: number; error?: string }> => {
  try {
    if (!options.signerUuid) {
      throw new Error("Signer UUID is required");
    }

    let fidsToNotify = options.userFids || [];
    
    if (fidsToNotify.length === 0) {
      console.warn("No FIDs provided - notifications won't be sent");
      return { success: false, error: "No users to notify" };
    }

    const batch = fidsToNotify.slice(0, 50);
    
    const sendPromises = batch.map(async (fid) => {
      try {
        // Correct implementation based on Neynar docs
        await client.publishCast({
          signerUuid: options.signerUuid,
          text: options.message,
          embeds: options.imageUrl ? [{ url: options.imageUrl }] : undefined,
          parent: options.parentUrl, // Use 'parent' instead of 'replyTo'
          channelId: undefined // Optional channel ID if needed
        });
        return { success: true, fid };
      } catch (error) {
        console.error(`Failed to notify user ${fid}:`, error);
        return { success: false, fid };
      }
    });

    const results = await Promise.all(sendPromises);
    const successfulSends = results.filter(r => r.success);

    return { 
      success: true, 
      sentCount: successfulSends.length 
    };
  } catch (error) {
    console.error("Notification system error:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  }
};