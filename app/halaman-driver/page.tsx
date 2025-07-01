"use client";
import JSConfetti from 'js-confetti';
import supabase from "@/lib/db";
import { IPengantaran } from "@/types/pengantaran.type";
import { useEffect, useState } from "react";
import ModalSuccessDelivery from '../component/modal/ModalSuccessDelivery';
import DropDown from '../component/DropDown';
import { getDriver } from '../fetch/get/fetch';
import pengantaran from '../data/pengantaran';
import type from '../data/type';
import Button from '../component/Button';


export default function Page() {
    const [data, setData] = useState<IPengantaran[]>([]);
    const [page, setPage] = useState(1);
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const [modal, setModal] = useState(false)
    const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [driverId, setDriverId] = useState<string | null>(null); // or number if you store number

    useEffect(() => {
        const storedId = localStorage.getItem("id");
        setDriverId(storedId); // use parseInt(storedId || "") if it's a number
    }, []);


    console.log("id Driver", driverId)
    useEffect(() => {
        if (!navigator.geolocation || !driverId) {
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

    const itemsPerPage = 100;
    const [cabang, setCabang] = useState<string | null>(() => {
        if (typeof window !== "undefined") {
            return localStorage.getItem("cabang");
        }
        return null;
    });

    const [driverLis, setDriverList] = useState<any>([])
    const [pengantaran, setPengantaran] = useState("")

    const [status, setStatus] = useState<{ [id: string]: string }>({});


    useEffect(() => {
        const userCabang = localStorage.getItem("cabang")
        if (userCabang) {
            setCabang(userCabang)
        }
    }, [setCabang])

    // useEffect(() => {
    //     setTimeout(() => {
    //         setModal(false);
    //     }, 1000);
    // }, [])


    const fetchData = async () => {
        const from = (page - 1) * itemsPerPage;
        const to = from + itemsPerPage - 1;

        const formattedDate = new Date().toISOString().split("T")[0];
        const today = formattedDate.split("-").reverse().join("/");

        const { data, error } = await supabase
            .from("surat_jalan")
            .select(`*, products(
                id,
                nama_barang,
                kode_barang,
                jumlah_item,
                ket_nama)`)
            // .eq("tanggal_pengantaran", today)
            .eq("cabang", cabang)
            .neq("status", "Selesai Pengantaran")
            .neq("driver", "Ambil Sendiri")
            .order("order_id", { ascending: true })
            .range(from, to);

        console.log(data)

        if (error) console.error("Fetch error", error);
        else setData(data || []);
    };

    useEffect(() => {
        if (cabang !== null) {
            fetchData()
        }
    }, [cabang, page])

    // ✅ Realtime listener for auto-refresh
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
                    fetchData(); // Refresh on update
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
                    fetchData(); // Refresh on insert
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel); // Cleanup
        };
    }, [page]);
    // Optional: include `page` if paging is dynamic

    const handleStatusProgress = async (item: IPengantaran) => {
        const statusMap: Record<string, string> = {
            "Belum Loading": "Proses Loading",
            "Proses Loading": "Selesai Loading",
            "Selesai Loading": "Proses Pengantaran",
            "Proses Pengantaran": "Selesai Pengantaran",
        };

        const updatedValue = statusMap[item.status];
        if (!updatedValue) return;

        const jsConfetti = new JSConfetti();
        if (updatedValue === "Selesai Pengantaran") {
            // setModal(true)
            jsConfetti.addConfetti({
                confettiColors: ["#a855f7", "#3b0764", "#ef4444", "#ec4899", "#2563eb"],
            });
        }


        const { error } = await supabase
            .from("surat_jalan")
            .update({ status: updatedValue })
            .eq("id", item.id);

        if (error) {
            console.error("❌ Failed to update status:", error);
        }
    };

    const handleChange = (e: any) => {
        const { name, value } = e.target; // name = order.id
        setStatus((prev) => ({ ...prev, [name]: value }));
    };


    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await getDriver()
                console.log(res)
                if (res) {
                    setDriverList(res?.data.data)
                }
            } catch (error) {
                console.log(error)
            }
        }
        fetchData()
    }, [])

    const saveDelivaryStatus = async (e: any, id: any) => {
        try {
            const { data, error } = await supabase
                .from("surat_jalan")
                .update({ status_antar: e })
                .eq("id", id)
                .select();

            if (error) {
                console.error("❌ Failed to update link:", error);
            } else {
                console.log("✅ Updated:", data);
            }

        } catch (error) {
            console.log(error)
        } finally {

        }
    }


    return (
        <div className="py-[2rem]">
            <ModalSuccessDelivery isOpen={modal} />
            <div className="w-full justify-center flex">
                <div className="bg-white rounded-[10px] border border-[#E3E7EC] text-[.6rem] py-[2rem] w-[95%] px-[2rem] space-y-[2rem]">
                    <h1 className="text-[2rem]">Pengantaran</h1>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-[2rem]">
                        {data.map((item: any, index: any) => (
                            <div className="flex flex-col justify-between py-[2rem] px-[2rem] rounded-md border h-full" key={index}>
                                <div className="w-full space-y-[1rem]">
                                    <div className="flex flex-col w-[50%] space-x-[1rem]">
                                        {item.status && (
                                            <div>
                                                {/* Loading status */}
                                                {(item.status === "Belum Loading" || item.status === "Proses Loading") && (
                                                    <span className={`px-3 py-1 rounded-full text-white
          ${item.status === "Belum Loading" ? "bg-gray-500" : "bg-yellow-500"}`}>
                                                        {item.status}
                                                    </span>
                                                )}

                                                {/* Pengantaran status */}
                                                {(item.status === "Belum diantar" ||
                                                    item.status === "Selesai Loading" ||
                                                    item.status === "Proses Pengantaran" ||
                                                    item.status === "Selesai Pengantaran") && (
                                                        <span className={`px-3 py-1 rounded-full text-white
          ${item.status === "Belum diantar" ? "bg-red-500" :
                                                                item.status === "Selesai Loading" ? "bg-gray-500" :
                                                                    item.status === "Proses Pengantaran" ? "bg-yellow-500" :
                                                                        item.status === "Selesai Pengantaran" ? "bg-green-600" : ""}`}>
                                                            {item.status}
                                                        </span>
                                                    )}
                                            </div>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-[20%_2%_1fr] items-start gap-y-1">
                                        <p>Pengantar</p>
                                        <p>:</p>
                                        <p>{item.driver}</p>

                                        <p>No SJ</p>
                                        <p>:</p>
                                        <p className="italic">{item.so_number}</p>

                                        <p>Customer Name</p>
                                        <p>:</p>
                                        <p>{item.customer_name}</p>

                                        <p>Alamat</p>
                                        <p>:</p>
                                        <p>{item.alamat}</p>
                                    </div>
                                    <div className="grid grid-cols-1 gap-[1rem]">
                                        {
                                            item?.products.map((item: any, index: any) => (
                                                <div className="p-[1rem] rounded-[10px] border border-[#E3E7EC]" key={index}>
                                                    <p>
                                                        {item.nama_barang}
                                                    </p>
                                                    <p>
                                                        {item.kode_barang}
                                                    </p>
                                                    <p>
                                                        {item.ket_nama}
                                                    </p>
                                                </div>
                                            ))
                                        }
                                    </div>
                                    {
                                        item.status === "Proses Pengantaran" && !item.status_antar && (
                                            <div className='space-y-[1rem]'>
                                                <DropDown
                                                    key={item.id}
                                                    label="status pengantaran"
                                                    name={item.id} // use ID as name
                                                    value={status[item.id] || ""} // access by ID
                                                    onChange={handleChange}
                                                    options={type}
                                                />
                                                <Button onClick={() => saveDelivaryStatus(status[item.id], item.id)}>Simpan</Button>
                                            </div>
                                        )
                                    }
                                    <div className="py-[1rem]">
                                        {
                                            item.link_alamat && (
                                                <a href={`${item.link_alamat}`} target="_blank"
                                                    rel="noopener noreferrer" className="text-[.8rem] bg-black text-white rounded-full px-[1rem] py-[.5rem]">Lihat Lokasi</a>
                                            )
                                        }
                                    </div>
                                </div>

                                {item.status !== "Selesai Pengantaran" && (
                                    <button
                                        onClick={() => handleStatusProgress(item)}
                                        disabled={item.status === "Proses Pengantaran" && !item.status_antar}
                                        className={`mt-3 text-white text-sm w-full py-[2rem] rounded-lg transition-all 
    ${item.status === "Proses Pengantaran" && !item.status_antar
                                                ? "bg-gray-400 cursor-not-allowed"
                                                : "bg-blue-600 hover:bg-blue-700"}`}
                                    >
                                        {item.status === "Belum Loading"
                                            ? "Mulai Loading"
                                            : item.status === "Proses Loading"
                                                ? "Selesai Loading"
                                                : item.status === "Selesai Loading"
                                                    ? "Antar"
                                                    : item.status === "Proses Pengantaran"
                                                        ? "Selesai Antar"
                                                        : "Lanjut"}
                                    </button>
                                )}

                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div >
    );
}
