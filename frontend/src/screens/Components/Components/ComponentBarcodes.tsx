import { 
  Search, ArrowLeft, QrCode, Printer, 
  Loader2, PackageSearch, Calendar, Settings2,
} from "lucide-react";
import { useState, useEffect, useMemo, type JSX } from "react";
// Import libraries for generating actual barcodes (install: npm install react-barcode react-qr-code)
import BarcodeGenerator from "react-barcode";
import QRCodeGenerator from "react-qr-code";

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
    component: { componentName: "1.5 inch OLED display", code: "COMP-101", unit: "pcs" },
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
    note: "Urgent delivery [BARCODE_GENERATED]", 
    componentId: 103,
    warehouseId: 1,
    workOrderId: 5002,
    component: { componentName: "ABS plastic housing", code: "COMP-103", unit: "pcs" },
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

  const fetchIssuedMaterials = async () => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 600));
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

  // Industrial-standard encoded string for location traceability
  const finalBarcodeString = useMemo(() => {
    if (!selectedTx) return "";
    return `COMP_${selectedTx.componentId}_WH_${selectedTx.warehouseId}_WO_${selectedTx.workOrderId}`;
  }, [selectedTx]);

  const handlePrintAndConfirm = async () => {
    if (!selectedTx) return;
    
    // Trigger the browser print dialog
    window.print();

    setIsUpdating(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      const newNote = selectedTx.note ? `${selectedTx.note} [BARCODE_GENERATED]` : `[BARCODE_GENERATED]`;
      const txIndex = mockTransactions.findIndex(tx => tx.transactionId === selectedTx.transactionId);
      if (txIndex !== -1) {
        mockTransactions[txIndex].note = newNote;
      }

      alert("Label printed and status updated successfully.");
      setSelectedTx(null);
      fetchIssuedMaterials(); 
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
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col min-h-[500px]">
          <div className="p-6 border-b border-gray-100 bg-gray-50/50 rounded-t-xl">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <QrCode className="w-6 h-6 text-blue-600" /> Print Component Tray Barcodes
            </h2>
            <p className="text-sm text-gray-500 mt-1">Components recently issued from the warehouse and waiting for location label printing.</p>
          </div>

          <div className="p-4 border-b border-gray-200">
            <div className="relative w-80">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <input 
                type="text" placeholder="Search by WO code or component name..." 
                value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white" 
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
                    <th className="p-4">Issue ID</th>
                    <th className="p-4">Work Order (WO)</th>
                    <th className="p-4">Component Name</th>
                    <th className="p-4 text-right">Issued Quantity</th>
                    <th className="p-4">Issue Time</th>
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
                      <td className="p-4 text-gray-600 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-gray-400" /> 
                          {new Date(tx.transactionDate).toLocaleString('en-US')}
                      </td>
                      <td className="p-4 text-center">
                        <button 
                          onClick={() => { setSelectedTx(tx); setLabelQty(1); }}
                          className="px-4 py-1.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors text-xs cursor-pointer shadow-sm active:scale-95"
                        >
                          Configure Label
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredTransactions.length === 0 && <tr><td colSpan={6} className="p-12 text-center text-gray-400 italic">No components are waiting for barcode printing.</td></tr>}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    );
  }

  // --- VIEW 2: CONFIGURATION & ACTUAL BARCODE PREVIEW ---
  return (
    <div className="flex flex-col gap-6 pb-20 animate-in slide-in-from-right-4 duration-300 print:m-0 print:p-0 w-full">
      
      <div className="print:hidden">
        <div className="flex items-center gap-4 mb-6">
            <button onClick={() => setSelectedTx(null)} className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 cursor-pointer shadow-sm">
                <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
                <h2 className="text-2xl font-bold text-gray-900">Design Material Tray Label</h2>
                <p className="text-sm text-gray-500 font-mono">Export ID: {selectedTx.transactionId} | {selectedTx.component.componentName}</p>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Source data configuration */}
            <div className="lg:col-span-7 space-y-6">
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
                    <h3 className="text-sm font-bold text-gray-900 uppercase flex items-center gap-2 border-b pb-3">
                        <PackageSearch className="w-5 h-5 text-blue-600" /> Section 1: Source Information
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                            <span className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Transaction ID</span>
                            <span className="text-sm font-mono font-bold text-gray-900">#{selectedTx.transactionId}</span>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                            <span className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Work Order (WO)</span>
                            <span className="text-sm font-bold text-gray-900">{selectedTx.workOrder?.code || 'N/A'}</span>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                            <span className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Component Name</span>
                            <span className="text-sm font-bold text-gray-900">{selectedTx.component.componentName} (ID: {selectedTx.componentId})</span>
                        </div>
                        <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg flex justify-between items-center">
                            <div>
                                <span className="text-[10px] font-bold text-blue-600 uppercase block">Received Quantity</span>
                                <span className="text-xl font-black text-blue-700">{selectedTx.quantity} {selectedTx.component.unit}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
                    <h3 className="text-sm font-bold text-gray-900 uppercase flex items-center gap-2 border-b pb-3">
                        <Settings2 className="w-5 h-5 text-blue-600" /> Section 2: Encoded Data Format
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-bold text-gray-700 uppercase">System-Generated Barcode String (Data String)</label>
                            <input 
                                type="text" readOnly value={finalBarcodeString}
                                className="w-full p-3 bg-gray-50 mt-1 border border-gray-300 rounded-lg text-sm font-mono font-bold text-gray-600"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-700 uppercase">Barcode Symbology</label>
                            <select 
                                value={symbology} onChange={(e) => setSymbology(e.target.value as any)}
                                className="w-full p-2.5 border mt-1 border-gray-300 rounded-lg text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer bg-white"
                            >
                                <option value="QR">2D - QR Code (compact - stores more information)</option>
                                <option value="CODE128">1D - Code 128 (traditional linear barcode standard)</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Actual 50x30mm label preview zone */}
            <div className="lg:col-span-5 space-y-6">
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-5">
                    <h3 className="text-sm font-bold text-gray-900 uppercase flex items-center gap-2 border-b pb-3">
                        <Printer className="w-5 h-5 text-blue-600" /> Section 3: Print Settings & Preview
                    </h3>

                    <div className="flex flex-col items-center gap-4">
                        <label className="w-full text-xs font-bold text-gray-700 uppercase">
                            Number of labels to print
                            <input 
                                type="number" min="1" 
                                value={labelQty} onChange={(e) => setLabelQty(Number(e.target.value))}
                                className="w-full p-3 border mt-1 border-gray-300 rounded-lg text-center font-bold text-lg focus:ring-2 focus:ring-blue-500 bg-white"
                            />
                        </label>

                        {/* Factory-standard thermal label mockup */}
                        <div className="w-[300px] h-[180px] bg-white border border-black p-3.5 flex flex-col justify-between shadow-2xl relative text-black select-none">
                            <div className="w-full pb-1 border-b border-black flex justify-between items-center">
                                <h4 className="text-[10px] font-black uppercase truncate max-w-[200px]">{selectedTx.component.componentName}</h4>
                                <span className="text-[8px] font-mono font-bold border border-black px-1 rounded bg-gray-50">MAT-IN</span>
                            </div>
                            
                            <div className="flex-1 flex items-center justify-between py-2 gap-3 overflow-hidden">
                                <div className="w-[40%] flex items-center justify-center">
                                    {symbology === 'QR' ? (
                                        <div className="p-1 border border-gray-100">
                                            <QRCodeGenerator value={finalBarcodeString} size={80} level="M" />
                                        </div>
                                    ) : (
                                        <div className="scale-x-[0.9] scale-y-[1.1] origin-left w-[140px]">
                                            <BarcodeGenerator value={finalBarcodeString} height={50} width={1.2} displayValue={false} margin={0} />
                                        </div>
                                    )}
                                </div>
                                <div className="w-[60%] border-l border-black pl-3 h-full flex flex-col justify-center space-y-1">
                                    <div>
                                       <span className="text-[7px] text-gray-400 font-bold block uppercase leading-none">Component Code:</span>
                                       <span className="text-xs font-mono font-bold text-gray-900 leading-none">{selectedTx.component.code}</span>
                                    </div>
                                    <div className="pt-1">
                                       <span className="text-[7px] text-gray-400 font-bold block uppercase leading-none">Work Order:</span>
                                       <span className="text-xs font-mono font-black text-gray-800 leading-none">{selectedTx.workOrder?.code || 'N/A'}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="w-full text-[7px] font-bold flex justify-between border-t border-black pt-1 font-mono text-gray-600">
                                <span>QTY: {selectedTx.quantity} {selectedTx.component.unit.toUpperCase()}</span>
                                <span>DATE: {new Date(selectedTx.transactionDate).toLocaleDateString('en-US')}</span>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 space-y-3">
                        <button 
                            onClick={handlePrintAndConfirm}
                            disabled={isUpdating}
                            className="w-full flex items-center justify-center gap-2 py-3.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer text-sm"
                        >
                            {isUpdating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Printer className="w-5 h-5" />} 
                            Confirm & Print ({labelQty} labels)
                        </button>
                        <button 
                            onClick={() => setSelectedTx(null)}
                            className="w-full py-2.5 bg-white border border-gray-300 text-gray-600 font-bold rounded-xl hover:bg-gray-50 cursor-pointer text-xs"
                        >
                            Back to List
                        </button>
                    </div>
                </div>
            </div>
        </div>
      </div>
 
      {/* ========================================== */}
      {/* PHYSICAL BATCH PRINTING OUTPUT AREA */}
      {/* ========================================== */}
      <div className="hidden print:block">
         {Array.from({ length: labelQty }).map((_, i) => (
            <div key={i} className="w-[50mm] h-[30mm] border border-black p-2 flex flex-col justify-between break-inside-avoid mb-4 mx-auto bg-white text-black font-sans">
                <div className="w-full pb-0.5 border-b border-black flex justify-between items-center">
                    <h4 className="text-[7px] font-black uppercase truncate max-w-[120mm]">{selectedTx.component.componentName}</h4>
                    <span className="text-[5px] font-mono font-bold border border-black px-0.5 rounded">OK</span>
                </div>
                
                <div className="flex-1 flex items-center justify-between py-1 gap-1 overflow-hidden">
                    <div className="w-[35%] flex items-center justify-center">
                        {symbology === 'QR' ? (
                            <QRCodeGenerator value={finalBarcodeString} size={48} level="M" />
                        ) : (
                            <div className="scale-x-[0.65] scale-y-[0.85] origin-center">
                                <BarcodeGenerator value={finalBarcodeString} height={35} width={1.0} displayValue={false} margin={0} />
                            </div>
                        )}
                    </div>
                    <div className="w-[65%] border-l border-black pl-1.5 h-full flex flex-col justify-center">
                        <span className="text-[5px] font-bold text-gray-400 block leading-none">MATERIAL CODE:</span>
                        <span className="text-[8px] font-mono font-black tracking-tight leading-none mb-1">{selectedTx.component.code}</span>
                        <span className="text-[5px] font-bold text-gray-400 block leading-none">WORK ORDER:</span>
                        <span className="text-[8px] font-mono font-bold leading-none">{selectedTx.workOrder?.code || 'N/A'}</span>
                    </div>
                </div>

                <div className="w-full text-[5px] font-bold flex justify-between border-t border-black pt-0.5 font-mono">
                    <span>QTY: {selectedTx.quantity} {selectedTx.component.unit.toUpperCase()}</span>
                    <span>DATE: {new Date(selectedTx.transactionDate).toLocaleDateString('en-US')}</span>
                </div>
            </div>
         ))}
      </div>

      <style>{`
        @media print {
          @page { size: 50mm 30mm; margin: 0; }
          body * { visibility: hidden; }
          .print\\:block, .print\\:block * { visibility: visible; }
          .print\\:block { position: absolute; left: 0; top: 0; width: 100%; display: flex; flex-direction: column; gap: 0; }
        }
      `}</style>
    </div>
  );
};
