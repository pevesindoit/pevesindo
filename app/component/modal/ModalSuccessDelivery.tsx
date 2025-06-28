"use client";

import { useEffect } from "react";

interface ModalSuccessDeliveryProps {
    isOpen: boolean;
}

export default function ModalSuccessDelivery({
    isOpen,
}: ModalSuccessDeliveryProps) {

    console.log("terbuka", isOpen)
    return (
        <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 ${isOpen ? "" : "hidden"}`}>
            <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full text-center">
                <h2 className="text-lg font-semibold text-green-600 mb-2">Selamat!</h2>
                <p className="text-gray-700">Barang Berhasil Diantar</p>
            </div>
        </div>
    );
}
