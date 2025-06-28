import crypto from "crypto";
import { getFormattedDate } from "./dateFormater";

// Your main fetch function
export async function fetchAccurateIds(data: any) {
  const ACCESS_TOKEN = process.env.ACCESS_TOKEN!;
  const SECRET = process.env.SECRET!;
  const SESSION_ID = process.env.SESSION_ID!; // Optional, depending on Accurate
  const timestamp = Date.now().toString();
  const date = getFormattedDate();

  const signature = crypto
    .createHmac("sha256", SECRET)
    .update(timestamp)
    .digest("base64");

  const url = `https://public.accurate.id/accurate/api/delivery-order/list.do?fields=id,number,transDate,createdByUserName,branch&filter.transDate.op=EQUAL&filter.branchName=${data?.cabang}&filter.transDate.val[0]=${date}&sp.page=${data?.page}&sp.pageSize=200`;

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
    const deliveryOrders = json?.d || [];
    return deliveryOrders.map((item: any) => item.id);
  } catch (error) {
    console.error("Accurate API error:", error);
    return [];
  }
}

export async function fetchAccurateDetail(id: number) {
  const timestamp = Date.now().toString();
  const signature = crypto
    .createHmac("sha256", process.env.SECRET!)
    .update(timestamp)
    .digest("base64");

  const res = await fetch(
    `https://public.accurate.id/accurate/api/delivery-order/detail.do?id=${id}`,
    {
      headers: {
        Authorization: `Bearer ${process.env.ACCESS_TOKEN}`,
        "X-Api-Timestamp": timestamp,
        "X-Api-Signature": signature,
      },
    }
  );
  console.log(res.json);

  return await res.json();
}
