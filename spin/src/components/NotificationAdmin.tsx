// src/components/NotificationAdmin.tsx
import { useState } from "react";
import { useAccount } from "wagmi";
import { sendFrameNotification } from "../services/neynar-notifications";

export default function NotificationAdmin() {
  const { address } = useAccount();
  const [input, setInput] = useState({
    message: "🎉 New rewards available! Spin now!",
    imageUrl: "",
  });
  const [status, setStatus] = useState<{
    loading: boolean;
    result?: { success: boolean; sentCount?: number };
  }>({ loading: false });

  // Configuration - replace these with your actual values
  const ADMIN_ADDRESS = "0x5F138C8135A0A2951883e830a5E86Bc39E8457df";
  const SIGNER_UUID = "48428b0a-f722-4f73-822a-3907567c5a16"; // From Neynar dashboard
  const FRAME_URL = "https://wheel.exapp.xyz/"; // Your frame URL

  const handleSend = async () => {
    if (address !== ADMIN_ADDRESS) return;
    
    setStatus({ loading: true });
    
    const result = await sendFrameNotification({
      signerUuid: SIGNER_UUID, // Required
      message: input.message,
      parentUrl: FRAME_URL,    // Changed from frameUrl to parentUrl
      imageUrl: input.imageUrl || undefined,
      userFids: []             // You'll need to provide actual FIDs here
    });
    
    setStatus({ loading: false, result });
  };

  if (address !== ADMIN_ADDRESS) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-white p-4 rounded-lg shadow-lg border max-w-xs">
      <h3 className="font-bold mb-2">🔔 Admin Notifications</h3>
      
      <textarea
        value={input.message}
        onChange={(e) => setInput({...input, message: e.target.value})}
        className="w-full p-2 border mb-2 text-sm"
        rows={3}
      />
      
      <input
        type="text"
        value={input.imageUrl}
        onChange={(e) => setInput({...input, imageUrl: e.target.value})}
        placeholder="Image URL (optional)"
        className="w-full p-2 border mb-2 text-sm"
      />
      
      <button
        onClick={handleSend}
        disabled={status.loading}
        className="bg-purple-600 text-white px-3 py-1 rounded text-sm disabled:opacity-50"
      >
        {status.loading ? "Sending..." : "Send to Users"}
      </button>
      
      {status.result && (
        <div className={`mt-2 p-2 text-sm rounded ${
          status.result.success ? "bg-green-100" : "bg-red-100"
        }`}>
          {status.result.success
            ? `Sent to ${status.result.sentCount} users`
            : "Failed to send"}
        </div>
      )}
    </div>
  );
}