import { 
  Search, ArrowLeft, QrCode, Barcode, Printer, 
  Loader2, PackageSearch, Calendar, Settings2
} from "lucide-react";
import { useState, useEffect, useMemo, type JSX } from "react";

interface InventoryTransaction {
  transactionId: number;
  transactionDate: string;
  transactionType: string;
  quantity: number;
  note: string | null;
  componentId: number;
  warehouseId: number;
  workOrderId: number;
  component: {
    componentName: string;
    code: string;
    unit: string;
  };
  workOrder?: {
    code: string;
  };
}

const mockTransactions: InventoryTransaction[] = [
  {
    transactionId: 1001,
    transactionDate: "2026-05-06T08:30:00Z",
    transactionType: "EXPORT_PRODUCTION",
    quantity: 50,
    note: "Issue to assembly shop",
    componentId: 101,
    warehouseId: 1,
    workOrderId: 5001,
    component: { componentName: "Màn hình OLED 1.5 inch", code: "COMP-101", unit: "pcs" },
    workOrder: { code: "WO-2026-001" }
  },
  {
    transactionId: 1002,
    transactionDate: "2026-05-06T09:15:00Z",
    transactionType: "EXPORT_PRODUCTION",
    quantity: 200,
    note: null,
    componentId: 102,
    warehouseId: 1,
    workOrderId: 5001,
    component: { componentName: "Pin Lithium 500mAh", code: "COMP-102", unit: "pcs" },
    workOrder: { code: "WO-2026-001" }
  },
  {
    transactionId: 1003,
    transactionDate: "2026-05-05T14:20:00Z",
    transactionType: "EXPORT_PRODUCTION",
    quantity: 100,
    note: "Urgent delivery [BARCODE_GENERATED]", // This lot has been printed, will be filtered out
    componentId: 103,
    warehouseId: 1,
    workOrderId: 5002,
    component: { componentName: "Vỏ nhựa ABS", code: "COMP-103", unit: "pcs" },
    workOrder: { code: "WO-2026-002" }
  }
];

