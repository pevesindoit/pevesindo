"use client";

import { useEffect, useState } from "react";
import Input from "./component/input";
import Button from "./component/Button";
import supabase from "@/lib/db";
import InputPass from "./component/InputPass";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Cookies from 'js-cookie'


export default function Home() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false)
  const [token, setToken] = useState("")

  const router = useRouter()

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleLogin = async () => {
    try {
      setLoading(true)
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password
      });

      if (error) {
        alert("Login failed: " + error.message);
        return;
      }

      if (!authData.user) {
        alert("No user found.");
        return;
      }

      if (authData.user.email) {
        localStorage.setItem("email", authData.user.email)
        localStorage.setItem("id", authData.user.id)
        setToken(authData?.session.access_token)
        Cookies.set('sb-access-token', authData.session.access_token, { path: '/', expires: 1 })
        Cookies.set('sb-refresh-token', authData.session.refresh_token, { path: '/', expires: 1 })
        localStorage.setItem('sb-access-token', authData.session.access_token);
        localStorage.setItem('sb-refresh-token', authData.session.refresh_token);
      }

      // Get the profile (type, cabang)
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('type, cabang')
        .eq('id', authData.user.id)
        .single();

      if (profileError || !profile) {
        alert("Login successful, but failed to fetch profile.");
        console.error(profileError);
        return;
      }

      // Optional: Store cabang or type in localStorage
      localStorage.setItem("cabang", profile.cabang || "");
      localStorage.setItem("type", profile.type || "");

      Cookies.set("user-type", profile.type, { path: "/", expires: 1 }); // 1 day expiry

      // Redirect based on type
      switch (profile.type) {
        case 'admin':
          router.push('/pengantaran');
          break;
        case 'hrd':
          router.push('/hrd');
          break;
        case 'gudang':
          router.push('/atur-pengantaran');
          break;
        case 'sales':
          router.push('/sales');
          break;
        case 'cs':
          router.push('/sales-counter');
          break;
        case 'driver':
          router.push('/halaman-driver');
          break;
        default:
          router.push('/dashboard'); // fallback
          break;
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      alert("Unexpected error during login.");
    } finally {
      setLoading(false)
    }
  };

  // useEffect(() => {
  //   localStorage.clear();
  // }, []);

  // Only clear if no session
  useEffect(() => {
    const userType = Cookies.get("user-type") || localStorage.getItem("type");

    if (!userType) {
      localStorage.clear();
    }
  }, []);

  // Redirect if session exists
  useEffect(() => {
    const userType = Cookies.get("user-type") || localStorage.getItem("type");

    if (userType) {
      switch (userType) {
        case 'admin':
          router.push('/pengantaran');
          break;
        case 'hrd':
          router.push('/hrd');
          break;
        case 'gudang':
          router.push('/atur-pengantaran');
          break;
        case 'sales':
          router.push('/sales');
          break;
        case 'driver':
          router.push('/halaman-driver');
          break;
        case 'cs':
          router.push('/sales-counter');
          break;
        default:
          router.push('/dashboard');
          break;
      }
    }
  }, []);



  return (
    <div className="py-[2rem]">
      <div className="w-full justify-center flex">
        <div className="bg-white rounded-[10px] border border-[#E3E7EC] text-[.6rem] py-[2rem] w-[90%] md:w-[40%] px-[2rem] space-y-[2rem]">
          <div className="w-full flex justify-center">
            <Image src="/logo.png" alt="/logo.png" width={500} height={500} className="w-[5rem]" />
          </div>
          <h1 className="w-full text-[1rem] text-center font-medium">
            Login
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
          <Button onClick={handleLogin} loading={loading}>Login</Button>
        </div>
      </div>
    </div>
  );
}
