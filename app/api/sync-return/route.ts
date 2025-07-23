import { NextRequest, NextResponse } from "next/server";
import supabase from "@/lib/db";
import crypto from "crypto";
import { getFormattedDate } from "@/app/function/dateFormater";
import { fetchReturnDetail } from "@/app/function/fetchReturnDetail";
import { fetchReturn } from "@/app/function/return";

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
  "GOOD STOCK - MAKASSAR": "PEVESINDO CABANG MAKASSAR",
  "GOOD STOCK - MAROS": "PEVESINDO CABANG MAROS", // Example: Added another entry
};

// This helper function seems fine for getting quantity,
// but for sales returns, `detailItem.returnQuantity` is likely the most relevant.
function getQuantity(detailItem: any): number | null {
  return (
    detailItem?.returnQuantity ?? // This is the most direct path for the provided SR JSON
    detailItem?.quantity ?? // Fallback to general quantity if returnQuantity isn't there
    detailItem?.receivedQuantity ?? // Fallback for transfers if needed
    null
  );
}

export async function POST(req: NextRequest) {
  const reqBody = await req.json();
  const data = reqBody.data;

  console.log(data, "ini datanya");

  try {
    const result = await fetchReturn(data);
    console.log(result, "ini resultnya");
    const allSalesReturns = result?.d ?? [];

    let recordsToUpsert = [];
    let skippedCount = 0;

    for (const salesReturnHeader of allSalesReturns) {
      const getDetail = await fetchReturnDetail(salesReturnHeader.id);
      const detail = getDetail?.d; // This 'detail' is the comprehensive sales return object

      if (
        !detail ||
        !Array.isArray(detail.detailItem) ||
        detail.detailItem.length === 0
      ) {
        console.log(
          `-️ Skipping sales return ${salesReturnHeader.number} due to missing or empty detailItem.`
        );
        skippedCount++;
        continue;
      }

      // Determine the 'cabang' (branch/warehouse) where the return is received
      // This is the warehouse associated with the detail item in the sales return
      const destinationWarehouseName = detail.detailItem[0]?.warehouse?.name;
      const cabangTujuan =
        warehouseToCabangMap[destinationWarehouseName ?? ""] ??
        destinationWarehouseName;

      // Extract customer name
      const customerName = detail.customer?.name;

      for (const detailItem of detail.detailItem) {
        const quantity = getQuantity(detailItem);

        const record = {
          // accurate_detail_id is crucial for `onConflict` but won't be saved as a column if not present in your schema.
          // If you need unique identification in Supabase for upsert, you must have a column for it.
          // Assuming you have a column named `accurate_detail_id` in Supabase, even if not listed in your query,
          // as it's typically used for `onConflict`. If not, change `onConflict` to your actual PK.
          // accurate_detail_id: detailItem.id, // Assuming this is your unique identifier for upserting rows

          quantity: quantity, // From d.detailItem[0].returnQuantity
          cabang: cabangTujuan, // Derived from d.detailItem[0].warehouse.name
          invoice_code: detail.invoice?.number, // From d.invoice.number
          nama_costumer: customerName, // From d.d.customer.name
          nama_sales: detailItem.salesmanName, // From d.detailItem[0].salesmanName
          nama_barang: detailItem.item?.name, // From d.detailItem[0].item.name
          kode_barang: detailItem.item?.no, // From d.detailItem[0].item.no
          tanggal_return: detail.transDateView, // From d.transDateView
        };

        recordsToUpsert.push(record);
      }
    }

    if (recordsToUpsert.length > 0) {
      const { error } = await supabase.from("return").upsert(recordsToUpsert);

      if (error) {
        console.error("❌ Upsert failed:", error);
        throw new Error(error.message);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Sync complete. Processed ${recordsToUpsert.length} records for upsert. Skipped ${skippedCount} sales returns.`,
    });
  } catch (error: any) {
    console.error("Error in POST function:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// fetchReturn and fetchReturnDetail functions remain the same as previously provided
// Assuming they are correctly fetching sales return list and detail from Accurate API.

// --- fetchReturnDetail function (no change from previous refined version) ---
