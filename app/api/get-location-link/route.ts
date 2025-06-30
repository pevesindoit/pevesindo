// app/api/resolve-location/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const alamat = body.url;

  if (!alamat || typeof alamat !== "string") {
    return NextResponse.json({ error: "Missing address" }, { status: 400 });
  }

  try {
    const geocoded = await fetchGeocode(alamat);
    if (geocoded) {
      return NextResponse.json({
        lat: geocoded.lat,
        lng: geocoded.lng,
        method: "from-geocode",
      });
    }

    return NextResponse.json(
      { error: "Coordinates not found" },
      { status: 404 }
    );
  } catch (error) {
    console.error("Geocoding error:", error);
    return NextResponse.json(
      { error: "Failed to fetch geocode data" },
      { status: 500 }
    );
  }
}

async function fetchGeocode(
  address: string
): Promise<{ lat: number; lng: number } | null> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  const cleaned = address.replace(/\n/g, ", "); // Replace newlines with commas
  const encoded = encodeURIComponent(cleaned);

  const res = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?address=${encoded}&key=${apiKey}`
  );
  const data = await res.json();

  if (data.status !== "OK") {
    console.warn("Google Maps API error:", data.status, data.error_message);
    return null;
  }

  const loc = data?.results?.[0]?.geometry?.location;
  if (loc) return { lat: loc.lat, lng: loc.lng };
  return null;
}
