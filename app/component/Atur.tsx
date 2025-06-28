"use client"
import { closestCenter, DndContext, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove, SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useEffect, useState } from "react";
import { getSync } from "../fetch/get/fetch";
import { usePathname, useRouter } from "next/navigation";
import { IPengantaran } from "@/types/pengantaran.type";
import supabase from "@/lib/db";
import SortableItem from "./sortable/SortableItem";

export default function Atur() {
    const [ordered, setOrdered] = useState<IPengantaran[]>([]);
    const [page, setPage] = useState(1);
    const itemsPerPage = 100;

    const path = usePathname()
    const [cabang, setCabang] = useState<string | null>(() => {
        if (typeof window !== "undefined") {
            return localStorage.getItem("cabang");
        }
        return null;
    });
    const route = useRouter()
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5,
            },
        })
    );

    useEffect(() => {
        const data = {
            "page": 1,
            "cabang": cabang
        }
        const fetch = async () => {
            try {
                const res = await getSync(data)
                console.log(res)
            } catch {

            }
        }
        fetch()
    }, [cabang])

    const fetchOrdered = async () => {
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
                ket_nama
            )`)
            .eq("tanggal_pengantaran", today)
            .eq("cabang", cabang)
            // .neq("driver", "Ambil Sendiri")
            .order("order_id", { ascending: true })
            .range(from, to);

        console.log("ini datanya", data)

        if (error) console.error("Fetch error:", error);
        else setOrdered(data || []);
    };

    useEffect(() => {
        if (cabang !== null) {
            fetchOrdered()
        }
    }, [cabang, page])

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
                    fetchOrdered();
                }
            ).on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "surat_jalan",
                },
                () => {
                    fetchOrdered();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [page]);

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


    useEffect(() => {
        const userCabang = localStorage.getItem("cabang")
        if (userCabang) {
            setCabang(userCabang)
        }
    }, [setCabang])
    return (
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
    )

}