export const ComponentBarcodes = (): JSX.Element => {
  // --- LIST STATE (SECTION 1) ---
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // --- PRINT CONFIG STATE (SECTION 2) ---
  const [selectedTx, setSelectedTx] = useState<InventoryTransaction | null>(null);
  const [symbology, setSymbology] = useState<'QR' | 'CODE128'>('QR');
  const [labelQty, setLabelQty] = useState<number>(1);
  const [isUpdating, setIsUpdating] = useState(false);

  // ==========================================
  // 1. FETCH PENDING PRINT LIST FROM MOCK DATA
  // ==========================================
  const fetchIssuedMaterials = async () => {
    setIsLoading(true);
    try {
      // Giả lập thời gian delay mạng 600ms
      await new Promise(resolve => setTimeout(resolve, 600));
      
      // Lọc: Chỉ lấy những giao dịch CHƯA có cờ [BARCODE_GENERATED] trong note
      const pendingPrint = mockTransactions.filter(tx => 
        tx.transactionType === 'EXPORT_PRODUCTION' && !tx.note?.includes("[BARCODE_GENERATED]")
      ).sort((a, b) => 
        new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime()
      );
      
      setTransactions(pendingPrint);
    } catch (error) {
      console.error("Failed to fetch mock transactions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchIssuedMaterials();
  }, []);

  const finalBarcodeString = useMemo(() => {
    if (!selectedTx) return "";
    return `COMP_${selectedTx.componentId}_WH_${selectedTx.warehouseId}_BATCH_${selectedTx.workOrderId}`;
  }, [selectedTx]);

  const handlePrintAndConfirm = async () => {
    if (!selectedTx) return;
    
    window.print();

    setIsUpdating(true);
    try {
      // Giả lập thời gian gọi API Update
      await new Promise(resolve => setTimeout(resolve, 500));

      const newNote = selectedTx.note 
        ? `${selectedTx.note} [BARCODE_GENERATED]` 
        : `[BARCODE_GENERATED]`;
        
      // Cập nhật trực tiếp vào mock database tạm thời
      const txIndex = mockTransactions.findIndex(tx => tx.transactionId === selectedTx.transactionId);
      if (txIndex !== -1) {
        mockTransactions[txIndex].note = newNote;
      }

      alert("Printed and status confirmed successfully!");
      setSelectedTx(null);
      fetchIssuedMaterials(); // Refresh the pending list
    } catch (error) {
      console.error("Error updating printed status.", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      const q = searchQuery.toLowerCase();
      return tx.workOrder?.code?.toLowerCase().includes(q) || 
             tx.component.componentName.toLowerCase().includes(q);
    });
  }, [transactions, searchQuery]);

  // --- VIEW 1: RECEIVED COMPONENTS LIST ---
  if (!selectedTx) {
    return (
      <div className="flex flex-col gap-6 pb-12 animate-in fade-in duration-300">
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm flex flex-col min-h-[500px]">
          <div className="p-6 border-b border-gray-100 bg-gray-50/50 rounded-t-lg">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <QrCode className="w-6 h-6 text-blue-600" /> Component Barcodes
            </h2>
            <p className="text-sm text-gray-500 mt-1">List of components received from the warehouse waiting for bin barcode printing.</p>
          </div>

          <div className="p-4 border-b border-gray-200">
            <div className="relative w-80">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <input 
                type="text" placeholder="Search by WO, component name..." 
                value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" 
              />
            </div>
          </div>

          <div className="flex-1 overflow-x-auto">
            {isLoading ? (
              <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
            ) : (
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500 font-semibold border-b">
                  <tr>
                    <th className="p-4">Export Code</th>
                    <th className="p-4">Work Order</th>
                    <th className="p-4">Component</th>
                    <th className="p-4 text-right">Issued Qty</th>
                    <th className="p-4">Issue Date</th>
                    <th className="p-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-gray-100">
                  {filteredTransactions.map((tx) => (
                    <tr key={tx.transactionId} className="hover:bg-gray-50">
                      <td className="p-4 font-mono text-gray-500">#{tx.transactionId}</td>
                      <td className="p-4 font-bold text-gray-700">{tx.workOrder?.code || "N/A"}</td>
                      <td className="p-4 font-bold text-blue-600">{tx.component.componentName}</td>
                      <td className="p-4 text-right font-black">{tx.quantity} <span className="text-[10px] text-gray-400 font-normal">{tx.component.unit}</span></td>
                      <td className="p-4 text-gray-600 flex items-center gap-1.5 mt-2">
                          <Calendar className="w-3.5 h-3.5" /> 
                          {new Date(tx.transactionDate).toLocaleString('en-US')}
                      </td>
                      <td className="p-4 text-center">
                        <button 
                          onClick={() => { setSelectedTx(tx); setLabelQty(1); }}
                          className="px-4 py-1.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors text-xs cursor-pointer shadow-sm active:scale-95"
                        >
                          Generate Barcode
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredTransactions.length === 0 && <tr><td colSpan={6} className="p-12 text-center text-gray-400">No components waiting for barcode printing.</td></tr>}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    );
  }

  // --- VIEW 2: CONFIGURATION & PRINT ---
  return (
    <div className="flex flex-col gap-6 pb-20 animate-in slide-in-from-right-4 duration-300 print:m-0 print:p-0">
      
      {/* UI HIDDEN WHEN PRINTING */}
      <div className="print:hidden">
        <div className="flex items-center gap-4 mb-6">
            <button onClick={() => setSelectedTx(null)} className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 cursor-pointer shadow-sm">
                <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
                <h2 className="text-2xl font-bold text-gray-900">Barcode Generation & Printing</h2>
                <p className="text-sm text-gray-500 font-mono">Export ID: {selectedTx.transactionId} | Component: {selectedTx.component.componentName}</p>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 space-y-6">
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
                    <h3 className="text-sm font-bold text-gray-900 uppercase flex items-center gap-2 border-b pb-3">
                        <PackageSearch className="w-5 h-5 text-blue-600" /> Zone 1: Source Information
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                            <span className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Export ID</span>
                            <span className="text-sm font-mono font-bold text-gray-900">#{selectedTx.transactionId}</span>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                            <span className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Target WO</span>
                            <span className="text-sm font-bold text-gray-900">{selectedTx.workOrder?.code || 'N/A'}</span>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                            <span className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Component</span>
                            <span className="text-sm font-bold text-gray-900">{selectedTx.component.componentName} (ID: {selectedTx.componentId})</span>
                        </div>
                        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 flex justify-between items-center">
                            <div>
                                <span className="text-[10px] font-bold text-blue-600 uppercase block">Received Qty</span>
                                <span className="text-xl font-black text-blue-700">{selectedTx.quantity} {selectedTx.component.unit}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
                    <h3 className="text-sm font-bold text-gray-900 uppercase flex items-center gap-2 border-b pb-3">
                        <Settings2 className="w-5 h-5 text-blue-600" /> Zone 2: Identifier Configuration
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-bold text-gray-700 uppercase">Barcode String (System-generated)</label>
                            <input 
                                type="text" readOnly value={finalBarcodeString}
                                className="w-full p-3 bg-gray-100 mt-1 border border-gray-300 rounded-lg text-sm font-mono font-bold text-gray-600"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-700 uppercase">Symbology (Encoding Standard)</label>
                            <select 
                                value={symbology} onChange={(e) => setSymbology(e.target.value as any)}
                                className="w-full p-2.5 border mt-1 border-gray-300 rounded-lg text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                            >
                                <option value="QR">QR Code (Recommended - Compact)</option>
                                <option value="CODE128">Code 128 (Traditional 1D Barcode)</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            <div className="lg:col-span-5 space-y-6">
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-5">
                    <h3 className="text-sm font-bold text-gray-900 uppercase flex items-center gap-2 border-b pb-3">
                        <Printer className="w-5 h-5 text-blue-600" /> Zone 3: Label Preview
                    </h3>

                    <div className="flex flex-col items-center gap-4">
                        <label className="w-full text-xs font-bold text-gray-700 uppercase">
                            Number of barcodes to print (Labels to Print)
                            <input 
                                type="number" min="1" 
                                value={labelQty} onChange={(e) => setLabelQty(Number(e.target.value))}
                                className="w-full p-3 border mt-1 border-gray-300 rounded-lg text-center font-bold text-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </label>

                        {/* Label Preview Simulation */}
                        <div className="w-[280px] h-[168px] bg-white border-2 border-gray-900 p-3 flex flex-col items-center justify-between shadow-lg">
                            <div className="w-full text-center border-b border-gray-300">
                                <h4 className="text-[10px] font-black uppercase truncate">{selectedTx.component.componentName}</h4>
                            </div>
                            <div className="flex-1 flex items-center justify-center py-2">
                                {symbology === 'QR' ? <QrCode className="w-20 h-20" /> : <Barcode className="w-32 h-14" />}
                            </div>
                            <div className="w-full text-center">
                                <p className="text-[7px] font-mono font-bold truncate">{finalBarcodeString}</p>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 space-y-3">
                        <button 
                            onClick={handlePrintAndConfirm}
                            disabled={isUpdating}
                            className="w-full flex items-center justify-center gap-2 py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                        >
                            {isUpdating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Printer className="w-5 h-5" />} 
                            Print {labelQty} Barcodes
                        </button>
                        <button 
                            onClick={() => setSelectedTx(null)}
                            className="w-full py-3 bg-white border border-gray-300 text-gray-600 font-bold rounded-xl hover:bg-gray-50 cursor-pointer"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
      </div>
 
      <div className="hidden print:block">
         {Array.from({ length: labelQty }).map((_, i) => (
            <div key={i} className="w-[50mm] h-[30mm] border border-black p-1 flex flex-col items-center justify-between break-inside-avoid mb-2 mx-auto">
                <div className="w-full text-center border-b border-black">
                    <h4 className="text-[8px] font-bold uppercase truncate leading-none">{selectedTx.component.componentName}</h4>
                </div>
                <div className="flex-1 flex items-center justify-center">
                    {symbology === 'QR' ? <QrCode className="w-10 h-10" strokeWidth={1.5} /> : <Barcode className="w-16 h-6" strokeWidth={1} />}
                </div>
                <div className="w-full text-center">
                    <p className="text-[5px] font-mono leading-none truncate">{finalBarcodeString}</p>
                </div>
            </div>
         ))}
      </div>

      <style>{`
        @media print {
          @page { size: 50mm 30mm; margin: 0; }
          body * { visibility: hidden; }
          .print\\:block, .print\\:block * { visibility: visible; }
          .print\\:block { position: absolute; left: 0; top: 0; width: 100%; }
        }
      `}</style>
    </div>
  );
};