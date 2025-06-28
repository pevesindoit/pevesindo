interface IMutasi {
  quantity: number;
  number: string;
  id_mutasi: number;
  branch_id: number;
  sumber_mutasi: string;
  status_name: string;
  detail_name: string;
  description: string;
  tujuan_mutasi: string;
  status_transfer: string;
  process_quantity_desc: string;
  tanggal_transfer: string;
}

export type { IMutasi };
