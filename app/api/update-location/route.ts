// app/api/update-location/route.ts

import { driverStore } from "@/lib/driverStore";

export async function POST(req: Request) {
  try {
    const { driverId, lat, lng } = await req.json();

    if (!driverId || lat === undefined || lng === undefined) {
      return new Response(JSON.stringify({ error: "Missing fields" }), {
        status: 400,
      });
    }

    driverStore[driverId] = {
      lat,
      lng,
      updatedAt: Date.now(),
    };

    return Response.json({ success: true });
  } catch (e) {
    return new Response(JSON.stringify({ error: "Server error" }), {
      status: 500,
    });
  }
}
