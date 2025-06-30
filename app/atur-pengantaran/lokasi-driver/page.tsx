'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { IPengantaran } from '@/types/pengantaran.type';
import supabase from '@/lib/db';
import { usePathname, useRouter } from 'next/navigation';
import { getLink } from '@/app/fetch/get/fetch';

const MapLeaflet = dynamic(() => import('../../component/MapLeaflet'), {
    ssr: false,
});

type DropOff = {
    id: number;
    lat: number;
    lng: number;
    label: string;
};

export default function Page() {
    const [drivers, setDrivers] = useState<{ id: string; lat: number; lng: number }[]>([]);
    const [dropOffs, setDropOffs] = useState<{ id: number; lat: number; lng: number; label: string }[]>([]);
    const [data, setData] = useState<any[]>([]);
    const [page, setPage] = useState(1);
    const itemsPerPage = 5;
    const [cabang, setCabang] = useState<string | null>(() => {
        if (typeof window !== "undefined") {
            return localStorage.getItem("cabang");
        }
        return null;
    });
    const [mockDropOffs, setMockDropOffs] = useState<DropOff[]>([]);
    const path = usePathname()
    const route = useRouter()

    useEffect(() => {
        const userCabang = localStorage.getItem("cabang")
        if (userCabang) {
            setCabang(userCabang)
        }
    }, [setCabang])

    const fetchData = async () => {
        const from = (page - 1) * itemsPerPage;
        const to = from + itemsPerPage - 1;

        const formattedDate = new Date().toISOString().split("T")[0];
        const today = formattedDate.split("-").reverse().join("/");

        const { data, error } = await supabase
            .from("surat_jalan")
            .select(`link_alamat, order_id, alamat`)
            // .eq("tanggal_pengantaran", today)
            .eq("cabang", cabang)
            .neq("status", "Selesai Pengantaran")
            .order("order_id", { ascending: true })
            .range(from, to);

        if (error) console.error("Fetch error", error);
        else setData(data || []);
    };

    useEffect(() => {
        const channel = supabase
            .channel("pengantaran-updates")
            .on(
                "postgres_changes",
                {
                    event: "UPDATE",
                    schema: "public",
                    table: "surat_jalan",
                },
                (payload) => {
                    console.log("Realtime update received:", payload);
                    fetchData();
                }
            )
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "surat_jalan",
                },
                (payload) => {
                    console.log("Realtime insert received:", payload);
                    fetchData();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [page]);

    useEffect(() => {
        if (cabang !== null) {
            fetchData();
        }
    }, [cabang, page]);

    useEffect(() => {
        const fetchLocations = async () => {
            try {
                const res = await fetch("/api/driver-location");
                const data = await res.json();
                setDrivers(data.locations || []);
            } catch (err) {
                console.error("Failed to fetch driver locations:", err);
            }
        };

        fetchLocations();
        const interval = setInterval(fetchLocations, 5000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        setDropOffs(mockDropOffs);
    }, [mockDropOffs]);

    // useEffect(() => {
    //     // Dummy geolocation fallback using hardcoded dropOffs
    //     const mockDropOffs = [
    //         { id: 3, lat: -5.123344, lng: 119.492241, label: "Drop at Pevesindo Baddoka" },
    //         { id: 4, lat: -5.171842, lng: 119.417389, label: "Drop at Barabarayya, Makassar" }
    //     ];
    //     setDropOffs(mockDropOffs);
    // }, [data]);

    const extractLatLngFromUrl = (url: string): { lat: number; lng: number } | null => {
        const match = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
        if (match) {
            return {
                lat: parseFloat(match[1]),
                lng: parseFloat(match[2]),
            };
        }
        return null;
    };

    useEffect(() => {
        const fetchLangtitude = async () => {
            try {
                const rawLinks = data;
                const dropOffs: DropOff[] = [];

                for (const item of rawLinks) {
                    if (!item.alamat) continue;

                    const res = await getLink({ url: item.alamat }); // Your geocode API call
                    console.log("inimi", res);

                    const coords = res?.data;
                    if (!coords?.lat || !coords?.lng) continue;

                    dropOffs.push({
                        id: item.order_id,
                        lat: coords.lat,
                        lng: coords.lng,
                        label: `Drop at Order ${item.order_id}`,
                    });
                }

                setMockDropOffs(dropOffs);
            } catch (error) {
                console.error("Error resolving links", error);
            }
        };

        if (data.length > 0) {
            fetchLangtitude();
        }
    }, [data]);


    const changePage = (e: any) => {
        if (e === "pengantaran") {
            route.push("/atur-pengantaran/")
        } else if (e === "mutasi") {
            route.push("/atur-pengantaran/mutasi")
        }
    }

    console.log(dropOffs)

    return (
        <div className="py-[2rem]">
            <div className="w-full flex justify-center px-[1rem] z-0">
                <div className="w-[95%]">
                    <div className="flex">
                        <button onClick={() => changePage("pengantaran")} className="cursor-pointer px-[1rem] py-[.5rem] border-gray-200 border-x-[1px] border-t-[1px] transform translate-y-7 hover:-translate-y-[-.2rem] transition-all duration-400 bg-green-600 text-white rounded-t-md">
                            Pengantaran
                        </button>
                        <button onClick={() => changePage("mutasi")} className="cursor-pointer px-[1rem] py-[.5rem] border-gray-200 border-x-[1px] border-t-[1px] transform translate-y-7 hover:-translate-y-[-.2rem] transition-all duration-400 bg-yellow-400 text-white rounded-t-md">
                            Mutasi
                        </button>
                        <button className="cursor-pointer px-[1rem] py-[.5rem] border-gray-200 border-x-[1px] border-t-[1px] transform bg-blue-600 text-white rounded-t-md">
                            Lokasi
                        </button>
                    </div>
                </div>
            </div>
            <div className="w-full justify-center flex ">
                <div className="z-10 bg-white rounded-[10px] border border-[#E3E7EC] text-[.6rem] py-[2rem] w-[95%] px-[2rem] space-y-[2rem]">
                    <h1 className="text-[1rem]">Lokasi Driver</h1>
                    <MapLeaflet drivers={drivers} dropOffs={dropOffs} />
                </div>
            </div>
        </div>
    );
}
