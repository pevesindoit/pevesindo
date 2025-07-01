import { NextRequest, NextResponse } from "next/server";
import supabase from "@/lib/db";
import { fetchMutations } from "@/app/function/mutation";
import { fetchMutationsDetail } from "@/app/function/mutationDetail";

export async function POST(req: NextRequest) {
  const data = await req.json();

  try {
    const result = await fetchMutations(data);
    const allItems = result?.d ?? [];

    for (const item of allItems) {
      const itemId = item?.id;
      if (!itemId) continue;

      // Skip if already in DB
      const { data: existing, error: checkError } = await supabase
        .from("mutasi")
        .select("id_mutasi")
        .eq("id_mutasi", itemId)
        .maybeSingle();

      if (checkError) {
        // console.error("❌ Error checking existing mutasi:", checkError.message);
        continue;
      }

      if (existing) {
        const getDetail = await fetchMutationsDetail(itemId);
        const detail = getDetail?.d;

        if (!detail || !Array.isArray(detail.detailItem)) {
          continue;
        }

        const detailMutasi = detail.detailItem;
        const warehouseToCabangMap: Record<string, string> = {
          "GOOD STOCK - BADDOKA": "PEVESINDO CABANG BADDOKA",
          "GOOD STOCK - HERTASNING": "PEVESINDO CABANG HERTASNING",
          "GOOD STOCK - PARE-PARE": "PEVESINDO CABANG PARE-PARE",
          "GOOD STOCK - BONE": "PEVESINDO CABANG BONE",
          "GOOD STOCK - JOGJA": "PEVESINDO CABANG JOGJA",
          "GOOD STOCK - JENEPONTO": "PEVESINDO CABANG JENEPONTO",
        };

        const cabang =
          warehouseToCabangMap[detail?.warehouseName ?? ""] ??
          detail?.warehouseName ??
          null;

        const cabangTujuan =
          warehouseToCabangMap[detail?.referenceWarehouseName ?? ""] ??
          detail?.referenceWarehouseName ??
          null;

        for (const detailItem of detailMutasi) {
          const newQuantity =
            detailItem?.fromItemTransferDetail?.quantity ?? null;

          if (!newQuantity) continue;

          const { error: updateError } = await supabase
            .from("mutasi")
            .update({
              quantity: newQuantity,
              detail_name: detailItem?.detailName ?? null,
              detail_item: detailItem?.processQuantityDesc ?? null,
              description: detailItem?.inTransitWarehouse?.description ?? null,
              status_transfer:
                detail?.fromItemTransfer?.itemTransferOutStatus ?? null,
              process_quantity_desc:
                detail?.inTransitWarehouse?.description ?? null,
              tanggal_transfer: detail?.transDate ?? null,
              sumber_mutasi: cabang,
              tujuan_mutasi: cabangTujuan,
            })
            .eq("id_mutasi", itemId)
            .is("quantity", null);

          if (updateError) {
            // console.error(`❌ Failed to update null quantity for id_mutasi ${itemId}:`, updateError.message);
          } else {
            // console.log(`🔄 Updated quantity for existing id_mutasi: ${itemId}`);
          }
        }

        continue; // skip insert
      }

      // Fetch detail
      const getDetail = await fetchMutationsDetail(itemId);
      const detail = getDetail?.d;

      if (!detail || !Array.isArray(detail.detailItem)) {
        // console.warn(`⚠️ No detailItem array found for mutasi id: ${itemId}`);
        continue;
      }

      const detailMutasi = detail.detailItem;
      const warehouseToCabangMap: Record<string, string> = {
        "GOOD STOCK - BADDOKA": "PEVESINDO CABANG BADDOKA",
        "GOOD STOCK - HERTASNING": "PEVESINDO CABANG HERTASNING",
        "GOOD STOCK - PARE-PARE": "PEVESINDO CABANG PARE-PARE",
        "GOOD STOCK - BONE": "PEVESINDO CABANG BONE",
        "GOOD STOCK - JOGJA": "PEVESINDO CABANG JOGJA",
        "GOOD STOCK - JENEPONTO": "PEVESINDO CABANG JENEPONTO",
      };

      const cabang =
        warehouseToCabangMap[detail?.warehouseName ?? ""] ??
        detail?.warehouseName ??
        null;

      const cabangTujuan =
        warehouseToCabangMap[detail?.referenceWarehouseName ?? ""] ??
        detail?.referenceWarehouseName ??
        null;

      // Build payload using detail header + each item
      const payload = detailMutasi.map((detailItem: any) => ({
        quantity: detailItem?.fromItemTransferDetail?.quantity ?? null,
        number: detail?.number ?? null,
        id_mutasi: detail?.id ?? null,
        branch_id: detail?.branchId ?? null,
        sumber_mutasi: cabang,
        status_name: detail?.approvalStatus ?? null,
        detail_name: detailItem?.detailName ?? null,
        detail_item: detailItem.processQuantityDesc ?? null,
        description: detailItem?.inTransitWarehouse?.description ?? null,
        tujuan_mutasi: cabangTujuan,
        status_transfer:
          detail?.fromItemTransfer?.itemTransferOutStatus ?? null,
        process_quantity_desc: detail?.inTransitWarehouse?.description ?? null,
        tanggal_transfer: detail?.transDate ?? null,
      }));

      // Insert into mutasi table
      const { error: insertError } = await supabase
        .from("mutasi")
        .insert(payload);

      if (insertError) {
        // console.error("❌ Insert to mutasi failed:", insertError.message);
      } else {
        // console.log(
        //   `✅ Inserted ${payload.length} records to mutasi for ID: ${itemId}`
        // );
      }
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    // console.error("❌ Fatal error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
