import { NextRequest, NextResponse } from "next/server";
import supabase from "@/lib/db";
import { fetchAccurateDetail, fetchAccurateIds } from "@/app/function/accurate";

export async function POST(req: NextRequest) {
  const data = await req.json();
  let cabang;
  try {
    const allIds = await fetchAccurateIds(data);
    console.log("ini idnya", allIds);
    cabang = data.cabang;
    let detailnya;

    for (const id of allIds) {
      const { data: existing } = await supabase
        .from("surat_jalan")
        .select("id_so")
        .eq("id_so", id)
        .maybeSingle(); // prevent error if not found

      if (existing) continue;

      const detail = await fetchAccurateDetail(id);
      const items = detail?.d?.detailItem || [];

      // get latest order_id before each insert
      const { data: maxOrder } = await supabase
        .from("surat_jalan")
        .select("order_id")
        .order("order_id", { ascending: false })
        .limit(1)
        .maybeSingle();

      const nextOrderId = (maxOrder?.order_id || 0) + 1;

      // console.log(detail?.d, "uhhuy surat_jalan");
      // console.log(detail, "ini detail return");
      const payload = {
        id_so: id,
        customer_name: detail?.d?.customer?.name || null,
        so_number: detail.d?.number,
        tanggal_pengantaran: items?.[0]?.shipDate || null,
        status: "Belum Loading",
        alamat: `${detail?.d?.customer?.shipAddressList?.[0]?.city || ""},${
          detail?.d?.toAddress || ""
        }`,
        driver: detail?.d?.shipment?.name || null,
        order_id: nextOrderId,
        cabang: cabang,
        is_mutation: false,
        invoice_code: detail?.d?.processHistory?.[0].historyNumber,
      };

      const { data: insertedSJ, error: sjError } = await supabase
        .from("surat_jalan")
        .insert([payload])
        .select();

      if (sjError) {
        console.error("❌ Gagal insert surat_jalan:", sjError);
        continue;
      }

      const suratJalanId = insertedSJ?.[0]?.id;

      // ✅ Insert all product items referencing surat_jalan ID
      const productPayloads = items.map((item: any) => ({
        id_pengantaran: suratJalanId,
        nama_barang: item?.item?.name || null,
        kode_barang: item?.item?.no || null,
        jumlah_item: item?.quantity || 0,
        ket_nama: item?.processQuantityDesc || null,
        tanggal_pengantaran: item?.shipDate
          ? (() => {
              const [day, month, year] = item.shipDate.split("/");
              return `${year}-${month.padStart(2, "0")}-${day.padStart(
                2,
                "0"
              )}`;
            })()
          : null,
      }));

      const { error: productError } = await supabase
        .from("products")
        .insert(productPayloads);

      if (productError) {
        console.error("❌ Gagal insert ke products:", productError);
      } else {
        console.log("✅ Products berhasil dimasukkan");
      }
    }

    return NextResponse.json({ success: true, data: detailnya });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
