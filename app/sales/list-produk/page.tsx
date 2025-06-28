"use client";

import { useEffect, useState } from "react";
import { getProducts, searchProducts } from "@/app/fetch/get/fetch";
import { IPengantaran } from "@/types/pengantaran.type";
import Input from "@/app/component/input";
import Button from "@/app/component/Button";
import { usePathname, useRouter } from "next/navigation";

export default function Page() {
    const [data, setData] = useState<any>([]);
    const [page, setPage] = useState<number>(1);
    const [search, setSearch] = useState("")
    const route = useRouter()

    // ✅ Fetch data setiap perubahan halaman
    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await getProducts(page);
                const items = res?.data?.data?.d ?? [];
                setData(items);
            } catch (error) {
                console.error("Gagal mengambil data:", error);
            }
        };

        fetchData();
    }, [page]);



    const path = usePathname()

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearch(e.target.value);
    };

    const handleSearch = async () => {
        try {
            const res = await searchProducts(search)
            setData(res?.data.data.d)
        } catch (error) {
            console.log(error)
        }
    }

    const handleDetail = (id: any) => {
        route.push(`list-produk/${id}`)
    }

    const changePage = (e: any) => {
        route.push("/sales")
    }

    return (
        <div className="py-8">
            <div className="w-full flex justify-center px-[1rem] z-0">
                <div className="w-[95%]">
                    <div className="flex">
                        <div onClick={changePage} className={`transform translate-y-7 hover:-translate-y-[-.2rem] transition-all duration-400 cursor-pointer px-[1rem] py-[.5rem] bg-green-600 rounded-t-md text-white`}>
                            Pengantaran
                        </div>
                        <button className={`cursor-pointer px-[1rem] py-[.5rem] border-x-[1px] border-t-[1px]   rounded-t-md ${path === "/sales/list-produk" ? " bg-yellow-400 text-white rounded-t-md" : ""}`}>
                            Produk
                        </button>
                    </div>
                </div>
            </div>
            <div className="w-full flex justify-center">
                <div className="z-50 bg-white rounded-lg border border-[#E3E7EC] text-sm py-8 w-[95%] px-8 space-y-8">
                    <h1 className="text-2xl font-semibold">Produk</h1>
                    <Input label="Cari Kode Barang" onChange={handleChange} value={search ?? ""} name="bulan" />
                    <Button onClick={handleSearch}>Cari Barang</Button>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {data.length > 0 ? (
                            data.map((item: any, index: any) => (
                                <button onClick={() => handleDetail(item.id)} key={index}
                                    className="cursor-pointer flex flex-col justify-between py-6 px-6 rounded-md border h-full"
                                >
                                    <div className="space-y-2">
                                        <p>Kode: {item.no}</p>
                                        <p>Jumlah: {item.quantity}</p>
                                    </div>
                                </button>
                            ))
                        ) : (
                            <p className="col-span-2 text-center text-gray-500">Tidak ada data</p>
                        )}
                    </div>

                    <div className="w-full flex justify-center pt-6">
                        <div className="flex gap-2 items-center">
                            <button
                                className="px-3 py-1 border rounded disabled:opacity-50"
                                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                                disabled={page === 1}
                            >
                                Sebelumnya
                            </button>
                            <span className="px-2">Halaman {page}</span>
                            <button
                                className="px-3 py-1 border rounded"
                                onClick={() => setPage((p) => p + 1)}
                            >
                                Berikutnya
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
