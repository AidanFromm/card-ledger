import { useState, useRef } from "react";
import { Printer, FileDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { Database } from "@/integrations/supabase/types";

type InventoryItem = Database["public"]["Tables"]["inventory_items"]["Row"];

interface PrintExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: InventoryItem[];
}

export const PrintExportDialog = ({ open, onOpenChange, items }: PrintExportDialogProps) => {
  const [includeImages, setIncludeImages] = useState(true);
  const printRef = useRef<HTMLDivElement>(null);

  const fmt = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const totalValue = items.reduce((s, i) => s + (i.market_price || i.purchase_price) * i.quantity, 0);
  const totalCost = items.reduce((s, i) => s + i.purchase_price * i.quantity, 0);
  const totalQty = items.reduce((s, i) => s + i.quantity, 0);

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>CardLedger Inventory</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 20px; color: #1a1a1a; }
          h1 { font-size: 24px; margin-bottom: 4px; }
          .subtitle { color: #666; font-size: 14px; margin-bottom: 20px; }
          .summary { display: flex; gap: 24px; margin-bottom: 20px; padding: 12px; background: #f5f5f5; border-radius: 8px; }
          .summary-item { text-align: center; }
          .summary-label { font-size: 11px; color: #888; text-transform: uppercase; }
          .summary-value { font-size: 18px; font-weight: 700; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; }
          th { text-align: left; padding: 8px 6px; border-bottom: 2px solid #ddd; font-size: 11px; text-transform: uppercase; color: #666; }
          td { padding: 6px; border-bottom: 1px solid #eee; vertical-align: middle; }
          tr:nth-child(even) { background: #fafafa; }
          .img-cell img { width: 30px; height: 42px; object-fit: contain; border-radius: 3px; }
          .text-right { text-align: right; }
          .positive { color: #16a34a; }
          .negative { color: #dc2626; }
          @media print {
            body { padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        ${printContent.innerHTML}
      </body>
      </html>
    `);
    win.document.close();
    setTimeout(() => { win.print(); }, 500);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl border-border/30 bg-card/95 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Printer className="h-5 w-5 text-primary" />
            Print / Export Inventory
          </DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-4 mb-4">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={includeImages} onChange={e => setIncludeImages(e.target.checked)} className="rounded" />
            Include images
          </label>
          <div className="flex-1" />
          <Button onClick={handlePrint} className="gap-2 rounded-xl">
            <Printer className="h-4 w-4" /> Print / Save as PDF
          </Button>
        </div>

        {/* Preview */}
        <div ref={printRef} className="bg-white text-black p-6 rounded-xl text-sm">
          <h1>CardLedger Inventory</h1>
          <p className="subtitle">Generated {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>

          <div className="summary">
            <div className="summary-item">
              <div className="summary-label">Total Cards</div>
              <div className="summary-value">{totalQty}</div>
            </div>
            <div className="summary-item">
              <div className="summary-label">Total Value</div>
              <div className="summary-value">${fmt(totalValue)}</div>
            </div>
            <div className="summary-item">
              <div className="summary-label">Total Cost</div>
              <div className="summary-value">${fmt(totalCost)}</div>
            </div>
            <div className="summary-item">
              <div className="summary-label">Profit/Loss</div>
              <div className={`summary-value ${totalValue - totalCost >= 0 ? 'positive' : 'negative'}`}>
                {totalValue - totalCost >= 0 ? '+' : ''}${fmt(Math.abs(totalValue - totalCost))}
              </div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                {includeImages && <th style={{ width: '40px' }}></th>}
                <th>Name</th>
                <th>Set</th>
                <th>Grade</th>
                <th className="text-right">Qty</th>
                <th className="text-right">Cost</th>
                <th className="text-right">Value</th>
                <th className="text-right">P&L</th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => {
                const val = (item.market_price || item.purchase_price) * item.quantity;
                const cost = item.purchase_price * item.quantity;
                const pnl = val - cost;
                return (
                  <tr key={item.id}>
                    {includeImages && (
                      <td className="img-cell">
                        {item.card_image_url && <img src={item.card_image_url} alt="" />}
                      </td>
                    )}
                    <td style={{ fontWeight: 600 }}>{item.name}</td>
                    <td>{item.set_name}</td>
                    <td>{item.grading_company !== 'raw' ? `${item.grading_company?.toUpperCase()} ${item.grade}` : 'Raw'}</td>
                    <td className="text-right">{item.quantity}</td>
                    <td className="text-right">${fmt(cost)}</td>
                    <td className="text-right">${fmt(val)}</td>
                    <td className={`text-right ${pnl >= 0 ? 'positive' : 'negative'}`}>
                      {pnl >= 0 ? '+' : ''}${fmt(Math.abs(pnl))}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PrintExportDialog;
