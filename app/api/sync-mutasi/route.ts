import { NextRequest, NextResponse } from "next/server";
import supabase from "@/lib/db";
import { fetchMutations } from "@/app/function/mutation";
import { fetchMutationsDetail } from "@/app/function/fetchMutationsDetail";

const warehouseToCabangMap: Record<string, string> = {
  "GOOD STOCK - BADDOKA": "PEVESINDO CABANG BADDOKA",
  "GOOD STOCK - HERTASNING": "PEVESINDO CABANG HERTASNING",
  "GOOD STOCK - PAREPARE": "PEVESINDO CABANG PARE-PARE",
  "GOOD STOCK - BONE": "PEVESINDO CABANG BONE",
  "GOOD STOCK - JOGJA": "PEVESINDO CABANG JOGJA",
  "GOOD STOCK - JENEPONTO": "PEVESINDO CABANG JENEPONTO",
};

function getQuantity(detailItem: any): number | null {
  return (
    detailItem?.fromItemTransferDetail?.quantity ??
    detailItem?.quantity ??
    detailItem?.receivedQuantity ??
    null
  );
}

export async function POST(req: NextRequest) {
  const data = await req.json();

  try {
    // ✅ Step 1: Update records with null status_transfer
    const { data: pendingMutasi, error: pendingError } = await supabase
      .from("mutasi")
      .select("id_mutasi")
      .is("status_transfer", null);

    if (pendingError) {
      console.error("❌ Error fetching pending mutasi:", pendingError.message);
    } else {
      for (const row of pendingMutasi ?? []) {
        const itemId = row.id_mutasi;
        const getDetail = await fetchMutationsDetail(itemId);
        const detail = getDetail?.d;

        if (
          !detail ||
          detail?.fromItemTransfer?.itemTransferOutStatus !== "FULL_RECEIVED"
        ) {
          continue;
        }

        const detailMutasi = detail.detailItem ?? [];
        const cabang =
          warehouseToCabangMap[detail?.warehouseName ?? ""] ??
          detail?.warehouseName ??
          null;

        const cabangTujuan =
          warehouseToCabangMap[detail?.referenceWarehouseName ?? ""] ??
          detail?.referenceWarehouseName ??
          null;

        for (const detailItem of detailMutasi) {
          const quantity = getQuantity(detailItem);
          console.log("ini no kode barangnya", detailItem?.item.no);

          const { error: updateError } = await supabase
            .from("mutasi")
            .update({
              quantity,
              detail_name: detailItem?.detailName ?? null,
              kode_barang: detailItem?.item.no ?? null,
              detail_item: `${quantity ?? 0} Lembar`,
              description: detailItem?.inTransitWarehouse?.description ?? null,
              status_transfer:
                detail?.fromItemTransfer?.itemTransferOutStatus ?? null,
              process_quantity_desc:
                detail?.inTransitWarehouse?.description ?? null,
              tanggal_transfer: detail?.transDate ?? null,
              sumber_mutasi: cabang,
              tujuan_mutasi: cabangTujuan,
              status_name: detail?.approvalStatus ?? null,
            })
            .eq("id_mutasi", itemId)
            .eq("detail_name", detailItem?.detailName ?? null);

          if (updateError) {
            console.error(
              `❌ Failed to update status_transfer for id_mutasi ${itemId}:`,
              updateError.message
            );
          } else {
            console.log(
              `✅ Updated mutasi ${itemId} with FULL_RECEIVED from Accurate`
            );
          }
        }
      }
    }

    // ✅ Step 2: Process new mutation data from Accurate
    const result = await fetchMutations(data);
    const allItems = result?.d ?? [];

    for (const item of allItems) {
      const itemId = item?.id;
      if (!itemId) continue;

      const { data: existing, error: checkError } = await supabase
        .from("mutasi")
        .select("id_mutasi")
        .eq("id_mutasi", itemId)
        .maybeSingle();

      if (checkError) continue;

      const getDetail = await fetchMutationsDetail(itemId);
      const detail = getDetail?.d;

      if (!detail || !Array.isArray(detail.detailItem)) continue;

      const detailMutasi = detail.detailItem;
      const cabang =
        warehouseToCabangMap[detail?.warehouseName ?? ""] ??
        detail?.warehouseName ??
        null;
      const cabangTujuan =
        warehouseToCabangMap[detail?.referenceWarehouseName ?? ""] ??
        detail?.referenceWarehouseName ??
        null;

      if (existing) {
        for (const detailItem of detailMutasi) {
          const quantity = getQuantity(detailItem);
          if (!quantity) continue;

          await supabase
            .from("mutasi")
            .update({
              quantity,
              detail_name: detailItem?.detailName ?? null,
              detail_item: `${quantity ?? 0} Lembar`,
              kode_barang: detailItem?.item.no ?? null,
              description: detailItem?.inTransitWarehouse?.description ?? null,
              status_transfer:
                detail?.fromItemTransfer?.itemTransferOutStatus ?? null,
              process_quantity_desc:
                detail?.inTransitWarehouse?.description ?? null,
              tanggal_transfer: detail?.transDate ?? null,
              sumber_mutasi: cabang,
              tujuan_mutasi: cabangTujuan,
              status_name: detail?.approvalStatus ?? null,
            })
            .eq("id_mutasi", itemId)
            .eq("detail_name", detailItem?.detailName ?? null);
        }

        continue; // skip insert
      }

      const payload = detailMutasi.map((detailItem: any) => {
        const quantity = getQuantity(detailItem);
        return {
          quantity,
          number: detail?.number ?? null,
          id_mutasi: detail?.id ?? null,
          kode_barang: detailItem?.item.no ?? null,
          branch_id: detail?.branchId ?? null,
          sumber_mutasi: cabang,
          status_name: detail?.approvalStatus ?? null,
          detail_name: detailItem?.detailName ?? null,
          detail_item: `${quantity ?? 0} Lembar`,
          description: detailItem?.inTransitWarehouse?.description ?? null,
          tujuan_mutasi: cabangTujuan,
          status_transfer:
            detail?.fromItemTransfer?.itemTransferOutStatus ?? null,
          process_quantity_desc:
            detail?.inTransitWarehouse?.description ?? null,
          tanggal_transfer: detail?.transDate ?? null,
        };
      });

      const { error: insertError } = await supabase
        .from("mutasi")
        .insert(payload);

      if (insertError) {
        console.error("❌ Insert to mutasi failed:", insertError.message);
      }
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
