'use client';

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import RoutingMachine from './MapRoute';

// Fix default marker icon path
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconUrl: '',
    iconRetinaUrl: '',
    shadowUrl: '',
});

type Props = {
    drivers: { id: string; lat: number; lng: number }[];
    dropOffs: { id: number; lat: number; lng: number; label: string }[];
};

export default function MapLeaflet({ drivers, dropOffs }: Props) {
    const driverIcon = new L.Icon({
        iconUrl: "/car.png",
        iconSize: [35, 40],
        iconAnchor: [17, 40],
        popupAnchor: [0, -40],
    });

    const orderedIcons = [
        new L.Icon({ iconUrl: "/locations/1.png", iconSize: [40, 40], iconAnchor: [15, 40], popupAnchor: [0, -40] }),
        new L.Icon({ iconUrl: "/locations/2.png", iconSize: [40, 40], iconAnchor: [15, 40], popupAnchor: [0, -40] }),
        new L.Icon({ iconUrl: "/locations/3.png", iconSize: [40, 40], iconAnchor: [15, 40], popupAnchor: [0, -40] }),
        new L.Icon({ iconUrl: "/locations/5.png", iconSize: [40, 40], iconAnchor: [15, 40], popupAnchor: [0, -40] }),
        new L.Icon({ iconUrl: "/locations/6.png", iconSize: [40, 40], iconAnchor: [15, 40], popupAnchor: [0, -40] }),
        new L.Icon({ iconUrl: "/locations/7.png", iconSize: [40, 40], iconAnchor: [15, 40], popupAnchor: [0, -40] }),
        new L.Icon({ iconUrl: "/locations/8.png", iconSize: [40, 40], iconAnchor: [15, 40], popupAnchor: [0, -40] }),
        new L.Icon({ iconUrl: "/locations/9.png", iconSize: [40, 40], iconAnchor: [15, 40], popupAnchor: [0, -40] }),
        // Add more icons as needed
    ];

    return (
        <MapContainer center={[-6.2, 106.8]} zoom={6} style={{ height: "75vh", width: "100%" }}>
            <TileLayer
                attribution='&copy; OpenStreetMap contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {dropOffs.map((drop, index) => {
                const icon = orderedIcons[index] || orderedIcons[orderedIcons.length - 1]; // fallback to last icon if out of range

                return (
                    <Marker
                        key={`drop-${drop.id}`}
                        position={[drop.lat, drop.lng]}
                        icon={icon}
                    >
                        <Popup>{drop.label}</Popup>
                    </Marker>
                );
            })}


            {drivers.map((driver) => (
                <Marker key={`driver-${driver.id}`} position={[driver.lat, driver.lng]} icon={driverIcon}>
                    <Popup>Driver {driver.id}</Popup>
                </Marker>
            ))}

            {drivers.map((driver) =>
                dropOffs.map((drop) => (
                    <RoutingMachine
                        key={`route-${driver.id}-${drop.id}`}
                        from={[driver.lat, driver.lng]}
                        to={[drop.lat, drop.lng]}
                    />
                ))
            )}
        </MapContainer>
    );
}
