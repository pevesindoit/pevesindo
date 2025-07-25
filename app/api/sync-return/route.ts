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

function getQuantity(detailItem: any): number | null {
  return (
    detailItem?.returnQuantity ??
    detailItem?.quantity ??
    detailItem?.receivedQuantity ??
    null
  );
}

export async function POST(req: NextRequest) {
  const reqBody = await req.json();
  const data = reqBody.data;

  try {
    const result = await fetchReturn(data);
    const allSalesReturns = result?.d ?? [];

    let recordsToInsert = []; // Changed to insert
    let skippedCount = 0;
    let existingRecordsCount = 0;

    for (const salesReturnHeader of allSalesReturns) {
      const getDetail = await fetchReturnDetail(salesReturnHeader.id);
      const detail = getDetail?.d;

      console.log(detail, "ahhay");

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

      // --- Start of Jurnal ID check ---
      if (!detail.journalId) {
        console.log(
          `-️ Skipping sales return ${salesReturnHeader.number} due to missing journalId.`
        );
        skippedCount++;
        continue;
      }

      const { data: existingJurnal, error: checkError } = await supabase
        .from("return")
        .select("jurnal_id")
        .eq("jurnal_id", detail.journalId)
        .single();

      if (checkError && checkError.code !== "PGRST116") {
        // PGRST116 means "No rows found"
        console.error(
          `❌ Error checking for existing jurnal_id ${detail.journalId}:`,
          checkError
        );
        continue; // Skip this record due to check error
      }

      if (existingJurnal) {
        console.log(
          `-️ Skipping sales return ${salesReturnHeader.number} (jurnal_id: ${detail.journalId}) because it already exists.`
        );
        existingRecordsCount++;
        continue; // Skip to the next sales return header
      }
      // --- End of Jurnal ID check ---

      // If we reach here, the jurnal_id does not exist in the database.
      // Now, decide how to handle multiple detailItems for a single jurnal_id.
      // Option 1: Store only one record per journal ID (e.g., from the first detailItem).
      // This is a common approach if 'jurnal_id' truly represents the entire return.
      const firstDetailItem = detail.detailItem[0]; // Take the first detail item

      const destinationWarehouseName = firstDetailItem?.warehouse?.name;
      const cabangTujuan =
        warehouseToCabangMap[destinationWarehouseName ?? ""] ??
        destinationWarehouseName;

      const customerName = detail.customer?.name;
      const quantity = getQuantity(firstDetailItem);

      const record = {
        quantity: quantity,
        cabang: cabangTujuan,
        invoice_code: detail.invoice?.number,
        nama_costumer: customerName,
        nama_sales: firstDetailItem.salesmanName,
        nama_barang: firstDetailItem.item?.name,
        kode_barang: firstDetailItem.item?.no,
        tanggal_return: detail.transDate,
        jurnal_id: detail.journalId,
      };

      recordsToInsert.push(record);
    }

    if (recordsToInsert.length > 0) {
      const { error } = await supabase.from("return").insert(recordsToInsert); // Changed to .insert()

      if (error) {
        console.error("❌ Insert failed:", error);
        throw new Error(error.message);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Sync complete. Inserted ${recordsToInsert.length} new records. Skipped ${skippedCount} sales returns due to missing data. Skipped ${existingRecordsCount} records because their jurnal_id already existed.`,
    });
  } catch (error: any) {
    console.error("Error in POST function:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
