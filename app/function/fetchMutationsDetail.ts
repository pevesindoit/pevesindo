import crypto from "crypto";
import { getFormattedDate } from "./dateFormater";

export async function fetchMutationsDetail(id: any) {
  const ACCESS_TOKEN = process.env.ACCESS_TOKEN!;
  const SECRET = process.env.SECRET!;
  const timestamp = Date.now().toString();

  const signature = crypto
    .createHmac("sha256", SECRET)
    .update(timestamp)
    .digest("base64");

  const url = `https://public.accurate.id/accurate/api/item-transfer/detail.do?id=${id}`;
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
        "X-Api-Timestamp": timestamp,
        "X-Api-Signature": signature,
      },
    });

    const contentType = response.headers.get("content-type") || "";

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    if (!contentType.includes("application/json")) {
      const raw = await response.text();
      throw new Error(`Unexpected content-type: ${contentType}\n${raw}`);
    }

    const json = await response.json();
    return json;
  } catch (error) {
    console.error("Accurate API error:", error);
    return [];
  }
}
