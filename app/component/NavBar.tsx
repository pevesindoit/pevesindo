"use client";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Button from "./Button";
import ButtonLogOut from "./ButtonLogOut";
import Cookies from "js-cookie";
import supabase from "@/lib/db";

export default function NavBar() {
    const [userName, setUserName] = useState<string | null>(null);
    const [loading, setLoading] = useState(false)
    const router = useRouter();
    const pathname = usePathname(); // this changes when route changes

    useEffect(() => {
        const email = localStorage.getItem("email");
        const access = localStorage.getItem('sb-access-token');
        const refresh = localStorage.getItem('sb-refresh-token');
        console.log(access, refresh, "ulala")
        if (!access || !refresh) {
            Cookies.remove("sb-access-token");
            Cookies.remove("sb-refresh-token");
            Cookies.remove("user-type"); // also remove the type


            // Optional: Clear localStorage
            localStorage.removeItem("email");
            localStorage.removeItem("type");
            localStorage.removeItem("cabang");
        }
        setUserName(email);
    }, [pathname]); // re-run on route change

    const logOut = async () => {
        try {
            setLoading(true);
            // Sign out from Supabase (clears cookies server-side and tokens client-side)
            await supabase.auth.signOut();

            // Optional: Clear any custom cookies (if you set with js-cookie or document.cookie)
            Cookies.remove("sb-access-token");
            Cookies.remove("sb-refresh-token");
            Cookies.remove("user-type"); // also remove the type


            // Optional: Clear localStorage
            localStorage.removeItem("email");
            localStorage.removeItem("type");
            localStorage.removeItem("cabang");

            // Redirect to login page
            router.push("/");
        } catch (error) {
            console.error("Logout error:", error);
        } finally {
            setLoading(false);
        }
    };


    if (userName === null || userName === "") {
        return null; // still loading or not logged in
    }

    return (
        <div className="w-full flex justify-center bg-white py-[1em]">
            <div className="w-[90%] flex justify-between">
                <div className="flex items-center">
                    <Image src="/logo.png" alt="logo" className="w-[5rem]" width={500} height={500} />
                </div>
                <div className="flex space-x-[1rem] items-center">
                    <ButtonLogOut onClick={logOut} loading={loading} >Logout</ButtonLogOut>
                    <p className="text-[.5rem]">{userName}</p>
                    <Image src="/user.png" alt="user" width={500} height={500} className="w-[2rem] h-[2rem]" />
                </div>
            </div>
        </div>
    );
}
