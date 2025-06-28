"use client";
import { useState, useEffect, useRef } from "react";

export default function DropDown(props: any) {
    const { label, value, onChange, name, className, options } = props;
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown if clicked outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setSearchTerm(""); // Clear search on close
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const filteredOptions = options.filter((opt: string) =>
        opt.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="relative w-full" ref={dropdownRef}>
            <label className="block mb-2 capitalize">{label}</label>
            <div
                onClick={() => setIsOpen(!isOpen)}
                className={`border rounded py-[.5rem] px-[.8rem] w-full cursor-pointer bg-white flex justify-between items-center ${className}`}
            >
                <span>{value || `Pilih ${label}`}</span>
                <span
                    className={`transition-transform duration-200 ${isOpen ? "rotate-180" : "rotate-0"
                        }`}
                >
                    <img src="/drop.png" alt="" className="w-[.5rem]" />
                </span>
            </div>

            {isOpen && (
                <div className="absolute z-10 mt-1 w-full max-h-[200px] overflow-y-auto border rounded bg-white shadow-md">
                    <input
                        type="text"
                        placeholder={`Cari ${label}...`}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full p-2 border-b outline-none text-[.5rem]"
                    />
                    {filteredOptions.length > 0 ? (
                        filteredOptions.map((opt: string, idx: number) => (
                            <div
                                key={idx}
                                onClick={() => {
                                    onChange({ target: { name: name || label, value: opt } });
                                    setIsOpen(false);
                                    setSearchTerm("");
                                }}
                                className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-[.5rem]"
                            >
                                {opt}
                            </div>
                        ))
                    ) : (
                        <div className="px-4 py-2 text-gray-400 text-sm">
                            Tidak ditemukan
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
