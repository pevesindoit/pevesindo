"use client"
import type { IMenu } from "@/types/menu.type";
import Image from "next/image";
import { useEffect, useState } from "react";
import supabase from '@/lib/db'
import DatePicker from "../component/DatePicker";
import Input from "../component/input";
import DropDown from "../component/DropDown";
import Button from "../component/Button";
import { getSync } from "../fetch/get/fetch";

export default function Home() {
  const [data, setData] = useState<IMenu[]>([])
  const [formData, setFormData] = useState({
    tanggal: '',
    bulan: '',
    nama: '',
    nomor: '',
    wilayah: '',
    alamat: '',
    channel: '',
    platform: '',
    ket: '',
    status: '',
    nominal: '',
    cabang: '',
    keterangan: '',
  });
  const [page, setPage] = useState(1);
  const itemsPerPage = 5;
  const [editingCell, setEditingCell] = useState<{ id: number; field: keyof IMenu } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const from = (page - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;

      console.log(from, "to", to)

      const { data, error } = await supabase
        .from("data-cs")
        .select("*")
        .order("id", { ascending: false })
        .range(from, to); // pagination here

      if (error) console.log("error", error);
      else setData(data);
    };

    fetchData();
  }, [page]);

  console.log(data)

  const handleChange = (e: any) => {
    const { name, value } = e.target;

    if (name === 'tanggal') {
      const dateObj = new Date(value);
      const day = dateObj.getDate();
      const month = dateObj.getMonth() + 1;
      const year = dateObj.getFullYear();

      setFormData((prev) => ({
        ...prev,
        tanggal: `${day}-${month}-${year}`,
        bulan: month.toString()
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  }

  const addCustumer = async () => {
    try {
      const { data, error } = await supabase.from('data-cs').insert([formData]).select()
      if (error) {
        console.log('Error adding customer:', error)
      } else {
        alert('Customer added!')
        if (data) {
          setData((prev) => [...data, ...prev])
          setFormData({
            tanggal: formData.tanggal,
            bulan: formData.bulan,
            nama: '',
            nomor: '',
            wilayah: '',
            alamat: '',
            channel: formData.channel,
            platform: formData.platform,
            ket: formData.ket,
            status: formData.status,
            nominal: '',
            cabang: formData.cabang,
            keterangan: ''
          })

        }
      }
    } catch (error) {
      console.log(error)
    }
  }

  const handleLocalChange = (e: React.ChangeEvent<HTMLInputElement>, id: number, field: string) => {
    const updated = data.map(item =>
      item.id === id ? { ...item, [field]: e.target.value } : item
    );
    setData(updated);
  };

  const handleSaveEdit = async (id: number, field: keyof IMenu) => {
    const item = data.find(d => d.id === id);
    if (!item) return;

    try {
      const { error } = await supabase
        .from("data-cs")
        .update({ [field]: item[field] })
        .eq("id", id);

      if (error) console.error("Update failed", error);
      setEditingCell(null); // close input
    } catch (err) {
      console.error("Unexpected error", err);
    }
  };

  return (
    <div className="py-[2rem]">
      <div className="w-full justify-center flex">
        <div className="bg-white rounded-[10px] border border-[#E3E7EC] text-[.6rem] py-[2rem] w-[95%] px-[2rem] space-y-[2rem]">
          <h1 className="text-[2rem]">
            Tambah Custumer
          </h1>
          <div className="grid grid-cols-6 gap-[1rem]">
            <DatePicker label="tanggal" onChange={handleChange} value={formData.tanggal} />
            <Input label="nama" onChange={handleChange} value={formData.nama} />
            <Input label="nomor" onChange={handleChange} value={formData.nomor} />
            <Input label="wilayah" onChange={handleChange} value={formData.wilayah} />
            <Input label="alamat" onChange={handleChange} value={formData.alamat} />
            <DropDown
              label="channel"
              value={formData.channel}
              onChange={handleChange}
              options={['N/A', 'end user', 'aplikator', 'freelancer', 'kontraktor', 'masjid', 'warfon', 'interior']}
            />
            <DropDown
              label="platform"
              value={formData.platform}
              onChange={handleChange}
              options={['instagram', 'tiktok', 'whatsapp', 'youtube', 'telegram', 'facebook', 'website', 'google my bussines', 'gmaps', 'lainnya', 'lg anggu batary', 'live ig', 'event', 'freelancer', 'google ads']}
            />
            <DropDown
              label="ket"
              value={formData.ket}
              onChange={handleChange}
              options={['iklan lama', 'iklan baru SDBI', 'iklan baru pak budi', 'whatsapp', 'follow Up SDBI', 'follow Up pak budi', 'tidak terdeteksi', 'RO', 'Ex Sales', 'DM Ig', 'komentar IG', 'FU Custumer lama', 'Chat masangger', 'Follow Up', 'Komentar FB', 'anggu batary', 'FB Pribadi']}
            />
            <DropDown
              label="status"
              value={formData.status}
              onChange={handleChange}
              options={['hold', 'cancel', 'hold', 'closing', 'warm', 'hot']}
            />
            <Input label="nominal" onChange={handleChange} value={formData.nominal} />
            <DropDown
              label="cabang"
              value={formData.cabang}
              onChange={handleChange}
              options={['hertasning', 'baddoka', 'pare-pare', 'bone', 'yogyakarta', 'jeneponto']}
            />
            <Input label="keterangan" onChange={handleChange} value={formData.keterangan} />
            <Button onClick={addCustumer}>Tambah</Button>
          </div>
        </div>
      </div>

      <div className="w-full flex justify-center pt-[4rem]">
        <div className="bg-white rounded-[10px] border border-[#E3E7EC] text-[.6rem] py-[2rem] w-[95%]">
          <div className="w-full justify-center flex">
            <div className="w-[95%] pb-[1.5rem]">
              <h1 className="text-[2rem]">
                Filter
              </h1>

            </div>
          </div>
          <div className="w-full overflow-x-scroll">
            <table className="overflow-hidden">
              <thead className="bg-[#F9FAFB] bg-opacity-[80%] border-t border-b border-[#E3E7EC] text-[#969696]">
                <tr>
                  <th scope="col" className="pr-[-3rem] pl-[1rem] py-3">No</th>
                  <th scope="col" className="px-6 py-3">Tanggal</th>
                  <th scope="col" className="px-6 py-3">Bulan</th>
                  <th scope="col" className="px-6 py-3">Nama</th>
                  <th scope="col" className="px-6 py-3">Nomor HP</th>
                  <th scope="col" className="px-6 py-3">Wilayah</th>
                  <th scope="col" className="px-6 py-3">Alamat</th>
                  <th scope="col" className="px-6 py-3">Channel</th>
                  <th scope="col" className="px-6 py-3">Platform</th>
                  <th scope="col" className="px-6 py-3">Keterangan</th>
                  <th scope="col" className="px-6 py-3">Status</th>
                  <th scope="col" className="px-6 py-3">Nominal</th>
                  <th scope="col" className="px-6 py-3">Cabang</th>
                  <th scope="col" className="px-6 py-3">Keterangan</th>
                  <th scope="col" className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {
                  data.map((item: any, index: any) => (
                    <tr key={index} className="px-[2rem] ">
                      <td scope="col" className="pr-[-3rem] pl-[1rem] py-3">
                        {(page - 1) * itemsPerPage + index + 1}
                      </td>
                      <td scope="col" className="px-6 py-3">{item.tanggal}</td>
                      <td scope="col" className="px-6 py-3">{item.bulan}</td>
                      <td
                        onDoubleClick={() => setEditingCell({ id: item.id, field: 'nama' })}
                      >
                        {editingCell?.id === item.id && editingCell?.field === 'nama' ? (
                          <input
                            type="text"
                            value={item.nama}
                            onChange={(e) => handleLocalChange(e, item.id, 'nama')}
                            onBlur={() => handleSaveEdit(item.id, 'nama')}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveEdit(item.id, 'nama');
                            }}
                            autoFocus
                          />
                        ) : (
                          item.nama
                        )}
                      </td>
                      <td
                        onDoubleClick={() => setEditingCell({ id: item.id, field: 'nomor' })}
                      >
                        {editingCell?.id === item.id && editingCell?.field === 'nomor' ? (
                          <input
                            type="text"
                            value={item.nomor}
                            onChange={(e) => handleLocalChange(e, item.id, 'nomor')}
                            onBlur={() => handleSaveEdit(item.id, 'nomor')}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveEdit(item.id, 'nomor');
                            }}
                            autoFocus
                          />
                        ) : (
                          item.nomor
                        )}
                      </td>
                      <td
                        onDoubleClick={() => setEditingCell({ id: item.id, field: 'wilayah' })}
                      >
                        {editingCell?.id === item.id && editingCell?.field === 'wilayah' ? (
                          <input
                            type="text"
                            value={item.wilayah}
                            onChange={(e) => handleLocalChange(e, item.id, 'wilayah')}
                            onBlur={() => handleSaveEdit(item.id, 'wilayah')}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveEdit(item.id, 'wilayah');
                            }}
                            autoFocus
                          />
                        ) : (
                          item.wilayah
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
                      <td onDoubleClick={() => setEditingCell({ id: item.id, field: 'channel' })}>
                        {editingCell?.id === item.id && editingCell?.field === 'channel' ? (
                          <select
                            value={item.channel}
                            onChange={(e: any) => handleLocalChange(e, item.id, 'channel')}
                            onBlur={() => handleSaveEdit(item.id, 'channel')}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveEdit(item.id, 'channel');
                            }}
                            autoFocus
                            className="border rounded px-2 py-1"
                          >
                            {['N/A', 'end user', 'aplikator', 'freelancer', 'kontraktor', 'masjid', 'warfon', 'interior'].map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        ) : (
                          item.channel
                        )}
                      </td>

                      <td onDoubleClick={() => setEditingCell({ id: item.id, field: 'platform' })}>
                        {editingCell?.id === item.id && editingCell?.field === 'platform' ? (
                          <select
                            value={item.platform}
                            onChange={(e: any) => handleLocalChange(e, item.id, 'platform')}
                            onBlur={() => handleSaveEdit(item.id, 'platform')}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveEdit(item.id, 'platform');
                            }}
                            autoFocus
                            className="border rounded px-2 py-1"
                          >
                            {[
                              'instagram',
                              'tiktok',
                              'whatsapp',
                              'youtube',
                              'telegram',
                              'facebook',
                              'website',
                              'google my bussines',
                              'gmaps',
                              'lainnya',
                              'lg anggu batary',
                              'live ig',
                              'event',
                              'freelancer',
                              'google ads',
                            ].map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        ) : (
                          item.platform
                        )}
                      </td>

                      <td onDoubleClick={() => setEditingCell({ id: item.id, field: 'ket' })}>
                        {editingCell?.id === item.id && editingCell?.field === 'ket' ? (
                          <select
                            value={item.ket}
                            onChange={(e: any) => handleLocalChange(e, item.id, 'ket')}
                            onBlur={() => handleSaveEdit(item.id, 'ket')}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveEdit(item.id, 'ket');
                            }}
                            autoFocus
                            className="border rounded px-2 py-1"
                          >
                            {[
                              'iklan lama',
                              'iklan baru SDBI',
                              'iklan baru pak budi',
                              'whatsapp',
                              'follow Up SDBI',
                              'follow Up pak budi',
                              'tidak terdeteksi',
                              'RO',
                              'Ex Sales',
                              'DM Ig',
                              'komentar IG',
                              'FU Custumer lama',
                              'Chat masangger',
                              'Follow Up',
                              'Komentar FB',
                              'anggu batary',
                              'FB Pribadi',
                            ].map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        ) : (
                          item.ket
                        )}
                      </td>
                      <td onDoubleClick={() => setEditingCell({ id: item.id, field: 'status' })}>
                        {editingCell?.id === item.id && editingCell?.field === 'status' ? (
                          <select
                            value={item.status}
                            onChange={(e: any) => handleLocalChange(e, item.id, 'status')}
                            onBlur={() => handleSaveEdit(item.id, 'status')}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveEdit(item.id, 'status');
                            }}
                            autoFocus
                            className="border rounded px-2 py-1"
                          >
                            {['hold', 'cancel', 'closing', 'warm', 'hot'].map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        ) : (
                          item.status
                        )}
                      </td>

                      <td
                        onDoubleClick={() => setEditingCell({ id: item.id, field: 'nominal' })}
                      >
                        {editingCell?.id === item.id && editingCell?.field === 'nominal' ? (
                          <input
                            type="text"
                            value={item.nominal}
                            onChange={(e) => handleLocalChange(e, item.id, 'nominal')}
                            onBlur={() => handleSaveEdit(item.id, 'nominal')}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveEdit(item.id, 'nominal');
                            }}
                            autoFocus
                          />
                        ) : (
                          item.nominal
                        )}
                      </td>
                      <td scope="col" className="px-6 py-3">{item.cabang}</td>
                      <td scope="col" className="px-6 py-3">{item.keterangan}</td>
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

    </div>
  );
}
