import crypto from "crypto";
import { getDateXDaysBefore, getFormattedDate } from "./dateFormater";
import { getFormattedDateMutation } from "./formatedDateMutation";

export async function fetchReturn(data: any) {
  const ACCESS_TOKEN = process.env.ACCESS_TOKEN!;
  const SECRET = process.env.SECRET!;
  const timestamp = Date.now().toString();
  const date = getFormattedDate(); // Ensure this formats as "DD/MM/YYYY"
  const threeDaysAgoFormattedDate = getDateXDaysBefore(date, 2);

  const signature = crypto
    .createHmac("sha256", SECRET)
    .update(timestamp)
    .digest("base64");

  const url = `https://public.accurate.id/accurate/api/sales-return/list.do?fields=id,number,transDate,createdByUserName,branch&filter.transDate.op=BETWEEN&filter.transDate.val[0]=${threeDaysAgoFormattedDate}&filter.transDate.val[1]=${date}&filter.branchName=${data?.cabang}&sp.pageSize=100`;

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
    console.error("Accurate API fetchReturn error:", error); // Changed error message
    return { d: [] }; // Return an empty array in case of error
  }
}
