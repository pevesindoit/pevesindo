"use client"
import type { IMenu } from "@/types/menu.type";
import Image from "next/image";
import { useEffect, useState } from "react";
import supabase from '@/lib/db'
import DatePicker from "../component/DatePicker";
import Input from "../component/input";
import DropDown from "../component/DropDown";
import Button from "../component/Button";
import { IPengantaran } from "@/types/pengantaran.type";
import produk from "../data/produk";
import status from "../data/status";
import pengantaran from "../data/pengantaran";
import statusPengantaran from "../data/statusPengantaran";
import type from "../data/type";


export default function page() {
    const [data, setData] = useState<IPengantaran[]>([])
    const [ordered, setOrdered] = useState<IPengantaran[]>([])
    const [formData, setFormData] = useState({
        tanggal_nota: '',            // ISO date string
        tanggal_pengantaran: '',     // ISO date string
        bulan: '',                  // string instead of number for consistency
        custumer_name: '',
        no_sj: '',
        kode_barang: '',
        barang_keluar: 0,           // string to allow input field binding, convert to number later
        barang_masuk: 0,
        alamat: '',
        pengantaran: '',
        status_loading: 'Belum Loading',
        status_pengantaran: 'Belum Diantar',
        type_pengantaran: '',
        maps: '',
        keterangan: '',
    });
    const [page, setPage] = useState(1);
    const itemsPerPage = 5;
    const [editingCell, setEditingCell] = useState<{ id: number; field: keyof IPengantaran } | null>(null);
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
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

    useEffect(() => {
        if (cabang !== null) {
            fetchData()
        }
    }, [cabang, page])

    console.log(cabang)



    const fetchData = async () => {
        const from = (page - 1) * itemsPerPage;
        const to = from + itemsPerPage - 1;

        const { data, error } = await supabase
            .from("pengantaran")
            .select("*")
            .eq("cabang", cabang) // only get rows where cabang matches
            .order("id", { ascending: true })
            .range(from, to); // pagination

        if (error) console.log("error", error);
        else setData(data);
    };

    const fetchOrdered = async () => {
        const from = (page - 1) * itemsPerPage;
        const to = from + itemsPerPage - 1;

        console.log(from, "to", to)

        // const today = new Date().toISOString().split("T")[0];

        const { data, error } = await supabase
            .from("pengantaran")
            .select("*")
            .eq("cabang", cabang)
            .order("order_id", { ascending: true })
            .range(from, to); // pagination here

        if (error) console.log("error", error);
        else setOrdered(data);
    };

    const handleChange = (e: any) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        setFormData((prev) => ({ ...prev, "cabang": cabang }));
    }

    const addCustumer = async () => {
        try {
            const { data, error } = await supabase.from('pengantaran').insert([formData]).select();
            if (error) {
                console.log('Error adding pengantaran:', error);
            } else {
                alert('Pengantaran added!');
                if (data) {
                    setData((prev) => [...data, ...prev]);
                    setFormData({
                        tanggal_nota: formData.tanggal_nota,
                        tanggal_pengantaran: formData.tanggal_pengantaran,
                        bulan: formData.bulan,
                        custumer_name: '',
                        no_sj: '',
                        kode_barang: '',
                        barang_keluar: 0,
                        barang_masuk: 0,
                        alamat: '',
                        pengantaran: '',
                        status_loading: 'Belum Loading',
                        status_pengantaran: 'Belum Diantar',
                        type_pengantaran: '',
                        keterangan: '',
                        maps: '',
                    });
                }
            }
        } catch (error) {
            console.log(error);
        }

    }

    const handleLocalChange = (e: React.ChangeEvent<HTMLInputElement>, id: number, field: string) => {
        const updated = data.map(item =>
            item.id === id ? { ...item, [field]: e.target.value } : item
        );
        setData(updated);
    };

    const handleSaveEdit = async (id: number, field: keyof IPengantaran) => {
        const item = data.find(d => d.id === id);
        if (!item) return;

        try {
            const { error } = await supabase
                .from("pengantaran")
                .update({ [field]: item[field] })
                .eq("id", id);

            if (error) console.error("Update failed", error);
            setEditingCell(null); // close input
        } catch (err) {
            console.error("Unexpected error", err);
        }
    };

    useEffect(() => {
        fetchData();
        fetchOrdered();
    }, [page]);

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
                (payload) => {
                    console.log("Realtime update received:", payload);
                    fetchData(); // Refresh the data automatically
                    fetchOrdered(); // Refresh the data automatically
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel); // Cleanup
        };
    }, [page]); // Optional: include `page` if paging is dynamic

    const handleDragStart = (index: number) => {
        setDraggedIndex(index);
    };

    const handleDrop = async (index: number) => {
        if (draggedIndex === null || draggedIndex === index) return;

        const newData = [...ordered];
        const [movedItem] = newData.splice(draggedIndex, 1);
        newData.splice(index, 0, movedItem);
        setOrdered(newData);
        setDraggedIndex(null);

        // Update the order_id in Supabase
        const updates = newData.map((item, idx) => ({
            id: item.id,
            order_id: idx + 1, // or start from 0 if preferred
        }));

        try {
            const { error } = await supabase
                .from("pengantaran")
                .upsert(updates, { onConflict: "id" });

            if (error) {
                console.error("Failed to update order_id in Supabase:", error);
            }
        } catch (err) {
            console.error("Unexpected error updating order:", err);
        }
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
    };

    return (
        <div className="py-[2rem]">
            <div className="w-full justify-center flex">
                <div className="bg-white rounded-[10px] border border-[#E3E7EC] text-[.6rem] py-[2rem] w-[95%] px-[2rem] space-y-[2rem]">
                    <h1 className="text-[2rem]">
                        Tambah Pengantaran
                    </h1>
                    <div className="grid md:grid-cols-4 grid-cols-1 gap-[1rem]">
                        <DatePicker label="tanggal_nota" onChange={handleChange} value={formData.tanggal_nota} />
                        <DatePicker label="tanggal_pengantaran" onChange={handleChange} value={formData.tanggal_pengantaran} />
                        <Input label="bulan" onChange={handleChange} value={formData.bulan} name="bulan" />
                        <Input label="custumer_name" onChange={handleChange} value={formData.custumer_name} name="custumer_name" />
                        <Input label="no_sj" onChange={handleChange} value={formData.no_sj} name="no_sj" />
                        <DropDown
                            label="kode_barang"
                            value={formData.kode_barang}
                            onChange={handleChange}
                            options={produk}
                        />
                        <Input label="barang_keluar" onChange={handleChange} value={formData.barang_keluar} name="barang_keluar" />
                        <Input label="barang_masuk" onChange={handleChange} value={formData.barang_masuk} name="barang_masuk" />
                        <Input label="alamat" onChange={handleChange} value={formData.alamat} name="alamat" />
                        <DropDown
                            label="pengantaran"
                            value={formData.pengantaran}
                            onChange={handleChange}
                            options={pengantaran}
                        />
                        <DropDown
                            label="status_loading"
                            value={formData.status_loading}
                            onChange={handleChange}
                            options={status}
                        />
                        <DropDown
                            label="status_pengantaran"
                            value={formData.status_pengantaran}
                            onChange={handleChange}
                            options={statusPengantaran}
                        />
                        <DropDown
                            label="type_pengantaran"
                            value={formData.type_pengantaran}
                            onChange={handleChange}
                            options={type}
                        />
                        <Input label="maps" onChange={handleChange} value={formData.maps} name="maps" />
                        <Input label="keterangan" onChange={handleChange} value={formData.keterangan} name="keterangan" />
                    </div>
                    <Button onClick={addCustumer}>Tambah</Button>
                </div>
            </div>

            <div className="w-full flex justify-center pt-[4rem]">
                <div className="bg-white rounded-[10px] border border-[#E3E7EC] text-[.6rem] py-[2rem] w-[95%]">
                    <div className="w-full justify-center flex">
                        <div className="w-[95%] pb-[1.5rem]">
                            <h1 className="text-[2rem]">
                                Semua Pengantaran
                            </h1>

                        </div>
                    </div>


                    <div className="w-full overflow-x-scroll">
                        <table className="overflow-hidden">
                            <thead className="bg-[#F9FAFB] bg-opacity-[80%] border-t border-b border-[#E3E7EC] text-[#969696]">
                                <tr className="text-left">
                                    <th scope="col" className="px-4 py-2 whitespace-nowrap">No</th>
                                    <th scope="col" className="px-4 py-2 whitespace-nowrap">Tanggal Nota</th>
                                    <th scope="col" className="px-4 py-2 whitespace-nowrap">Tanggal Pengantaran</th>
                                    <th scope="col" className="px-4 py-2 whitespace-nowrap">Bulan</th>
                                    <th scope="col" className="px-4 py-2 whitespace-nowrap">Custumer Name</th>
                                    <th scope="col" className="px-4 py-2 whitespace-nowrap">No Sj</th>
                                    <th scope="col" className="px-4 py-2 whitespace-nowrap">Kode Barang</th>
                                    <th scope="col" className="px-4 py-2 whitespace-nowrap">Barang Keluar</th>
                                    <th scope="col" className="px-4 py-2 whitespace-nowrap">Barang Masuk</th>
                                    <th scope="col" className="px-4 py-2 whitespace-nowrap">Alamat</th>
                                    <th scope="col" className="px-4 py-2 whitespace-nowrap">Pengantaran</th>
                                    <th scope="col" className="px-4 py-2 whitespace-nowrap">Status Loading</th>
                                    <th scope="col" className="px-4 py-2 whitespace-nowrap">Status Pengantaran</th>
                                    <th scope="col" className="px-4 py-2 whitespace-nowrap">Keterangan</th>
                                    <th scope="col" className="px-4 py-2 whitespace-nowrap"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {
                                    data.map((item: any, index: any) => (
                                        <tr key={index} className="px-[2rem] ">
                                            <td scope="col" className="px-4 py-2 whitespace-nowrap">
                                                {(page - 1) * itemsPerPage + index + 1}
                                            </td>
                                            <td scope="col" className="px-4 py-2 whitespace-nowrap">{item.tanggal_nota}</td>
                                            <td scope="col" className="px-4 py-2 whitespace-nowrap">{item.tanggal_pengantaran}</td>
                                            <td scope="col" className="px-4 py-2 whitespace-nowrap">{item.bulan}</td>
                                            <td
                                                onDoubleClick={() => setEditingCell({ id: item.id, field: 'custumer_name' })}
                                            >
                                                {editingCell?.id === item.id && editingCell?.field === 'custumer_name' ? (
                                                    <input
                                                        type="text"
                                                        value={item.custumer_name}
                                                        onChange={(e) => handleLocalChange(e, item.id, 'custumer_name')}
                                                        onBlur={() => handleSaveEdit(item.id, 'custumer_name')}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') handleSaveEdit(item.id, 'custumer_name');
                                                        }}
                                                        autoFocus
                                                    />
                                                ) : (
                                                    item.custumer_name
                                                )}
                                            </td>
                                            <td
                                                onDoubleClick={() => setEditingCell({ id: item.id, field: 'no_sj' })}
                                            >
                                                {editingCell?.id === item.id && editingCell?.field === 'no_sj' ? (
                                                    <input
                                                        type="text"
                                                        value={item.no_sj}
                                                        onChange={(e) => handleLocalChange(e, item.id, 'no_sj')}
                                                        onBlur={() => handleSaveEdit(item.id, 'no_sj')}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') handleSaveEdit(item.id, 'no_sj');
                                                        }}
                                                        autoFocus
                                                    />
                                                ) : (
                                                    item.no_sj
                                                )}
                                            </td>
                                            <td onDoubleClick={() => setEditingCell({ id: item.id, field: 'kode_barang' })}>
                                                {editingCell?.id === item.id && editingCell?.field === 'kode_barang' ? (
                                                    <select
                                                        value={item.kode_barang}
                                                        onChange={(e: any) => handleLocalChange(e, item.id, 'kode_barang')}
                                                        onBlur={() => handleSaveEdit(item.id, 'kode_barang')}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') handleSaveEdit(item.id, 'kode_barang');
                                                        }}
                                                        autoFocus
                                                        className="border rounded px-4 py-2 whitespace-nowrap"
                                                    >
                                                        {produk.map((option) => (
                                                            <option key={option} value={option}>
                                                                {option}
                                                            </option>
                                                        ))}
                                                    </select>
                                                ) : (
                                                    <p className="text-center w-full">
                                                        {item.kode_barang}
                                                    </p>
                                                )}
                                            </td>
                                            <td className="text-center"
                                                onDoubleClick={() => setEditingCell({ id: item.id, field: 'barang_keluar' })}
                                            >
                                                {editingCell?.id === item.id && editingCell?.field === 'barang_keluar' ? (
                                                    <input
                                                        type="text"
                                                        value={item.barang_keluar}
                                                        onChange={(e) => handleLocalChange(e, item.id, 'barang_keluar')}
                                                        onBlur={() => handleSaveEdit(item.id, 'barang_keluar')}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') handleSaveEdit(item.id, 'barang_keluar');
                                                        }}
                                                        autoFocus
                                                    />
                                                ) : (
                                                    item.barang_keluar
                                                )}
                                            </td>
                                            <td
                                                className="text-center"
                                                onDoubleClick={() => setEditingCell({ id: item.id, field: 'barang_masuk' })}
                                            >
                                                {editingCell?.id === item.id && editingCell?.field === 'barang_masuk' ? (
                                                    <input
                                                        type="text"
                                                        value={item.barang_masuk}
                                                        onChange={(e) => handleLocalChange(e, item.id, 'barang_masuk')}
                                                        onBlur={() => handleSaveEdit(item.id, 'barang_masuk')}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') handleSaveEdit(item.id, 'barang_masuk');
                                                        }}
                                                        autoFocus
                                                    />
                                                ) : (
                                                    item.barang_masuk
                                                )}
                                            </td>
                                            <td
                                                onDoubleClick={() => setEditingCell({ id: item.id, field: 'alamat' })}
                                            >
                                                {editingCell?.id === item.id && editingCell?.field === 'alamat' ? (
                                                    <input
                                                        type="text"
                                                        value={item.alamat}
                                                        onChange={(e) => handleLocalChange(e, item.id, 'alamat')}
                                                        onBlur={() => handleSaveEdit(item.id, 'alamat')}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') handleSaveEdit(item.id, 'alamat');
                                                        }}
                                                        autoFocus
                                                    />
                                                ) : (
                                                    item.alamat
                                                )}
                                            </td>
                                            <td
                                                onDoubleClick={() => setEditingCell({ id: item.id, field: 'pengantaran' })}
                                            >
                                                {editingCell?.id === item.id && editingCell?.field === 'pengantaran' ? (
                                                    <input
                                                        type="text"
                                                        value={item.pengantaran}
                                                        onChange={(e) => handleLocalChange(e, item.id, 'pengantaran')}
                                                        onBlur={() => handleSaveEdit(item.id, 'pengantaran')}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') handleSaveEdit(item.id, 'pengantaran');
                                                        }}
                                                        autoFocus
                                                    />
                                                ) : (
                                                    item.pengantaran
                                                )}
                                            </td>
                                            <td onDoubleClick={() => setEditingCell({ id: item.id, field: 'status_loading' })}>
                                                {editingCell?.id === item.id && editingCell?.field === 'status_loading' ? (
                                                    <select
                                                        value={item.status_loading}
                                                        onChange={(e: any) => handleLocalChange(e, item.id, 'status_loading')}
                                                        onBlur={() => handleSaveEdit(item.id, 'status_loading')}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') handleSaveEdit(item.id, 'status_loading');
                                                        }}
                                                        autoFocus
                                                        className="border rounded px-2 py-1"
                                                    >
                                                        {status.map((option) => (
                                                            <option key={option} value={option}>
                                                                {option}
                                                            </option>
                                                        ))}
                                                    </select>
                                                ) : (
                                                    item.status_loading
                                                )}
                                            </td>

                                            <td
                                                onDoubleClick={() => setEditingCell({ id: item.id, field: 'status_pengantaran' })}
                                                className="px-3 py-2"
                                            >
                                                {editingCell?.id === item.id && editingCell?.field === 'status_pengantaran' ? (
                                                    <select
                                                        value={item.status_pengantaran}
                                                        onChange={(e: any) => handleLocalChange(e, item.id, 'status_pengantaran')}
                                                        onBlur={() => handleSaveEdit(item.id, 'status_pengantaran')}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') handleSaveEdit(item.id, 'status_pengantaran');
                                                        }}
                                                        autoFocus
                                                        className="border rounded px-2 py-1"
                                                    >
                                                        {statusPengantaran.map((option) => (
                                                            <option key={option} value={option}>
                                                                {option}
                                                            </option>
                                                        ))}
                                                    </select>
                                                ) : (
                                                    <div
                                                        className={`inline-block px-3 py-1 rounded-[10px] w-full ${item.status_pengantaran === "Selesai Pengantaran" ? "bg-green-600 text-white" : ""
                                                            }`}
                                                    >
                                                        {item.status_pengantaran || "Belum Diisi"}
                                                    </div>
                                                )}
                                            </td>
                                            <td
                                                onDoubleClick={() => setEditingCell({ id: item.id, field: 'keterangan' })}
                                            >
                                                {editingCell?.id === item.id && editingCell?.field === 'keterangan' ? (
                                                    <input
                                                        type="text"
                                                        value={item.keterangan}
                                                        onChange={(e) => handleLocalChange(e, item.id, 'keterangan')}
                                                        onBlur={() => handleSaveEdit(item.id, 'keterangan')}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') handleSaveEdit(item.id, 'keterangan');
                                                        }}
                                                        autoFocus
                                                    />
                                                ) : (
                                                    item.keterangan
                                                )}
                                            </td>
                                            <td scope="col" className="px-6 py-3"></td>

                                        </tr>
                                    ))
                                }
                            </tbody>
                        </table>
                    </div>
                    {/* pagination control */}
                    <div className="w-full flex justify-center py-[2rem]">
                        <div className="flex gap-2">
                            <button
                                className="px-3 py-1 border rounded"
                                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                                disabled={page === 1}
                            >
                                sebelumnya
                            </button>
                            <div className="w-full h-full flex justify-center items-center">
                                <span className="px-2">Page {page}</span>
                            </div>
                            <button
                                className="px-3 py-1 border rounded"
                                onClick={() => setPage((p) => p + 1)}
                            >
                                terus
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="py-[2rem]">
                <div className="w-full justify-center flex">
                    <div className="bg-white rounded-[10px] border border-[#E3E7EC] text-[.6rem] py-[2rem] w-[95%] px-[2rem] space-y-[2rem]">
                        {
                            ordered.map((item: any, index: any) => (
                                <div
                                    className="py-[2rem] px-[2rem] rounded-md border bg-white shadow flex space-x-[1rem]"
                                    key={item.id}
                                    draggable
                                    onDragStart={() => handleDragStart(index)}
                                    onDragOver={handleDragOver}
                                    onDrop={() => handleDrop(index)}
                                >
                                    <div>
                                        <div className="flex space-x-[.5rem]">
                                            <h2 className="text-[1rem] font-bold">Kode Barang: {item.kode_barang}</h2>
                                            <div
                                                className={`transition-all duration-300 ease-out transform ${item.status_pengantaran === "Selesai Pengantaran"
                                                    ? "opacity-100 scale-100 py-[.3rem]"
                                                    : "opacity-0 scale-0 h-0 overflow-hidden"
                                                    }`}
                                            >
                                                <img src="correct.png" alt="" className="w-[1rem]" />
                                            </div>
                                        </div>
                                        <p className="text-[.8rem]">Pengantar: {item.pengantaran}</p>
                                        <p className="text-[.8rem] italic">No Sj: {item.no_sj}</p>
                                        <p className="text-[.8rem]">Customer name: {item.custumer_name}</p>
                                        <p className="text-[.8rem]">Alamat: {item.alamat}</p>
                                        <p className="text-[.8rem]">Status Pengantaran: {item.status_pengantaran}</p>
                                    </div>
                                </div>
                            ))
                        }
                    </div>
                </div>
            </div>
        </div>
    );
}
