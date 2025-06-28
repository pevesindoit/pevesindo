"use client";

import supabase from "@/lib/db";
import { IPengantaranType } from "@/types/pengantaranType.type";
import { useEffect, useState } from "react";
import DateRanges from "../component/DateRanges";
import Button from "../component/Button";

type Summary = {
    kode_barang: string;
    total_barang_keluar: number;
    total_barang_masuk: number;
};

export default function Page() {
    const [data, setData] = useState<IPengantaranType[]>([]);
    const [summary, setSummary] = useState<Summary[]>([]);
    const [page, setPage] = useState(1);
    const [cabang, setCabang] = useState("")
    const [range, setRange] = useState({
        startDate: new Date(new Date().setDate(1)),
        endDate: new Date(),
    });

    const fetchData = async (startDate: Date, endDate: Date, cabang: string) => {
        const startOfDay = new Date(startDate);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(endDate);
        endOfDay.setHours(23, 59, 59, 999);

        const formatLocalDate = (date: Date): string => {
            const pad = (n: number) => n.toString().padStart(2, "0");
            const day = pad(date.getDate());
            const month = pad(date.getMonth() + 1);
            const year = date.getFullYear();
            return `${day}/${month}/${year}`;
        };

        const start = formatLocalDate(startOfDay);
        const end = formatLocalDate(endOfDay);

        const { data: suratData, error: suratError } = await supabase
            .from("surat_jalan")
            .select(`*, products(id, nama_barang, kode_barang, jumlah_item, ket_nama)`)
            .gte("tanggal_pengantaran", start)
            .lte("tanggal_pengantaran", end)
            .neq("status", "Selesai Pengantaran")
            .eq("cabang", cabang);

        const { data: mutasiData, error: mutasiError } = await supabase
            .from("mutasi")
            .select(`detail_name, quantity, sumber_mutasi, tujuan_mutasi`)
            .gte("tanggal_transfer", start)
            .lte("tanggal_transfer", end)
            .or(`sumber_mutasi.eq.${cabang},tujuan_mutasi.eq.${cabang}`);

        if (suratError || mutasiError) {
            console.error("Error fetching data", { suratError, mutasiError });
            return;
        }

        setData(suratData || []);
        const summaryMap: Record<string, Summary> = {};

        // ✅ Fix: Handle products as array
        (suratData || []).forEach((item: any) => {
            const products = Array.isArray(item.products) ? item.products : [item.products];

            products.forEach((product: any) => {
                const kode = product?.kode_barang;
                const jumlah = Number(product?.jumlah_item) || 0;

                if (!kode) return;

                if (!summaryMap[kode]) {
                    summaryMap[kode] = {
                        kode_barang: kode,
                        total_barang_keluar: 0,
                        total_barang_masuk: 0,
                    };
                }

                summaryMap[kode].total_barang_keluar += jumlah;
            });
        });

        (mutasiData || []).forEach((item: any) => {
            const kode = item.detail_name;
            const jumlah = Number(item.quantity) || 0;

            if (!kode) return;

            if (!summaryMap[kode]) {
                summaryMap[kode] = {
                    kode_barang: kode,
                    total_barang_keluar: 0,
                    total_barang_masuk: 0,
                };
            }

            if (item.sumber_mutasi === cabang) {
                summaryMap[kode].total_barang_keluar += jumlah;
            }

            if (item.tujuan_mutasi === cabang) {
                summaryMap[kode].total_barang_masuk += jumlah;
            }
        });

        setSummary(Object.values(summaryMap));
    };

    useEffect(() => {
        fetchData(range.startDate, range.endDate, cabang);
    }, [page, range]);

    const handleChangeBranch = (e: any) => {
        fetchData(range.startDate, range.endDate, e);
        setCabang(e)
    }

    return (
        <div className="py-8">
            <div className="w-full flex justify-center">
                <div className="bg-white rounded-lg border border-[#E3E7EC] text-sm py-8 w-[95%] px-8 space-y-8">
                    <DateRanges
                        label="Tanggal Nota"
                        value={range}
                        onChange={setRange}
                    />
                    <div className="grid md:grid-cols-6 grid-cols-3 gap-[.5rem]">
                        <Button
                            className={`hover:bg-black ${cabang === "PEVESINDO CABANG HERTASNING" ? "bg-black text-white" : "bg-gray-200 text-black"}`}
                            onClick={() => handleChangeBranch("PEVESINDO CABANG HERTASNING")}
                        >
                            Hertasning
                        </Button>

                        <Button
                            className={`hover:bg-black ${cabang === "PEVESINDO CABANG BADDOKA" ? "bg-black text-white" : "bg-gray-200 text-black"}`}
                            onClick={() => handleChangeBranch("PEVESINDO CABANG BADDOKA")}
                        >
                            Baddoka
                        </Button>

                        <Button
                            className={`hover:bg-black ${cabang === "PEVESINDO CABANG PARE-PARE" ? "bg-black text-white" : "bg-gray-200 text-black"}`}
                            onClick={() => handleChangeBranch("PEVESINDO CABANG PARE-PARE")}
                        >
                            Pare-pare
                        </Button>

                        <Button
                            className={`hover:bg-black ${cabang === "PEVESINDO CABANG BONE" ? "bg-black text-white" : "bg-gray-200 text-black"}`}
                            onClick={() => handleChangeBranch("PEVESINDO CABANG BONE")}
                        >
                            Bone
                        </Button>

                        <Button
                            className={`hover:bg-black ${cabang === "PEVESINDO CABANG JOGJA" ? "bg-black text-white" : "bg-gray-200 text-black"}`}
                            onClick={() => handleChangeBranch("PEVESINDO CABANG JOGJA")}
                        >
                            Jogja
                        </Button>

                        <Button
                            className={`hover:bg-black ${cabang === "PEVESINDO CABANG JENEPONTO" ? "bg-black text-white" : "bg-gray-200 text-black"}`}
                            onClick={() => handleChangeBranch("PEVESINDO CABANG JENEPONTO")}
                        >
                            Jeneponto
                        </Button>

                    </div>

                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b font-semibold">
                                <th className="text-left py-2">Kode Barang</th>
                                <th className="text-right py-2">Barang Keluar</th>
                                <th className="text-right py-2">Barang Masuk</th>
                            </tr>
                        </thead>
                        <tbody>
                            {summary
                                .filter(item =>
                                    item.total_barang_keluar > 0 ||
                                    item.total_barang_masuk > 0
                                )
                                .map((item, idx) => (
                                    <tr key={idx} className="border-b">
                                        <td className="py-2">{item.kode_barang || "-"}</td>
                                        <td className="py-2 text-right">{item.total_barang_keluar}</td>
                                        <td className="py-2 text-right">{item.total_barang_masuk}</td>
                                    </tr>
                                ))}
                            {summary.length > 0 && (
                                <tr className="border-t font-bold">
                                    <td className="py-2">Grand Total</td>
                                    <td className="py-2 text-right">
                                        {summary.reduce((acc, cur) => acc + cur.total_barang_keluar, 0)}
                                    </td>
                                    <td className="py-2 text-right">
                                        {summary.reduce((acc, cur) => acc + cur.total_barang_masuk, 0)}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
