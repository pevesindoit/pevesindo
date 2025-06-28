import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getFormattedDate } from "@/app/function/dateFormater";

const ACCESS_TOKEN = process.env.ACCESS_TOKEN!;
const SECRET = process.env.SECRET!;
const SESSION_ID = process.env.SESSION_ID!;

export async function POST(req: NextRequest) {
  const reqbody = await req.json();
  const timestamp = Date.now().toString();

  const signature = crypto
    .createHmac("sha256", SECRET)
    .update(timestamp)
    .digest("base64");

  console.log(reqbody);

  const url = `https://public.accurate.id/accurate/api/customer/detail.do?id=${reqbody}`;

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

    const theData = data?.d.name;
    const alamat = `${data?.d.shipCity}, ${data?.d.shipStreet}`;
    const cabang = data?.d.shipCity;

    return NextResponse.json({ success: true, nama: theData, alamat });
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
