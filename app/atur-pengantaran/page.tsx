"use client";
import { useEffect, useState } from "react";
import supabase from '@/lib/db';
import { IPengantaran } from "@/types/pengantaran.type";
import {
    DndContext,
    closestCenter,
    PointerSensor,
    TouchSensor,
    MouseSensor,
    useSensor,
    useSensors,
} from "@dnd-kit/core";
import {
    SortableContext,
    verticalListSortingStrategy,
    arrayMove,
} from "@dnd-kit/sortable"; // Adjust path if needed
import SortableItem from "../component/sortable/SortableItem";
import { getSync, getSyncReturn } from "../fetch/get/fetch";
import { usePathname, useRouter } from "next/navigation";
import Button from "../component/Button";
import LoadingTemplate from "../component/loading/loadingTemplate";

export default function Page() {
    const [ordered, setOrdered] = useState<IPengantaran[]>([]);
    const [page, setPage] = useState(1);
    const [driver, setDriver] = useState("atur")
    const itemsPerPage = 100;
    const [cabang, setCabang] = useState<string | null>(() => {
        if (typeof window !== "undefined") {
            return localStorage.getItem("cabang");
        }
        return null;
    });
    const path = usePathname()
    const route = useRouter()

    useEffect(() => {
        const userCabang = localStorage.getItem("cabang")
        if (userCabang) {
            setCabang(userCabang)
        }
    }, [setCabang])


    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5,
            },
        }),
        useSensor(TouchSensor, {
            activationConstraint: {
                delay: 150,            // long‑press start on touch (ms)
                tolerance: 5,
            },
        }),
        useSensor(MouseSensor)
    );



    useEffect(() => {
        const data = {
            "page": 1,
            "cabang": cabang
        }
        const fetch = async () => {
            try {
                const res = await getSync(data)
                await getSyncReturn(data)
                console.log(res)
            } catch {

            }
        }
        fetch()
    }, [cabang])

    const handleChangeDriver = (driverValue: string) => {
        console.log(driverValue);
        setDriver(driverValue);
        fetchOrdered(driverValue); // pakai parameter langsung
    };

    const fetchOrdered = async (selectedDriver: string) => {
        const from = (page - 1) * itemsPerPage;
        const to = from + itemsPerPage - 1;

        setDriver(selectedDriver)

        const formattedDate = new Date().toISOString().split("T")[0];
        const today = formattedDate.split("-").reverse().join("/");

        if (selectedDriver === "ambil sendiri") {
            const { data, error } = await supabase
                .from("surat_jalan")
                .select(`*, products(
                id,
                nama_barang,
                kode_barang,
                jumlah_item,
                ket_nama
            )`)
                // .eq("tanggal_pengantaran", today)
                .eq("cabang", cabang)
                .neq("status", "Selesai Pengantaran")
                .eq("driver", "Ambil Sendiri")
                .order("order_id", { ascending: true })
                .range(from, to);
            console.log("ini datanya", data);
            if (error) console.error("Fetch error:", error);
            else setOrdered(data || []);
        } else if (selectedDriver === "atur") {
            const { data, error } = await supabase
                .from("surat_jalan")
                .select(`*, products(
                id,
                nama_barang,
                kode_barang,
                jumlah_item,
                ket_nama
            )`)
                // .eq("tanggal_pengantaran", today)
                .eq("cabang", cabang)
                .neq("status", "Selesai Pengantaran")
                .neq("driver", "Ambil Sendiri")
                .order("order_id", { ascending: true })
                .range(from, to);
            console.log("ini datanya", data);
            if (error) console.error("Fetch error:", error);
            else setOrdered(data || []);
        }
    };
    console.log("ommaleka")

    useEffect(() => {
        if (cabang !== null && driver) {
            fetchOrdered(driver); // ✅ kirim driver sebagai parameter
        }
    }, [cabang, page, driver]);

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
                () => {
                    if (driver) fetchOrdered(driver); // ✅ pakai parameter
                }
            )
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "surat_jalan",
                },
                () => {
                    if (driver) fetchOrdered(driver); // ✅ pakai parameter
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [driver, page]); // ✅ tambahkan `driver` sebagai dependency juga


    const handleDragEnd = async (event: any) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const oldIndex = ordered.findIndex((item) => item.id === active.id);
        const newIndex = ordered.findIndex((item) => item.id === over.id);

        const newData = arrayMove(ordered, oldIndex, newIndex);
        setOrdered(newData);

        const updates = newData.map((item, idx) => ({
            id: item.id,
            order_id: idx + 1,
        }));

        const { error } = await supabase.from("surat_jalan").upsert(updates, {
            onConflict: "id",
        });

        if (error) {
            console.error("Failed to update order_id in Supabase:", error);
        }
    };

    const changePage = (e: any) => {
        if (e === "mutasi") {
            route.push("/atur-pengantaran/mutasi")
        }
    }

    console.log(cabang, "ini cabangnya")

    return (
        <div className="py-[2rem]">
            <div className="">
                <div className="w-full flex md:justify-center px-[1rem]">
                    <div className="w-[95%]">
                        <div className="flex">
                            <div className={`cursor-pointer px-[1rem] py-[.5rem] ${path === "/atur-pengantaran" ? "bg-green-600 text-white rounded-t-md" : ""}`}>
                                pengantaran
                            </div>
                            <button onClick={() => changePage("mutasi")} className="cursor-pointer px-[1rem] py-[.5rem] border-x-[1px] border-t-[1px] transform translate-y-7 hover:-translate-y-[-.2rem] transition-all duration-400 bg-yellow-400 text-white rounded-t-md">
                                Mutasi
                            </button>
                        </div>
                    </div>
                </div>
                <div className="md:w-full justify-center flex">
                    <div className="z-100 bg-white rounded-[10px] border border-[#E3E7EC] text-[.6rem] py-[1rem] w-[95%] md:px-[2rem] px-[1rem]">
                        <div>
                            <h1 className="text-[1rem]">
                                Atur Pengantaran
                            </h1>
                            <div className="w-full py-[1rem] space-x-[1rem]">
                                <button className={`cursor-pointer py-[1rem] px-[1rem]  rounded-md ${driver === "atur" ? "bg-black text-white" : "bg-gray-200 text-black"}`} onClick={() => handleChangeDriver("atur")}>Atur</button>
                                <button className={`cursor-pointer py-[1rem] px-[1rem]  rounded-md ${driver === "ambil sendiri" ? "bg-black text-white" : "bg-gray-200 text-black"}`} onClick={() => handleChangeDriver("ambil sendiri")}>Ambil Sendiri</button>
                            </div>
                        </div>
                        <div className="space-y-[2rem] w-[85%] md:w-full">
                            <DndContext
                                sensors={sensors}
                                collisionDetection={closestCenter}
                                onDragEnd={handleDragEnd}
                            >
                                <SortableContext
                                    items={ordered.map((item) => item.id)}
                                    strategy={verticalListSortingStrategy}
                                >
                                    {ordered.map((item, index) => (
                                        <SortableItem key={item.id} item={item} index={index} />
                                    ))}
                                </SortableContext>
                            </DndContext>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
