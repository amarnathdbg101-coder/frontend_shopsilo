import { POSSaleResponse } from "@/features/merchant/types";
import { formatCurrency } from "@/utils/format";

export interface ThermalReceiptData {
  shopName: string;
  shopAddress?: string;
  shopPhone?: string;
  billNumber: string;
  dateStr: string;
  customerPhone?: string;
  paymentMethod: string;
  subtotal: number;
  discount: number;
  grandTotal: number;
  cashAmount?: number;
  onlineAmount?: number;
  khataAmount?: number;
  items: Array<{
    name: string;
    qty: number;
    rate: number;
    total: number;
  }>;
}

/**
 * ESC/POS Thermal Receipt Commands & Formatter Engine.
 * Generates formatted 32-column / 48-column text for 2-inch and 3-inch
 * Bluetooth thermal receipt printers used in Indian Kirana & Retail stores.
 */
export function formatThermalReceiptText(data: ThermalReceiptData): string {
  const line = "--------------------------------\n";
  let text = "";

  // 1. Header (Centered Store Title)
  text += `${data.shopName.toUpperCase()}\n`;
  if (data.shopAddress) text += `${data.shopAddress}\n`;
  if (data.shopPhone) text += `Phone: ${data.shopPhone}\n`;
  text += line;

  // 2. Receipt Meta
  text += `TAX INVOICE / CASH RECEIPT\n`;
  text += `Bill No: ${data.billNumber}\n`;
  text += `Date: ${data.dateStr}\n`;
  text += `Payment: ${data.paymentMethod.toUpperCase()}\n`;
  if (data.customerPhone) text += `Customer: ${data.customerPhone}\n`;
  text += line;

  // 3. Itemized Table
  text += `Item                 Qty  Amount\n`;
  text += line;

  for (const it of data.items) {
    let name = it.name;
    if (name.length > 18) {
      name = name.slice(0, 16) + "..";
    }
    const namePadded = name.padEnd(18, " ");
    const qtyPadded = String(it.qty).padStart(4, " ");
    const amtPadded = fmtNum(it.total).padStart(8, " ");
    text += `${namePadded}${qtyPadded}${amtPadded}\n`;
  }

  text += line;

  // 4. Totals
  if (data.discount > 0) {
    text += `Subtotal:           ${fmtNum(data.subtotal).padStart(10, " ")}\n`;
    text += `Discount:          -${fmtNum(data.discount).padStart(10, " ")}\n`;
  }
  text += `GRAND TOTAL:       Rs. ${fmtNum(data.grandTotal).padStart(8, " ")}\n`;

  if (data.cashAmount && data.cashAmount > 0) {
    text += `Cash Paid:          Rs. ${fmtNum(data.cashAmount).padStart(8, " ")}\n`;
  }
  if (data.onlineAmount && data.onlineAmount > 0) {
    text += `Online / UPI:       Rs. ${fmtNum(data.onlineAmount).padStart(8, " ")}\n`;
  }
  if (data.khataAmount && data.khataAmount > 0) {
    text += `Added to Khata:     Rs. ${fmtNum(data.khataAmount).padStart(8, " ")}\n`;
  }

  text += line;
  text += `Thank you for shopping with us!\n`;
  text += `Digital Bill by Shopsilo OS\n\n\n`;

  return text;
}

function fmtNum(n: number): string {
  return (Math.round(n * 100) / 100).toFixed(2);
}

/**
 * Converts formatted receipt text into standard ESC/POS raw byte commands.
 */
export function generateEscPosBytes(receiptText: string): Uint8Array {
  const encoder = new TextEncoder();
  const textBytes = encoder.encode(receiptText);

  // ESC/POS Commands:
  // \x1B\x40 = Initialize
  // \x1B\x61\x01 = Center align
  // \x1D\x56\x41\x00 = Cut paper
  const initCmd = new Uint8Array([0x1b, 0x40, 0x1b, 0x61, 0x01]);
  const cutCmd = new Uint8Array([0x1d, 0x56, 0x41, 0x00]);

  const combined = new Uint8Array(initCmd.length + textBytes.length + cutCmd.length);
  combined.set(initCmd, 0);
  combined.set(textBytes, initCmd.length);
  combined.set(cutCmd, initCmd.length + textBytes.length);

  return combined;
}
