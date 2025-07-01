"use client";

import { useEffect, useState } from "react";

export default function Page() {
    const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
    const driverId = "123"; // 👈 replace with real driver ID from auth/session


    useEffect(() => {
        if (!navigator.geolocation) {
            console.error("Geolocation is not supported by your browser");
            return;
        }

        const watchId = navigator.geolocation.watchPosition(
            (pos) => {
                const { latitude, longitude } = pos.coords;
                const newLocation = { lat: latitude, lng: longitude };
                setLocation(newLocation);

                const fetchDataLocation = async () => {
                    try {
                        await fetch("/api/update-location", {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                            },
                            body: JSON.stringify({ driverId, ...newLocation }),
                        });
                    } catch (err) {
                        console.error("Failed to send location:", err);
                    }
                };

                fetchDataLocation();
            },
            (err) => {
                console.error("Error getting location:", err);
            },
            {
                enableHighAccuracy: true,
                maximumAge: 10000,
                timeout: 5000,
            }
        );

        return () => {
            navigator.geolocation.clearWatch(watchId);
        };
    }, [driverId]);

    return (
        <div className="py-[2rem]">
            <div className="w-full justify-center flex">
                <div className="bg-white rounded-[10px] border border-[#E3E7EC] text-[.6rem] py-[2rem] w-[95%] px-[2rem] space-y-[2rem]">
                    <h1 className="text-[2rem]">Lokasi Pengantaran</h1>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-[2rem]">
                        <div>
                            <h1>Tracking Your Location</h1>
                            <p>
                                {location
                                    ? `Lat: ${location.lat}, Lng: ${location.lng}`
                                    : "Locating..."}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
