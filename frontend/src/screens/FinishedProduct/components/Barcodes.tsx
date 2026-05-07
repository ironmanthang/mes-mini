import { 
  Search, ArrowLeft, QrCode, Barcode, Printer, 
  CheckSquare, Loader2, Package, Settings2, Layers, RefreshCw
} from "lucide-react";
import { useState, useEffect, useMemo, type JSX } from "react";
import { 
    ProductInstanceServices, 
    type ProductInstanceListItem 
} from "../../../services/productInstanceServices";

export const Barcodes = (): JSX.Element => {
  const [viewMode, setViewMode] = useState<'LIST' | 'DETAIL'>('LIST');
  
  const [instances, setInstances] = useState<ProductInstanceListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  
  const [symbology, setSymbology] = useState<'QR' | 'CODE128'>('QR');
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchPendingLabels = async () => {
    setIsLoading(true);
    try {
      // Chỉ lấy status PENDING_QC theo đặc tả D.2
      const response = await ProductInstanceServices.getAllProductInstances({ 
        status: 'PENDING_QC',
        limit: 1000 
      });
      setInstances(response.data || []);
    } catch (error) {
      console.error("Failed to fetch instances:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingLabels();
  }, []);

  // ==========================================
  // 2. LOGIC SELECTION & FILTERS
  // ==========================================
  const filteredInstances = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return instances.filter(inst => 
      inst.serialNumber.toLowerCase().includes(q) || 
      inst.productionBatch.batchCode.toLowerCase().includes(q) ||
      inst.product.productName.toLowerCase().includes(q)
    );
  }, [instances, searchQuery]);

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredInstances.length) setSelectedIds([]);
    else setSelectedIds(filteredInstances.map(i => i.productInstanceId));
  };

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  // Dữ liệu cho Detail View
  const selectedData = instances.filter(i => selectedIds.includes(i.productInstanceId));
  const sample = selectedData[0]; 

  // ==========================================
  // 3. THỰC THI IN (MỤC 4)
  // ==========================================
  const handlePrintAction = async () => {
    if (selectedIds.length === 0) return;
    
    // 1. Kích hoạt lệnh in
    window.print();

    // 2. Sau khi đóng dialog in, cập nhật trạng thái (giả lập ghi log đã in)
    setIsUpdating(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      alert(`Successfully printed ${selectedIds.length} labels!`);
      
      // Temporarily remove from pending list on Frontend
      setInstances(prev => prev.filter(i => !selectedIds.includes(i.productInstanceId)));
      setSelectedIds([]);
      setViewMode('LIST');
    } catch (error) {
        alert("Error saving print log.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePrintEntireBatch = () => {
      if (!sample) return;
      const batchCode = sample.productionBatch.batchCode;
      const batchIds = instances
        .filter(i => i.productionBatch.batchCode === batchCode)
        .map(i => i.productInstanceId);
      setSelectedIds(batchIds);
  };

  // --- VIEW 1: PENDING LABEL LIST ---
  if (viewMode === 'LIST') {
    return (
      <div className="flex flex-col gap-6 pb-24 animate-in fade-in duration-300 relative">
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm flex flex-col min-h-[500px]">
          
          <div className="p-6 border-b border-gray-100 bg-gray-50/50 rounded-t-lg flex justify-between items-center">
            <div>
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <QrCode className="w-6 h-6 text-blue-600" /> Pending Label List
                </h2>
                <p className="text-sm text-gray-500 mt-1">Newly produced products waiting for Serial Number labels to be printed for identification.</p>
            </div>
            <button onClick={fetchPendingLabels} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <RefreshCw className={`w-5 h-5 text-gray-400 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="p-4 border-b border-gray-200">
            <div className="relative w-96">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <input 
                  type="text" placeholder="Search by Serial, Batch Code, Product Name..." 
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
                    <th className="p-4 w-12 text-center">
                        <input type="checkbox" checked={selectedIds.length > 0 && selectedIds.length === filteredInstances.length} onChange={toggleSelectAll} className="w-4 h-4 accent-blue-600 cursor-pointer" />
                    </th>
                    <th className="p-4">Serial Number</th>
                    <th className="p-4">Product Info</th>
                    <th className="p-4">Batch Code</th>
                    <th className="p-4">Produced Date</th>
                    <th className="p-4 text-center">Print Status</th>
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-gray-100">
                  {filteredInstances.map((inst) => (
                    <tr key={inst.productInstanceId} className={`hover:bg-gray-50 transition-colors ${selectedIds.includes(inst.productInstanceId) ? 'bg-blue-50/50' : ''}`}>
                      <td className="p-4 text-center">
                        <input type="checkbox" checked={selectedIds.includes(inst.productInstanceId)} onChange={() => toggleSelect(inst.productInstanceId)} className="w-4 h-4 accent-blue-600 cursor-pointer" />
                      </td>
                      <td className="p-4 font-mono font-black text-blue-700">{inst.serialNumber}</td>
                      <td className="p-4 font-bold text-gray-900">{inst.product.productName}</td>
                      <td className="p-4 font-mono text-gray-500">{inst.productionBatch.batchCode}</td>
                      <td className="p-4 text-gray-600">
                          {new Date(inst.createdAt).toLocaleString('en-US')}
                      </td>
                      <td className="p-4 text-center">
                         <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-yellow-100 text-yellow-700 border border-yellow-200">
                            PENDING PRINT
                         </span>
                      </td>
                    </tr>
                  ))}
                  {filteredInstances.length === 0 && <tr><td colSpan={6} className="p-12 text-center text-gray-400 italic">No products in the print queue.</td></tr>}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Floating Action Bar */}
        {selectedIds.length > 0 && (
            <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 bg-gray-900 text-white px-8 py-5 rounded-2xl shadow-2xl flex items-center gap-8 animate-in slide-in-from-bottom-5">
                <div className="flex items-center gap-4 border-r border-gray-700 pr-8">
                    <CheckSquare className="w-8 h-8 text-blue-400" />
                    <div>
                        <p className="text-sm font-bold">{selectedIds.length} products selected</p>
                        <p className="text-xs text-gray-400 uppercase tracking-widest">Ready to configure labels</p>
                    </div>
                </div>
                <button 
                    onClick={() => setViewMode('DETAIL')}
                    className="px-8 py-3 bg-blue-600 hover:bg-blue-500 font-bold rounded-xl transition-all active:scale-95 shadow-md flex items-center gap-2 cursor-pointer"
                >
                    <Settings2 className="w-5 h-5" /> Barcode Configuration
                </button>
            </div>
        )}
      </div>
    );
  }

  // --- VIEW 2: BARCODE CONFIGURATION & PREVIEW ---
  return (
    <div className="flex flex-col gap-6 pb-20 animate-in slide-in-from-right-4 duration-300 print:m-0 print:p-0">
      
      <div className="print:hidden">
        <div className="flex items-center gap-4 mb-6">
            <button onClick={() => setViewMode('LIST')} className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 cursor-pointer shadow-sm">
                <ArrowLeft className="w-5 h-5" />
            </button>
            <h2 className="text-2xl font-bold text-gray-900">Barcode Configuration & Preview</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Vùng 1 & 2: Info & Logic */}
            <div className="lg:col-span-7 space-y-6">
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-5">
                    <h3 className="text-sm font-bold text-gray-900 uppercase flex items-center gap-2 border-b pb-3">
                        <Package className="w-5 h-5 text-blue-600" /> Zone 1: Source Identification Info
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 col-span-2 flex items-center gap-4">
                            <Layers className="w-10 h-10 text-blue-200" />
                            <div>
                                <span className="text-[10px] font-bold text-gray-400 uppercase block">Product Name</span>
                                <p className="text-base font-bold text-gray-900">{sample?.product.productName} (ID: {sample?.product.productId})</p>
                            </div>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                            <span className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Batch Code</span>
                            <span className="text-sm font-mono font-bold text-gray-700">{sample?.productionBatch.batchCode}</span>
                        </div>
                        <div className="p-3 bg-gray-900 rounded-xl flex justify-between items-center text-white">
                            <span className="text-xs font-bold uppercase text-gray-400">Selected Count</span>
                            <span className="text-xl font-black text-blue-400">{selectedIds.length} units</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
                    <h3 className="text-sm font-bold text-gray-900 uppercase flex items-center gap-2 border-b pb-3">
                        <Settings2 className="w-5 h-5 text-blue-600" /> Zone 2: Retrieval Code Configuration
                    </h3>
                    <div className="space-y-4">
                        <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg">
                            <label className="text-xs font-bold text-blue-800 uppercase">Barcode String Formula (Auto)</label>
                            <p className="mt-1 font-mono text-xs font-bold text-blue-600 break-all">
                                FG_{sample?.product.productId}_SN_{sample?.serialNumber}_WO_[WorkOrderId]
                            </p>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-700 uppercase">Symbology Standard</label>
                            <select 
                                value={symbology} onChange={(e) => setSymbology(e.target.value as any)}
                                className="w-full mt-1.5 p-3 border border-gray-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="QR">QR Code (Recommended - Full traceability)</option>
                                <option value="CODE128">Code 128 (Industry standard 1D barcode)</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Zone 3: Settings & Preview */}
            <div className="lg:col-span-5 space-y-6">
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-5 text-center">
                    <h3 className="text-sm font-bold text-gray-900 uppercase flex items-center gap-2 border-b pb-3 text-left">
                        <Printer className="w-5 h-5 text-blue-600" /> Zone 3: Label Preview (50x30mm)
                    </h3>

                    {/* Simulation Label */}
                    <div className="w-[300px] h-[180px] bg-white border-2 border-gray-900 mx-auto p-4 flex flex-col items-center justify-between shadow-xl">
                        <div className="w-full text-center border-b-2 border-black pb-1">
                            <h4 className="text-[10px] font-black uppercase truncate">SMART FACTORY / {sample?.product.productName}</h4>
                        </div>
                        <div className="flex-1 flex items-center justify-center py-2 gap-4">
                            {symbology === 'QR' ? <QrCode className="w-20 h-20" /> : <Barcode className="w-32 h-14" />}
                            <div className="text-left border-l border-gray-200 pl-3">
                                <span className="text-[8px] font-bold text-gray-400 uppercase block">Serial Number</span>
                                <span className="text-xs font-mono font-black">{sample?.serialNumber}</span>
                            </div>
                        </div>
                        <div className="w-full text-[8px] font-bold flex justify-between border-t border-gray-300 pt-1">
                            <span>BATCH: {sample?.productionBatch.batchCode.slice(-8)}</span>
                            <span>DATE: {new Date(sample?.createdAt || "").toLocaleDateString('en-US')}</span>
                        </div>
                    </div>

                    <div className="pt-6 space-y-3">
                        <button 
                            onClick={handlePrintAction}
                            disabled={isUpdating}
                            className="w-full flex items-center justify-center gap-2 py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                        >
                            {isUpdating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Printer className="w-5 h-5" />} 
                            Print {selectedIds.length} Selected Items
                        </button>
                        <div className="grid grid-cols-2 gap-3">
                            <button onClick={handlePrintEntireBatch} className="py-2.5 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 text-xs">Print Entire Batch</button>
                            <button onClick={() => window.print()} className="py-2.5 bg-white border border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-50 text-xs">Reprint (Old SN)</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* PRINT-ONLY SECTION */}
      <div className="hidden print:block">
         {selectedData.map((inst, i) => (
            <div key={i} className="w-[50mm] h-[30mm] border border-black p-1.5 flex flex-col items-center justify-between break-inside-avoid mb-4 mx-auto bg-white">
                <div className="w-full text-center border-b border-black">
                    <h4 className="text-[8px] font-bold uppercase truncate leading-none">SF-PRODUCT: {inst.product.productName}</h4>
                </div>
                <div className="flex-1 flex items-center justify-center gap-3 w-full py-1">
                    {symbology === 'QR' ? <QrCode className="w-10 h-10" strokeWidth={1.5} /> : <Barcode className="w-16 h-6" strokeWidth={1} />}
                    <div className="text-left border-l border-black pl-2">
                        <span className="text-[5px] font-bold uppercase block leading-none">Serial Number</span>
                        <span className="text-[10px] font-mono font-bold leading-none">{inst.serialNumber}</span>
                    </div>
                </div>
                <div className="w-full flex justify-between text-[6px] font-bold border-t border-black pt-0.5">
                    <span>Batch: {inst.productionBatch.batchCode}</span>
                    <span>String: FG_{inst.product.productId}_SN_{inst.serialNumber}</span>
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