import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const url = body.url;
  console.log("coba", url);

  if (!url || typeof url !== "string") {
    return NextResponse.json({ error: "Missing URL" }, { status: 400 });
  }

  try {
    // Use GET so we follow the actual redirect to the real maps URL
    const response = await fetch(url, {
      method: "GET",
      redirect: "follow",
    });

    console.log("ini responsnya", response);

    const finalUrl = response.url;

    // Try to extract @lat,lng from finalUrl
    const coords = extractLatLngFromUrl(finalUrl);

    return NextResponse.json({
      finalUrl,
      lat: coords?.lat ?? null,
      lng: coords?.lng ?? null,
    });
  } catch (error) {
    console.error("Resolve link error:", error);
    return NextResponse.json(
      { error: "Failed to resolve link" },
      { status: 500 }
    );
  }
}

// helper function inside this file
function extractLatLngFromUrl(
  url: string
): { lat: number; lng: number } | null {
  const match = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (match) {
    return {
      lat: parseFloat(match[1]),
      lng: parseFloat(match[2]),
    };
  }
  return null;
}
