// notifications.ts (ESM-compatible with tsconfig using ES2022)
import fs from "fs";
import path from "path";
import axios from "axios";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const FILE_PATH = path.join(__dirname, "notifications.json");

interface NotificationEntry {
  fid: number;
  token: string;
  url: string;
}

function loadData(): NotificationEntry[] {
  if (!fs.existsSync(FILE_PATH)) return [];
  try {
    const raw = fs.readFileSync(FILE_PATH, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    console.error("Failed to load notifications:", err);
    return [];
  }
}

function saveData(entries: NotificationEntry[]) {
  fs.writeFileSync(FILE_PATH, JSON.stringify(entries, null, 2));
}

export function saveNotificationToken(fid: number, token: string, url: string) {
  const data = loadData();
  const existing = data.find((d) => d.fid === fid);

  if (existing) {
    existing.token = token;
    existing.url = url;
  } else {
    data.push({ fid, token, url });
  }

  saveData(data);
  console.log(`🔔 Notification token saved for fid: ${fid}`);
}

export function removeNotificationToken(fid: number) {
  const data = loadData().filter((d) => d.fid !== fid);
  saveData(data);
  console.log(`❌ Notification token removed for fid: ${fid}`);
}

export async function sendNotificationToFid(
  fid: number,
  title: string,
  body: string,
  targetUrl: string
) {
  const data = loadData();
  const user = data.find((d) => d.fid === fid);

  if (!user) {
    console.warn(`⚠️ No token found for fid: ${fid}`);
    return;
  }

  const payload = {
    notificationId: `notif-${Date.now()}`,
    title,
    body,
    targetUrl,
  };

  try {
    await axios.post(user.url, payload, {
      headers: {
        Authorization: `Bearer ${user.token}`,
        "Content-Type": "application/json",
      },
    });
    console.log(`✅ Notification sent to fid ${fid}`);
  } catch (err) {
    console.error(`❌ Failed to send notification to fid ${fid}:`, err);
  }
}

export async function sendNotificationToAllUsers(
  title: string,
  body: string,
  targetUrl: string
) {
  const data = loadData();

  const sendToOne = async (entry: NotificationEntry) => {
    const payload = {
      notificationId: `broadcast-${Date.now()}-${entry.fid}`,
      title,
      body,
      targetUrl,
    };

    try {
      await axios.post(entry.url, payload, {
        headers: {
          Authorization: `Bearer ${entry.token}`,
          "Content-Type": "application/json",
        },
      });
      console.log(`📣 Notification sent to fid ${entry.fid}`);
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error(`❌ Failed to send to fid ${entry.fid}:`, err.message);
      } else {
        console.error(`❌ Failed to send to fid ${entry.fid}:`, err);
      }
    }
  };

  await Promise.all(data.map(sendToOne));
}
