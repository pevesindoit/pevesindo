"use client";
import { useEffect, useState } from "react";
import supabase from '@/lib/db';
import { IPengantaran } from "@/types/pengantaran.type";
import {
    DndContext,
    closestCenter,
    PointerSensor,
    useSensor,
    useSensors,
} from "@dnd-kit/core";
import {
    SortableContext,
    verticalListSortingStrategy,
    arrayMove,
} from "@dnd-kit/sortable"; // Adjust path if needed
import SortableItem from "../component/sortable/SortableItem";

export default function Page() {
    const [ordered, setOrdered] = useState<IPengantaran[]>([]);
    const [page, setPage] = useState(1);
    const itemsPerPage = 5;
    const [cabang, setCabang] = useState<string | null>(() => {
        if (typeof window !== "undefined") {
            return localStorage.getItem("cabang");
        }
        return null;
    });

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
        })
    );

    const fetchOrdered = async () => {
        const from = (page - 1) * itemsPerPage;
        const to = from + itemsPerPage - 1;

        const today = new Date().toISOString().split("T")[0];

        const { data, error } = await supabase
            .from("pengantaran")
            .select("*")
            .eq("tanggal_pengantaran", today)
            .eq("cabang", cabang)
            .order("order_id", { ascending: true })
            .range(from, to);

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
                    table: "pengantaran",
                },
                () => {
                    fetchOrdered();
                }
            ).on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "pengantaran",
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

        const { error } = await supabase.from("pengantaran").upsert(updates, {
            onConflict: "id",
        });

        if (error) {
            console.error("Failed to update order_id in Supabase:", error);
        }
    };

    return (
        <div className="py-[2rem]">
            <div className="py-[2rem]">
                <div className="w-full justify-center flex">
                    <div>asdads</div>
                    <div className="bg-white rounded-[10px] border border-[#E3E7EC] text-[.6rem] py-[2rem] w-[95%] px-[2rem] space-y-[2rem]">
                        <div>
                            <h1 className="text-[1rem]">
                                Atur Pengantaran
                            </h1>
                        </div>
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
    );
}
