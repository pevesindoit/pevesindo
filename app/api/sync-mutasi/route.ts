import { NextRequest, NextResponse } from "next/server";
import supabase from "@/lib/db";
import { fetchMutations } from "@/app/function/mutation";
import { fetchMutationsDetail } from "@/app/function/fetchMutationsDetail";

// Your warehouse map...
const warehouseToCabangMap: Record<string, string> = {
  "GOOD STOCK - BADDOKA": "PEVESINDO CABANG BADDOKA",
  "GOOD STOCK - HERTASNING": "PEVESINDO CABANG HERTASNING",
  "GOOD STOCK - PAREPARE": "PEVESINDO CABANG PARE-PARE",
  "GOOD STOCK - BONE": "PEVESINDO CABANG BONE",
  "GOOD STOCK - JOGJA": "PEVESINDO CABANG JOGJA",
  "GOOD STOCK - JENEPONTO": "PEVESINDO CABANG JENEPONTO",
  "Gudang Utama": "PEVESINDO CABANG JENEPONTO",
  "GUDANG GOWA": "PEVESINDO CABANG GOWA",
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
  const reqBody = await req.json();
  const data = reqBody.data;

  try {
    const result = await fetchMutations(data);
    const allItems = result?.d ?? [];

    let recordsToUpsert = [];
    let skippedCount = 0;

    for (const item of allItems) {
      const getDetail = await fetchMutationsDetail(item.id);
      const detail = getDetail?.d;

      if (
        !detail ||
        !Array.isArray(detail.detailItem) ||
        detail.detailItem.length === 0
      ) {
        continue;
      }

      // ✅ **NEW LOGIC: Check the status at the parent level.**
      // If the entire transfer is already marked as received, skip all its items.
      if (detail.itemTransferOutStatus === "FULL_RECEIVED") {
        console.log(
          `-️ Skipping transfer ${detail.number} because it's already FULL_RECEIVED.`
        );
        skippedCount++;
        continue; // Skip to the next transfer document
      }

      const cabang =
        warehouseToCabangMap[detail.warehouseName ?? ""] ??
        detail.warehouseName;
      const cabangTujuan =
        warehouseToCabangMap[detail.referenceWarehouseName ?? ""] ??
        detail.referenceWarehouseName;

      for (const detailItem of detail.detailItem) {
        const quantity = getQuantity(detailItem);
        const unitName = detailItem.itemUnit?.name ?? "unit";

        const record = {
          accurate_detail_id: detailItem.id,
          kode_barang: detailItem.item.no,
          quantity: quantity,
          tanggal_transfer: detail.transDate,
          sumber_mutasi: cabang,
          detail_item: `${quantity ?? 0} ${unitName}`,
          number: detail.number,
          id_mutasi: detail.id,
          branch_id: detail.branchId,
          status_name: detail.approvalStatus,
          // Status will now always be null or in-transit, never "FULL_RECEIVED"
          status_transfer: detail.fromItemTransfer?.itemTransferOutStatus,
          status_terima: null, // This will never be "Selesai Pengantaran" with this logic
          detail_name: detailItem.detailName,
          tujuan_mutasi: cabangTujuan,
          description: detailItem.inTransitWarehouse?.description,
          process_quantity_desc: detail.inTransitWarehouse?.description,
        };
        recordsToUpsert.push(record);
      }
    }

    if (recordsToUpsert.length > 0) {
      const { error } = await supabase.from("mutasi").upsert(recordsToUpsert, {
        onConflict: "accurate_detail_id",
      });

      if (error) {
        console.error("❌ Upsert failed:", error);
        throw new Error(error.message);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Sync complete. Processed ${recordsToUpsert.length} records for upsert. Skipped ${skippedCount} completed transfers.`,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
