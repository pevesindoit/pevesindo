import { NextRequest, NextResponse } from "next/server";
import supabase from "@/lib/db";
import crypto from "crypto"; // Assuming this formats date as "DD/MM/YYYY"
import { fetchReturn } from "@/app/function/return";
import { fetchReturnDetail } from "@/app/function/fetchReturnDetail";

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

// This helper function seems fine for getting quantity,
// but for sales returns, `detailItem.quantity` is likely the most relevant.
function getQuantity(detailItem: any): number | null {
  return detailItem?.quantity ?? null;
}

export async function POST(req: NextRequest) {
  const reqBody = await req.json();
  const data = reqBody.data; // This 'data' likely contains parameters for fetching returns, like 'cabang'

  try {
    // Step 1: Fetch a list of sales returns based on the provided criteria (e.g., branch and date)
    const result = await fetchReturn(data);
    const allSalesReturns = result?.d ?? []; // Renamed for clarity

    let recordsToUpsert = [];
    let skippedCount = 0;

    for (const salesReturnHeader of allSalesReturns) {
      // Step 2: For each sales return header, fetch its detailed information
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

      // **Removed NEW LOGIC: Check the status at the parent level.**
      // This logic was for "itemTransferOutStatus" which is not present in Sales Return documents.
      // Sales Return documents have 'approvalStatus' and 'returnStatusType'.
      // If you need to skip based on status, consider `detail.approvalStatus` or `detail.returnStatusType`.
      // For now, let's assume all fetched sales returns with items should be processed unless explicitly told to skip.

      const customerShipAddress = detail.customer?.shipAddress?.address;
      const customerBillAddress = detail.customer?.billAddress?.address;

      // Determine the 'cabang' based on the `branchId` of the sales return
      // We need to look up the branch name from the `branchId` if `branchName` is not directly available in `detail`.
      // The `branchName` is available in the `fetchReturn` response, but not always directly in `fetchReturnDetail`.
      // Let's use `salesReturnHeader.branchName` if available, otherwise assume a default mapping.
      const sourceBranchName = salesReturnHeader.branchName || "Unknown Branch";
      const cabang = warehouseToCabangMap[sourceBranchName] || sourceBranchName;

      // For sales returns, `tujuan_mutasi` (destination of mutation/transfer) might not be a direct "warehouse" concept.
      // It's a return FROM a customer, so 'tujuan_mutasi' might conceptually be the 'branch' or 'warehouse' it's returned to.
      // In your original sales return JSON, the `detailItem[0].warehouse.name` indicates the warehouse *receiving* the return.
      const destinationWarehouseName = detail.detailItem[0]?.warehouse?.name;
      const cabangTujuan =
        warehouseToCabangMap[destinationWarehouseName ?? ""] ??
        destinationWarehouseName;

      for (const detailItem of detail.detailItem) {
        const quantity = getQuantity(detailItem);
        const unitName = detailItem.itemUnit?.name ?? "unit";

        // For sales returns, the 'tanggal_transfer' (transfer date) should be the sales return's transDate.
        // 'sumber_mutasi' (source of mutation/transfer) is the customer.
        // 'tujuan_mutasi' (destination of mutation/transfer) is the branch/warehouse receiving the return.

        const record = {
          quantity: detailItem.item?.salesInvoiceDetail.returnQuantity,
          cabang: cabangTujuan, // Warehouse receiving the return
          invoice_code: detail.invoice?.number,
          nama_costumer: customerShipAddress || customerBillAddress, // Customer's shipping or billing address
          nama_sales: detailItem.salesmanName, // Salesman name from the detail item
          nama_barang: detailItem.item?.name,
          kode_barang: detailItem.item?.no,
          tanggal_return: detail.transDateView,
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
      message: `Sync complete. Processed ${recordsToUpsert.length} records for upsert. Skipped ${skippedCount} sales returns.`,
    });
  } catch (error: any) {
    console.error("Error in POST function:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
