// app/api/driver-location/route.ts

import { driverStore } from "@/lib/driverStore";

export function GET() {
  const locations = Object.entries(driverStore).map(([id, loc]) => ({
    id,
    lat: loc.lat,
    lng: loc.lng,
  }));

  return Response.json({ locations });
}
