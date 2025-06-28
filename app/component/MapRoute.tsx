'use client';

import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet-routing-machine";

type Props = {
    from: [number, number];
    to: [number, number];
};

export default function RoutingMachine({ from, to }: Props) {
    const map = useMap();
    const routingRef = useRef<any>(null); // store the routing control

    useEffect(() => {
        if (!from || !to || !map) return;

        // Remove previous route if exists
        if (routingRef.current) {
            try {
                routingRef.current.remove();
            } catch (err) {
                console.warn("Error while removing previous route:", err);
            }
        }

        const instance = L.Routing.control({
            waypoints: [L.latLng(...from), L.latLng(...to)],
            lineOptions: {
                styles: [{ color: 'blue', weight: 4 }],
            },
            show: false,               // ⛔ Hides turn-by-turn directions
            addWaypoints: false,       // Prevent users from dragging the route
            routeWhileDragging: false,
            fitSelectedRoutes: false,
            createMarker: () => null,  // Prevent default markers if you have custom ones
        } as any).addTo(map);



        routingRef.current = instance;

        // Clean up
        return () => {
            if (routingRef.current) {
                try {
                    routingRef.current.remove();
                } catch (e) {
                    console.warn("Cleanup error (route):", e);
                }
                routingRef.current = null;
            }
        };
    }, [from, to, map]);

    return null;
}
