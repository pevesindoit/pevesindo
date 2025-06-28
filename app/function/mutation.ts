import crypto from "crypto";
import { getFormattedDate } from "./dateFormater";
import { getFormattedDateMutation } from "./formatedDateMutation";

export async function fetchMutations(data: any) {
  const ACCESS_TOKEN = process.env.ACCESS_TOKEN!;
  const SECRET = process.env.SECRET!;
  const timestamp = Date.now().toString();
  const date = getFormattedDate();

  const signature = crypto
    .createHmac("sha256", SECRET)
    .update(timestamp)
    .digest("base64");

  console.log("ini date", date);

  const url = `https://public.accurate.id/accurate/api/item-transfer/list.do?fields=id,number,transDate,createdByUserName,branch,branchName&filter.branchName=${data.cabang}&filter.transDate.op=EQUAL&filter.transDate.val[0]=${date}&sp.pageSize=100`;
  // "https://public.accurate.id/accurate/api/item/stock-mutation-history.do?filter.transactionType.op=EQUAL&filter.transactionType.val[1]=IT&filter.createDate.op=BETWEEN&filter.createDate.val[0]=11/06/2025 00:00:00&filter.createDate.val[1]=11/06/2025 23:00:00&sp.pageSize=200";
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
    console.log("liat bede", json);
    return json;
  } catch (error) {
    console.error("Accurate API error:", error);
    return [];
  }
}
