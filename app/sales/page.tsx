"use client";
import JSConfetti from 'js-confetti';
import supabase from "@/lib/db";
import { IPengantaran } from "@/types/pengantaran.type";
import { useEffect, useState } from "react";
import ModalSuccessDelivery from '../component/modal/ModalSuccessDelivery';
import Input from '../component/input';
import Button from '../component/Button';
import { usePathname, useRouter } from 'next/navigation';


export default function Page() {
    const [data, setData] = useState<IPengantaran[]>([]);
    const [page, setPage] = useState(1);
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const [modal, setModal] = useState(false)
    const itemsPerPage = 5;
    const [cabang, setCabang] = useState<string | null>(() => {
        if (typeof window !== "undefined") {
            return localStorage.getItem("cabang");
        }
        return null;
    });
    const [maps, setMaps] = useState({
        link_alamat: "",
    })
    const [links, setLinks] = useState<{ [key: number]: string }>({});

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
        console.log(today, cabang)

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
            .order("order_id", { ascending: true })
            .range(from, to);

        console.log(data)

        if (error) console.error("Fetch error", error);
        else setData(data || []);
    };
    console.log

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



    const handleChange = (id: number, value: string) => {
        setLinks((prev) => ({ ...prev, [id]: value }));
    };

    const saveLink = async (id: number) => {
        const newLink = links[id] || "";
        try {
            const { data, error } = await supabase
                .from("surat_jalan")
                .update({ link_alamat: newLink })
                .eq("id", id)
                .select();

            if (error) {
                console.error("❌ Failed to update link:", error);
            } else {
                console.log("✅ Updated:", data);
            }
        } catch (error) {
            console.error("❌ Error:", error);
        }
    };

    const changePage = (e: any) => {
        if (e === "list") {
            route.push("/sales/list-produk")
        } else if (e === "lokasi") {
            route.push("/sales/lokasi-driver")
        }
    }

    return (
        <div className="py-[2rem]">
            <ModalSuccessDelivery isOpen={modal} />
            <div className="w-full flex justify-center px-[1rem] z-0">
                <div className="w-[95%]">
                    <div className="flex">
                        <div className={`cursor-pointer px-[1rem] py-[.5rem] ${path === "/sales" ? "bg-green-600 text-white rounded-t-md" : ""}`}>
                            Pengantaran
                        </div>
                        <button onClick={() => changePage("list")} className="cursor-pointer px-[1rem] py-[.5rem] border-x-[1px] border-t-[1px] transform translate-y-7 hover:-translate-y-[-.2rem] transition-all duration-400 bg-yellow-400 text-white rounded-t-md">
                            Produk
                        </button>
                        <button onClick={() => changePage("lokasi")} className="cursor-pointer px-[1rem] py-[.5rem] border-x-[1px] border-t-[1px] transform translate-y-7 hover:-translate-y-[-.2rem] transition-all duration-400 bg-blue-400 text-white rounded-t-md">
                            Lokasi
                        </button>
                    </div>
                </div>
            </div>
            <div className="w-full justify-center flex ">
                <div className="z-50 bg-white rounded-[10px] border border-[#E3E7EC] text-[.6rem] py-[2rem] w-[95%] px-[2rem] space-y-[2rem]">
                    <h1 className="text-[2rem]">Input Lokasi</h1>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-[2rem]">
                        {data.map((item: any, index: number) => (
                            <div className="flex flex-col justify-between py-[2rem] px-[2rem] rounded-md border h-full" key={index}>
                                <div className="w-full space-y-[1rem]">
                                    <p className='font-bold text-[1rem]'>
                                        {item.customer_name?.charAt(0).toUpperCase() + item.customer_name?.slice(1)}
                                    </p>
                                    {
                                        item.link_alamat && (
                                            <p className='italic'>{item?.link_alamat}</p>
                                        )
                                    }
                                    <p>{item.alamat}</p>
                                    {
                                        !item.link_alamat && (
                                            <>
                                                <Input
                                                    label="Link Maps"
                                                    onChange={(e: any) => handleChange(item.id, e.target.value)}
                                                    value={links[item.id] || ""}
                                                    name="link_alamat"
                                                />
                                                <Button onClick={() => saveLink(item.id)}>Simpan</Button>
                                            </>
                                        )
                                    }
                                </div>
                            </div>
                        ))}

                    </div>
                </div>
            </div>
        </div >
    );
}
