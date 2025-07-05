"use client";

import Button from "@/app/component/Button";
import DropDown from "@/app/component/DropDown";
import Input from "@/app/component/input";
import { getDriver, getSyncMutation } from "@/app/fetch/get/fetch";
import { getFormattedDate } from "@/app/function/dateFormater";
import supabase from "@/lib/db";
import { IMutasi } from "@/types/mutasi.type";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Page() {
    const [ordered, setOrdered] = useState<IMutasi[]>([]);
    const [page, setPage] = useState(1);
    const [cabang, setCabang] = useState<string | null>(() => {
        if (typeof window !== "undefined") {
            return localStorage.getItem("cabang");
        }
        return null;
    });
    const [driver, setDriver] = useState<{ [key: number]: string }>({})
    const [loading, setLoading] = useState<{ [key: number]: boolean }>({});
    const [activeDriverButtons, setActiveDriverButtons] = useState<{ [key: string]: boolean }>({});
    const [driverLis, setDriverList] = useState<any>([])
    const itemsPerPage = 100;
    const route = useRouter()
    const path = usePathname()

    useEffect(() => {
        const data = {
            "page": 1,
            "cabang": cabang
        }
        const fetch = async () => {
            try {
                const res = await getSyncMutation(data)
                console.log(res)
            } catch {

            }
        }
        fetch()
    }, [cabang])

    const changePage = (e: any) => {
        if (e === "pengantaran") {
            route.push("/atur-pengantaran/")
        }
    }

    useEffect(() => {
        const res = getDriver()
        console.log(res)
    })

    const fetchOrdered = async () => {
        const from = (page - 1) * itemsPerPage;
        const to = from + itemsPerPage - 1;

        // const formattedDate = new Date().toISOString().split("T")[0];
        const today = getFormattedDate();

        const { data, error } = await supabase
            .from("mutasi")
            .select("*")
            .or(`sumber_mutasi.eq.${cabang},tujuan_mutasi.eq.${cabang}`)
            .is("status_terima", null) // ← this fixes the null comparison
            .range(from, to);

        if (error) console.error("Fetch error:", error);
        else setOrdered(data || []);
    };

    useEffect(() => {
        if (cabang !== null) {
            fetchOrdered()
        }
    }, [cabang, page])

    const handleChange = (id: number, value: string) => {
        console.log("Driver updated:", value);
        setDriver((prev) => ({ ...prev, [id]: value }));
    };

    const saveDriver = async (id: number) => {
        if (activeDriverButtons) {
            const { data: mutationData, error: mutationError } = await supabase
                .from("mutasi")
                .select()
                .eq("id", id)

            console.log(mutationData)

            const mutation = mutationData?.[0]

            const { data: maxOrder } = await supabase
                .from("surat_jalan")
                .select("order_id")
                .order("order_id", { ascending: false })
                .limit(1)
                .maybeSingle();

            const nextOrderId = (maxOrder?.order_id || 0) + 1;

            console.log(driver[id])
            console.log(id)

            const payload = {
                // id_so: mutation.id_mutasi || null,
                customer_name: mutation.tujuan_mutasi,
                so_number: mutation.number,
                tanggal_pengantaran: mutation.tanggal_transfer,
                status: "Belum Loading",
                alamat: `${mutation.tujuan_mutasi}`,
                driver: driver[id],
                order_id: nextOrderId,
                cabang: mutation.sumber_mutasi,
                is_mutation: true
            };

            const { data: insertedSJ, error: sjError } = await supabase
                .from("surat_jalan")
                .insert([payload])
                .select();

            if (sjError || !insertedSJ?.[0]?.id) {
                console.error("❌ Gagal insert surat jalan:", sjError);
                return; // stop jika insert surat_jalan gagal
            }

            const suratJalanId = insertedSJ[0].id;

            const productPayloads = {
                id_pengantaran: suratJalanId,
                nama_barang: mutation.detail_name,
                kode_barang: mutation.detail_name || null,
                jumlah_item: mutation.quantity || 0,
                ket_nama: mutation.detail_item || null,
                tanggal_pengantaran: mutation.tanggal_transfer || null
            };

            const { error: productError } = await supabase
                .from("products")
                .insert(productPayloads);

            if (productError) {
                console.error("❌ Gagal insert product:", productError);
            }
        }

        setLoading((prev) => ({ ...prev, [id]: true }));
        const newDriver = driver[id] || "";
        try {
            const { data, error } = await supabase
                .from("mutasi")
                .update({ driver: newDriver })
                .eq("id", id)
                .select();

            if (error) {
                console.error("❌ Failed to update link:", error);
            } else {
                console.log("✅ Updated:", data);
            }
        } catch (error) {
            console.error("❌ Error:", error);
        } finally {
            setLoading((prev) => ({ ...prev, [id]: false }));
        }
    };

    useEffect(() => {
        const handleRealtimeChange = () => {
            fetchOrdered(); // ✅ Call it inside the callback
        };

        const channel = supabase
            .channel("pengantaran-updates")
            .on(
                "postgres_changes",
                {
                    event: "UPDATE",
                    schema: "public",
                    table: "mutasi",
                },
                handleRealtimeChange
            )
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "mutasi",
                },
                handleRealtimeChange
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [page, cabang]);

    const getMutation = async (id: any, status: any) => {
        const newStatus = status;
        console.log(newStatus, "ini statusnya")
        try {
            const { data, error } = await supabase
                .from("mutasi")
                .update({ status_terima: newStatus })
                .eq("id", id)
                .select();

            if (error) {
                console.error("❌ Failed to update link:", error);
            } else {
                console.log("✅ Updated:", data);
            }
        } catch (error) {

        } finally {
            console.log("finaly")
        }
    }

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

    const changeDriver = (id: string) => {
        setActiveDriverButtons((prev) => ({
            ...prev,
            [id]: !prev[id],
        }));
    };


    return (
        <div className="py-[2rem]">
            <div className="w-full flex justify-center px-[1rem] z-0">
                <div className="w-[95%]">
                    <div className="flex">
                        <button onClick={() => changePage("pengantaran")} className={`cursor-pointer px-[1rem] py-[.5rem] bg-green-600 text-white rounded-t-md transform translate-y-7 hover:-translate-y-[-.2rem] transition-all duration-400`}>
                            Pengantaran
                        </button>
                        <button className={`cursor-pointer px-[1rem] py-[.5rem] border-gray-200 border-x-[1px] border-t-[1px] ${path === "/atur-pengantaran/mutasi" ? "bg-yellow-400 text-white rounded-t-md" : ""}`}>
                            Mutasi
                        </button>
                    </div>
                </div>
            </div>
            <div className="w-full justify-center flex">
                <div className="z-100 bg-white rounded-[10px] border border-[#E3E7EC] text-[.6rem] py-[2rem] w-[95%] px-[2rem] space-y-[2rem]">
                    <div className="space-y-[1rem]">
                        <h1 className="text-[1rem]">
                            Mutasi Barang
                        </h1>
                        <div className="grid md:grid-cols-2 gap-[1rem]">
                            {
                                ordered.map((item: any, index) => (
                                    <div key={index} className="w-full md:py-[1rem] md:px-[2.5rem] px-[1rem] space-y-1 md:text-[.8rem] border rounded-md">
                                        <div className="grid grid-cols-[25%_2%_1fr] items-start gap-y-1 py-[1rem] ">
                                            <p>Sirat Jalan</p>
                                            <p>:</p>
                                            <p>{item.number}</p>

                                            <p>Asal Barang</p>
                                            <p>:</p>
                                            <p>{item.sumber_mutasi}</p>

                                            <p>Ditransfer Ke</p>
                                            <p>:</p>
                                            <p>{item.tujuan_mutasi}</p>

                                            <p>Kode Barang</p>
                                            <p>:</p>
                                            <p>{item.detail_name}</p>
                                            <p>Tanggal Mutasi</p>
                                            <p>:</p>
                                            <p>{item.tanggal_transfer}</p>

                                            <p>Jumlah Barang</p>
                                            <p>:</p>
                                            {item.detail_item === "0 Batang" || item.detail_item === "0 Lembar" || item.detail_item !== "0 PCS" ? (
                                                <p>{item?.quantity}</p>
                                            ) : (
                                                <p>{item.detail_item}</p>
                                            )}


                                            <p>{item.driver && "Driver"}</p>
                                            <p>{item.driver && ":"}</p>
                                            <p>{item.driver && item.driver}</p>

                                            <div className={`flex w-full justify-start ${item.driver ? "hidden" : ""}`}>
                                                <button
                                                    onClick={() => changeDriver(item.id)}
                                                    className={`w-14 h-8 flex items-center rounded-full p-1 transition-colors duration-300 ${!activeDriverButtons[item.id] ? "bg-black" : "bg-gray-300"
                                                        }`}
                                                >
                                                    <div
                                                        className={`bg-white w-6 h-6 rounded-full shadow-md transform transition-transform duration-300 ${!activeDriverButtons[item.id] ? "translate-x-6" : "translate-x-0"
                                                            }`}
                                                    />
                                                </button>
                                            </div>
                                            {/* <Button
                                                className={`${!activeDriverButtons[item.id] ? "bg-gray-400" : ""}`}
                                                onClick={() => changeDriver(item.id)}
                                            >
                                                Diantar Driver
                                            </Button> */}
                                        </div>
                                        {
                                            !item.driver && item.tujuan_mutasi !== cabang && (
                                                <div className="w-full grid grid-cols-1 gap-[.5rem]">
                                                    <div>
                                                        {activeDriverButtons[item.id] ? (
                                                            <DropDown
                                                                label="Driver"
                                                                value={driver[item.id] || ""}
                                                                onChange={(e: any) => handleChange(item.id, e.target.value)}
                                                                options={driverLis}
                                                            />
                                                        ) : (
                                                            <Input
                                                                label="Pengirim"
                                                                onChange={(e: any) => handleChange(item.id, e.target.value)}
                                                                value={driver[item.id] || ""}
                                                                name="driver"
                                                            />
                                                        )}
                                                    </div>
                                                    <Button onClick={() => saveDriver(item.id)} loading={!!loading[item.id]}>Simpan</Button>
                                                </div>
                                            )
                                        }
                                        {
                                            !item.status_terima && item.tujuan_mutasi === cabang && (
                                                <Button onClick={() => getMutation(item.id, "Selesai Pengantaran")}>Mutasi Diterima</Button>
                                            )
                                        }
                                    </div>
                                ))
                            }
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}