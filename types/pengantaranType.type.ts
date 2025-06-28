interface IProduct {
  id: number;
  nama_barang: string;
  kode_barang: string;
  jumlah_item: number;
  ket_nama: string;
}

interface IPengantaranType {
  id: number;
  tanggal_nota: Date; // ISO date string, e.g., '2025-05-30'
  tanggal_pengantaran: Date; // ISO date string
  bulan: number; // e.g., 'Mei 2025' or '05-2025'
  custumer_name: string;
  no_sj: string; // Nomor Surat Jalan
  kode_barang: string;
  barang_keluar: number; // Quantity
  barang_masuk: number; // Quantity
  alamat: string;
  products: IProduct[];
  pengantaran: string; // Could be driver name or transport info
  status_loading: string; // e.g., 'Loaded', 'Not Loaded'
  status: string; // e.g., 'Loaded', 'Not Loaded'
  status_pengantaran: string; // e.g., 'Delivered', 'Pending'
  type_pengantaran: string;
  maps: string;
  keterangan: string;
}

export type { IPengantaranType };
