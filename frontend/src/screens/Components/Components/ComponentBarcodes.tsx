import { 
  Search, Filter, ArrowLeft, QrCode, Barcode, Printer, 
  FileDown, Loader2, PackageSearch, Calendar, Settings2
} from "lucide-react";
import { useState, useEffect, useMemo, type JSX } from "react";

interface IssuedMaterial {
  transaction_id: number;
  work_order_id: string;
  component_id: number;
  component_name: string;
  warehouse_id: number;
  quantity: number;
  transaction_date: string;
  transaction_type: 'EXPORT';
  note: string;
}

const mockIssuedMaterials: IssuedMaterial[] = [
  { transaction_id: 2001, work_order_id: "WO-2025-001", component_id: 101, component_name: "CPU Chipset A1", warehouse_id: 2, quantity: 150, transaction_date: "2026-04-27T10:30:00Z", transaction_type: "EXPORT", note: "Standard export" },
  { transaction_id: 2005, work_order_id: "WO-2025-002", component_id: 105, component_name: "OLED Display 1.5inch", warehouse_id: 1, quantity: 50, transaction_date: "2026-04-28T08:15:00Z", transaction_type: "EXPORT", note: "Urgent issue" },
];

export const ComponentBarcodes = (): JSX.Element => {
  const [selectedLot, setSelectedLot] = useState<IssuedMaterial | null>(null);
  
  const [lots, setLots] = useState<IssuedMaterial[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [symbology, setSymbology] = useState<'QR' | 'CODE128'>('QR');
  const [labelQty, setLabelQty] = useState<number>(1);
  const [template, setTemplate] = useState<'50x30' | '35x22'>('50x30');
  const [isPrinting, setIsPrinting] = useState(false);

  useEffect(() => {
    setTimeout(() => {
      setLots(mockIssuedMaterials);
      setIsLoading(false);
    }, 500);
  }, []);

  useEffect(() => {
    if (selectedLot) {
      setLabelQty(1);
      setSymbology('QR');
    }
  }, [selectedLot]);

  const filteredLots = useMemo(() => {
    return lots.filter(lot => {
      const q = searchQuery.toLowerCase();
      return lot.work_order_id.toLowerCase().includes(q) || 
             lot.component_name.toLowerCase().includes(q) ||
             `REQ-${lot.transaction_id}`.toLowerCase().includes(q);
    });
  }, [lots, searchQuery]);

  const finalBarcodeString = selectedLot 
    ? `COMP_${selectedLot.component_id}_WH_${selectedLot.warehouse_id}_BATCH_${selectedLot.work_order_id}`
    : "";

  const handlePrintLabels = async () => {
    if (!selectedLot) return;

    window.print();

    setIsPrinting(true);
    try {
      console.log(`[API CALL] Updating transaction ${selectedLot.transaction_id} with note: [LABELED]`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      alert("In tem và lưu trạng thái định danh thành công!");
      
      setLots(prev => prev.filter(l => l.transaction_id !== selectedLot.transaction_id));
      setSelectedLot(null);
    } catch (error) {
      alert("Lỗi khi cập nhật trạng thái lên server.");
    } finally {
      setIsPrinting(false);
    }
  };

  const handleExportPDF = () => {
    alert("Tính năng xuất PDF đang được phát triển. Vui lòng sử dụng tính năng In (Print) và chọn 'Save as PDF' ở hộp thoại máy in.");
  };

  if (!selectedLot) {
    return (
      <div className="flex flex-col gap-6 pb-12 animate-in fade-in duration-300">
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm flex flex-col min-h-[500px]">
          <div className="p-6 border-b border-gray-100 bg-gray-50/50 rounded-t-lg">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <QrCode className="w-6 h-6 text-blue-600" /> Component Barcodes
            </h2>
            <p className="text-sm text-gray-500 mt-1">Tạo và in tem nhãn định danh cho linh kiện đã xuất kho.</p>
          </div>

          <div className="p-4 border-b border-gray-200 flex items-center justify-between gap-4">
            <div className="relative w-80">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <input 
                type="text" placeholder="Search Work Order, Component..." 
                value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" 
              />
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-200 text-gray-600 font-medium rounded-lg text-sm cursor-pointer hover:bg-gray-100">
              <Filter className="w-4 h-4"/> Filters
            </button>
          </div>

          <div className="flex-1 overflow-x-auto">
            {isLoading ? (
              <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
            ) : (
              <table className="w-full text-left border-collapse">
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
                  {filteredLots.map((lot) => (
                    <tr key={lot.transaction_id} className="hover:bg-gray-50">
                      <td className="p-4 font-mono font-bold text-blue-600">REQ-{lot.transaction_id}</td>
                      <td className="p-4 font-bold text-gray-700">{lot.work_order_id}</td>
                      <td className="p-4 font-medium text-gray-900">{lot.component_name}</td>
                      <td className="p-4 text-right font-bold text-blue-700">{lot.quantity}</td>
                      <td className="p-4 text-gray-600 flex items-center gap-1.5 mt-1">
                          <Calendar className="w-3.5 h-3.5" /> {new Date(lot.transaction_date).toLocaleDateString('vi-VN')}
                      </td>
                      <td className="p-4 text-center">
                        <button 
                          onClick={() => setSelectedLot(lot)}
                          className="flex items-center justify-center gap-1.5 px-4 py-1.5 mx-auto bg-[#22c55e] text-white font-bold rounded hover:bg-[#16a34a] transition-colors text-xs cursor-pointer shadow-sm"
                        >
                          <QrCode className="w-3.5 h-3.5" /> Generate Barcode
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredLots.length === 0 && <tr><td colSpan={6} className="p-12 text-center text-gray-400">Không có lô linh kiện nào chờ dán nhãn.</td></tr>}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 pb-20 animate-in slide-in-from-right-4 duration-300 print:m-0 print:p-0">
      
      <div className="print:hidden">
        <div className="flex items-center gap-4 mb-6">
            <button onClick={() => setSelectedLot(null)} className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-gray-600 cursor-pointer">
            <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
            <h2 className="text-2xl font-bold text-gray-900">Barcode Generation & Printing</h2>
            <p className="text-sm text-gray-500 font-mono">Lot Target: REQ-{selectedLot.transaction_id}</p>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            <div className="lg:col-span-7 space-y-6">
                
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
                    <h3 className="text-sm font-bold text-gray-900 uppercase flex items-center gap-2 border-b pb-3">
                        <PackageSearch className="w-5 h-5 text-blue-600" /> Zone 1: Reference Info
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                            <span className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Export / Request Ref</span>
                            <span className="text-sm font-mono font-bold text-gray-900">REQ-{selectedLot.transaction_id}</span>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                            <span className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Work Order Ref</span>
                            <span className="text-sm font-bold text-gray-900">{selectedLot.work_order_id}</span>
                        </div>
                        <div className="p-3 bg-blue-50 rounded-lg border border-blue-100 col-span-2">
                            <span className="text-[10px] font-bold text-blue-600 uppercase block mb-1">Component Details</span>
                            <span className="text-base font-bold text-gray-900 block">{selectedLot.component_name}</span>
                            <span className="text-xs font-mono text-gray-500 mt-1">ID: {selectedLot.component_id} | WH: {selectedLot.warehouse_id}</span>
                        </div>
                        <div className="p-3 bg-green-50 rounded-lg border border-green-200 col-span-2 flex justify-between items-center">
                            <span className="text-xs font-bold text-green-700 uppercase">Batch Receipt Quantity:</span>
                            <span className="text-xl font-black text-green-700">{selectedLot.quantity}</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
                    <h3 className="text-sm font-bold text-gray-900 uppercase flex items-center gap-2 border-b pb-3">
                        <Settings2 className="w-5 h-5 text-blue-600" /> Zone 2: Logic Configuration
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-bold text-gray-700 block mb-1.5">Barcode String (Auto-generated)</label>
                            <input 
                                type="text" readOnly value={finalBarcodeString}
                                className="w-full p-3 bg-gray-100 border border-gray-300 rounded-lg text-sm font-mono font-bold text-gray-600"
                            />
                            <p className="text-[10px] text-gray-500 mt-1">Formula: COMP_[id]_WH_[id]_BATCH_[wo_id]</p>
                        </div>
                        <div>
                            <label className="text-sm font-bold text-gray-700 block mb-1.5">Symbology</label>
                            <select 
                                value={symbology} onChange={(e) => setSymbology(e.target.value as any)}
                                className="w-full p-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                            >
                                <option value="QR">QR Code (Recommended for compact tags)</option>
                                <option value="CODE128">Code 128 (Standard linear barcode)</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            <div className="lg:col-span-5 space-y-6">
                
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-5">
                    <h3 className="text-sm font-bold text-gray-900 uppercase flex items-center gap-2 border-b pb-3">
                        <Printer className="w-5 h-5 text-blue-600" /> Zone 3: Settings & Preview
                    </h3>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-gray-700 uppercase block mb-1.5">Labels to Print</label>
                            <input 
                                type="number" min="1" max={selectedLot.quantity}
                                value={labelQty} onChange={(e) => setLabelQty(Number(e.target.value))}
                                className="w-full p-2 border border-gray-300 rounded-lg text-sm text-center font-bold outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-700 uppercase block mb-1.5">Template</label>
                            <select 
                                value={template} onChange={(e) => setTemplate(e.target.value as any)}
                                className="w-full p-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                            >
                                <option value="50x30">50x30 mm (Large)</option>
                                <option value="35x22">35x22 mm (Small)</option>
                            </select>
                        </div>
                    </div>

                    {/* KHUNG PREVIEW ĐỒ HỌA */}
                    <div className="mt-4 border-2 border-dashed border-gray-300 bg-gray-100 rounded-xl p-6 flex justify-center items-center">
                        {/* Simulation của 1 con tem */}
                        <div className={`bg-white border border-gray-400 shadow-md p-4 flex flex-col items-center justify-between relative overflow-hidden transition-all
                            ${template === '50x30' ? 'w-[280px] h-[168px]' : 'w-[220px] h-[138px] scale-90'}
                        `}>
                            {/* Header */}
                            <div className="w-full text-center border-b border-gray-300 pb-1 mb-1">
                                <h4 className="text-[10px] font-black uppercase truncate">{selectedLot.component_name}</h4>
                            </div>
                            
                            <div className="flex-1 w-full flex items-center justify-center">
                                {symbology === 'QR' ? (
                                    <QrCode className="w-16 h-16 text-black" /> // Fake QR using Icon
                                ) : (
                                    <Barcode className="w-24 h-12 text-black" /> // Fake Barcode using Icon
                                )}
                            </div>
                            
                            <div className="w-full text-center mt-1">
                                <p className="text-[8px] font-bold">RECV: {new Date(selectedLot.transaction_date).toLocaleDateString('vi-VN')}</p>
                                <p className="text-[7px] font-mono text-gray-600 mt-0.5 truncate">{finalBarcodeString}</p>
                            </div>
                            
                            <div className="absolute inset-0 bg-white/80 flex flex-col items-center justify-center opacity-0 hover:opacity-100 transition-opacity text-center px-4">
                                <p className="text-[10px] text-gray-600 font-bold mb-1">💡 Developer Note:</p>
                                <p className="text-[9px] text-gray-500 leading-tight">Requires <code className="bg-gray-200 px-1 rounded">qrcode.react</code> or <code className="bg-gray-200 px-1 rounded">react-barcode</code> for true rendering.</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-3">
                    <button 
                        onClick={handleExportPDF}
                        className="w-full flex items-center justify-center gap-2 py-3 bg-white border border-gray-300 text-gray-700 font-bold rounded-lg hover:bg-gray-50 transition-colors shadow-sm cursor-pointer"
                    >
                        <FileDown className="w-4 h-4" /> Export PDF
                    </button>
                    <button 
                        onClick={handlePrintLabels}
                        disabled={isPrinting}
                        className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                    >
                        {isPrinting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Printer className="w-5 h-5" />} 
                        {isPrinting ? "Saving Status..." : `Print ${labelQty} Labels`}
                    </button>
                </div>
            </div>
        </div>
      </div>

      <div className="hidden print:block print:w-full print:h-full">
         {Array.from({ length: labelQty }).map((_, i) => (
            <div key={i} className={`flex flex-col items-center justify-between border border-black bg-white box-border break-inside-avoid mb-4
                ${template === '50x30' ? 'w-[50mm] h-[30mm] p-1' : 'w-[35mm] h-[22mm] p-0.5'}
            `}>
                <div className="w-full text-center border-b border-black pb-0.5">
                    <h4 className={`${template === '50x30' ? 'text-[8px]' : 'text-[6px]'} font-black uppercase truncate leading-none`}>
                        {selectedLot.component_name}
                    </h4>
                </div>
                
                <div className="flex-1 w-full flex items-center justify-center">
                    {symbology === 'QR' ? (
                        <QrCode className={template === '50x30' ? 'w-10 h-10 text-black' : 'w-6 h-6 text-black'} strokeWidth={1.5} />
                    ) : (
                        <div className="flex flex-col items-center">
                           <Barcode className={template === '50x30' ? 'w-16 h-6 text-black' : 'w-12 h-4 text-black'} strokeWidth={1} />
                        </div>
                    )}
                </div>
                
                <div className="w-full text-center">
                    <p className={`${template === '50x30' ? 'text-[6px]' : 'text-[5px]'} font-mono leading-none truncate`}>
                        {finalBarcodeString}
                    </p>
                </div>
            </div>
         ))}
      </div>

      <style>{`
        @media print {
          @page { margin: 0; }
          body { 
            background: white; 
            margin: 0; 
            padding: 0;
            -webkit-print-color-adjust: exact;
          }
          /* Loại bỏ padding dư thừa của các container bên ngoài nếu có */
          .pb-20, .p-8 { padding: 0 !important; }
        }
      `}</style>

    </div>
  );
};