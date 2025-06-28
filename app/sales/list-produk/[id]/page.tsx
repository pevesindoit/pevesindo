"use client";

import { useEffect, useState } from "react";
import { getDetailProduct, getProducts, searchProducts } from "@/app/fetch/get/fetch";
import { IPengantaran } from "@/types/pengantaran.type";
import Input from "@/app/component/input";
import Button from "@/app/component/Button";
import { useParams, useRouter } from "next/navigation";

export default function Page() {
    const [data, setData] = useState<any>([]);
    const params = useParams();
    const [id, setId] = useState<any>(params.id)
    const [detailWareHouse, setDetailWareHouse] = useState<any>([])

    const route = useRouter()

    // ✅ Fetch data setiap perubahan halaman
    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await getDetailProduct(id);
                const items = res?.data?.data?.d ?? [];
                setData(items);
                setDetailWareHouse(items.detailWarehouseData)
            } catch (error) {
                console.error("Gagal mengambil data:", error);
            }
        };

        fetchData();
    }, [id]);

    const back = () => {
        route.push("/sales/list-produk")
    }

    return (
        <div className="py-8">
            <div className="w-full flex justify-center">
                <div className="bg-white rounded-lg border border-[#E3E7EC] text-sm py-8 w-[95%] px-8 space-y-8">
                    <Button onClick={back}>Kembali</Button>
                    <h1 className="text-2xl font-semibold">Detail Produk</h1>
                    <p>Jumlah Barang: {data?.availableToSellInAllUnit
                    }</p>
                    {
                        detailWareHouse.map((item: any, index: any) => (
                            <div className="flex flex-col justify-between py-[2rem] px-[2rem] rounded-md border" key={index}>
                                <div className="w-full space-y-[1rem]">
                                    <div className="flex flex-col w-[50%] space-x-[1rem]">
                                        <p>{item.name
                                        }</p>
                                        <p>{item.balanceUnit
                                        }</p>
                                    </div>
                                </div>
                            </div>
                        ))
                    }
                </div>
            </div>
        </div>
    );
}
