import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

const ACCESS_TOKEN = process.env.ACCESS_TOKEN!;
const SECRET = process.env.SECRET!;
const SESSION_ID = process.env.SESSION_ID!;

export async function POST(req: NextRequest) {
  const timestamp = Date.now().toString();
  const reqBody = await req.json();

  const signature = crypto
    .createHmac("sha256", SECRET)
    .update(timestamp)
    .digest("base64");

  const url = `https://public.accurate.id/accurate/api/delivery-order/detail.do?id=${reqBody}`;

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
      const errorText = await response.text(); // safer than json()
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    if (!contentType.includes("application/json")) {
      const raw = await response.text();
      throw new Error(`Unexpected content-type: ${contentType}\n${raw}`);
    }

    const data = await response.json();

    const itemsOnly =
      data?.d?.detailItem?.map((itemObj: any) => ({
        itemDescription: itemObj?.processQuantityDesc ?? null,
        itemNo: itemObj?.item?.no ?? null,
        itemName: itemObj?.item?.name ?? null,
        shipDate: itemObj?.shipDate ?? null,
        quantityDefault: itemObj?.quantityDefault ?? null,
      })) || [];

    const soNumber = data?.d?.number;
    const customer = data?.d?.customerId;

    console.log(customer);
    return NextResponse.json({
      success: true,
      data: itemsOnly,
      so: soNumber,
      customer,
    });
  } catch (error: any) {
    console.error("API error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to fetch Accurate Online data.",
      },
      { status: 500 }
    );
  }
}
