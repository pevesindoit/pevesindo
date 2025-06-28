"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import supabase from "@/lib/db";
import Input from "../component/input";
import Button from "../component/Button";
import DropDown from "../component/DropDown";
import { getDriver } from "../fetch/get/fetch";
import typeUser from "../data/typeUser";

export default function Page() {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        cabang: '',
        type: '',
        nama: '',

    });
    const [driverLis, setDriverList] = useState<any>([])
    const [isDriver, setIsDriver] = useState(false)

    const router = useRouter();

    const handleChange = (e: any) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSignup = async () => {
        try {
            const { data, error } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password
            });

            if (error) {
                alert("Signup failed: " + error.message);
                return;
            }

            // Optional: Insert into 'profiles' table
            if (data.user) {
                const { error: profileError } = await supabase
                    .from('profiles')
                    .insert([
                        {
                            id: data.user.id,
                            cabang: formData.cabang,
                            type: formData.type,
                            nama: formData.nama
                        }
                    ]);

                if (profileError) {
                    console.error("Profile insert error:", profileError);
                    alert("User created, but failed to save profile.");
                    return;
                }

                alert("Signup successful!");
                // router.push("/login"); // or redirect to a dashboard
            }
        } catch (err) {
            console.error("Unexpected error:", err);
        }
    };

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

    return (
        <div className="py-[2rem]">
            <div className="w-full justify-center flex">
                <div className="bg-white rounded-[10px] border border-[#E3E7EC] text-[.6rem] py-[2rem] w-[40%] px-[2rem] space-y-[2rem]">
                    <h1 className="w-full text-[1rem] text-center font-bold">
                        Signup
                    </h1>
                    <Input
                        label="email"
                        name="email"
                        onChange={handleChange}
                        value={formData.email}
                    />
                    <Input
                        label="password"
                        name="password"
                        type="password"
                        onChange={handleChange}
                        value={formData.password}
                    />
                    <Input
                        label="cabang"
                        name="cabang"
                        onChange={handleChange}
                        value={formData.cabang}
                    />
                    <DropDown
                        label="type"
                        value={formData.type}
                        onChange={handleChange}
                        options={typeUser}
                    />
                    {
                        formData.type === "driver" ? (
                            <DropDown
                                label="nama"
                                value={formData.nama}
                                onChange={handleChange}
                                options={driverLis}
                            />
                        ) : (
                            <Input
                                label="nama"
                                name="nama"
                                onChange={handleChange}
                                value={formData.nama}
                            />
                        )
                    }
                    <Button onClick={handleSignup}>Signup</Button>
                </div>
            </div>
        </div>
    );
}
