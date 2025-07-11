import supabase from "@/lib/db";
import { IPengantaranType } from "@/types/pengantaranType.type";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import React, { useEffect, useState } from "react";

const SortableItem = ({ item, index }: { item: any; index: number }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [detail, setDetail] = useState<any>([])
    const [loading, setLoading] = useState(false)
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: item.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 999 : "auto",
    };

    const handleCardClick = () => {
        if (isDragging) return;      // ignore click after drag
        setIsOpen((o) => !o);
    };
    useEffect(() => {
        setDetail(item.products)
    }, [item])

    const handleStatusProgress = async (item: IPengantaranType) => {
        try {
            setLoading(true)
            const { error } = await supabase
                .from("surat_jalan")
                .update({ status: "Selesai Pengantaran" })
                .eq("id", item.id);

            if (error) {
                console.error("❌ Failed to update status:", error);
            }
        } catch (error) {
            console.log(error)
        } finally {
            setLoading(false)
        }
    };


    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}            // ✅ keep accessibility props
            onClick={handleCardClick}  // ✅ use the guarded click
            className={`touch-none tap-transparent transition-all duration-300 ease-out
                  rounded-md border bg-white shadow w-full py-[1rem] px-[1rem] space-y-[.5rem]
                  ${isDragging ? "scale-[1.02] shadow-lg" : ""}`}
        >
            {/* === DRAG HANDLE ================================= */}
            <button
                {...listeners}           // ✅ drag starts here, not on wrapper
                className="mr-2 cursor-grab active:cursor-grabbing select-none"
                onClick={(e) => e.stopPropagation()} // don’t toggle when tapping handle
            >
                Pindahkan
            </button>
            <div className="w-full">
                <div className="flex space-y-[1rem] w-full">
                    {/* <h2 className="text-[1rem] font-bold">Nomor SO: {item.so_number}</h2> */}
                    <div className="flex justify-between items-center w-full">
                        <h2 className="text-[1rem] font-bold">{item.driver === "Ambil Sendiri"
                            ? "Pengambilan"
                            : `${item.is_mutation ? "Mutasi" : "Pengantaran"}`}
                        </h2>
                        <span
                            className={`transition-transform duration-200 ${isOpen ? "rotate-180" : "rotate-0"
                                }`}
                        >
                            <img src="/drop.png" alt="" className="w-[1rem]" />
                        </span>
                    </div>
                    <div
                        className={`transition-all duration-300 ease-out transform ${item.status_pengantaran === "Selesai Pengantaran"
                            ? "opacity-100 scale-100 py-[.3rem]"
                            : "opacity-0 scale-0 h-0 overflow-hidden"
                            }`}
                    >
                        <img src="correct.png" alt="" className="w-[1rem]" />
                    </div>
                </div>

                <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isOpen ? "max-h-[1000px] opacity-100 scale-100" : "max-h-0 opacity-0 scale-[0.98]"
                    }`}>
                    <div className="w-full md:p-2 p-[.1rem] space-y-1 md:text-[.8rem]">
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

                            <p>Status Pengantaran</p>
                            <p>:</p>
                            <p>{item.status}</p>
                            <p>Tanggal Pengantaran</p>
                            <p>:</p>
                            <p>{item.tanggal_pengantaran}</p>
                        </div>
                    </div>
                    <h1 className="text-[1rem] pt-[1rem]">Barang Yang Diantar</h1>
                    <div className="space-y-[1rem] pl-[2rem]]">
                        {
                            detail?.map((item: any, index: any) => (
                                <div className="grid grid-cols-[20%_2%_1fr] items-start gap-y-1 py-[1rem]" key={index} >
                                    <p>Nama Barang</p>
                                    <p>:</p>
                                    <p>{item.nama_barang}</p>

                                    <p>Kode Barang</p>
                                    <p>:</p>
                                    <p className="italic">{item.kode_barang}</p>

                                    <p>Jumlah Barang</p>
                                    <p>:</p>
                                    <p>{item.ket_nama}</p>
                                </div>
                            ))
                        }
                    </div>
                    <div className="w-full grid grid-cols-2 gap-[1rem]">
                        {item.driver === "Ambil Sendiri" && (
                            <button onClick={() => handleStatusProgress(item)} className="md:text-[.8rem] bg-black text-white rounded-md px-[1rem] py-[.5rem]">Sudah Diambil</button>
                        )}
                        {
                            item.maps && (
                                <a href={`${item.maps}`} target="_blank"
                                    rel="noopener noreferrer" className="md:text-[.8rem] bg-black text-white rounded-md px-[1rem] py-[.5rem] w-full text-center">Lihat Lokasi</a>
                            )
                        }
                    </div>
                </div>
            </div>
        </div >
    );
};

export default SortableItem;
