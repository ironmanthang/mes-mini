import { 
  Search, ArrowLeft, QrCode, Printer, 
  CheckSquare, Loader2, Package, Settings2, Layers, RefreshCw, Eye
} from "lucide-react";
import { useState, useEffect, useMemo, type JSX } from "react";
import BarcodeGenerator from "react-barcode";
import QRCodeGenerator from "react-qr-code";
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
  // LOGIC SELECTION & FILTERS
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

  const selectedData = instances.filter(i => selectedIds.includes(i.productInstanceId));
  const sample = selectedData[0]; 

  // ==========================================
  // PRINT EXECUTION (TRIGGERS STATUS CHANGE EVENT)
  // ==========================================
  const handlePrintAction = async () => {
    if (selectedIds.length === 0) return;
    
    // Trigger the system print dialog
    window.print();

    setIsUpdating(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      alert(`Successfully printed ${selectedIds.length} physical barcode labels!`);
      
      // Temporarily remove printed items from the frontend queue
      setInstances(prev => prev.filter(i => !selectedIds.includes(i.productInstanceId)));
      setSelectedIds([]);
      setViewMode('LIST');
    } catch (error) {
        console.error("Error saving print log.", error);
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
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col min-h-[500px]">
          
          <div className="p-6 border-b border-gray-100 bg-gray-50/50 rounded-t-xl flex justify-between items-center">
            <div>
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <QrCode className="w-6 h-6 text-blue-600" /> Pending Batch Label Print Queue
                </h2>
                <p className="text-sm text-gray-500 mt-1">Newly packaged products waiting for unique serial number labels.</p>
            </div>
            <button onClick={fetchPendingLabels} className="p-2 hover:bg-gray-100 rounded-full transition-colors cursor-pointer">
                <RefreshCw className={`w-5 h-5 text-gray-400 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="p-4 border-b border-gray-200">
            <div className="relative w-96">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <input 
                  type="text" placeholder="Search by serial number, batch code, product name..." 
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
                    <th className="p-4 w-12 text-center">
                        <input type="checkbox" checked={selectedIds.length > 0 && selectedIds.length === filteredInstances.length} onChange={toggleSelectAll} className="w-4 h-4 accent-blue-600 cursor-pointer" />
                    </th>
                    <th className="p-4">Serial Number</th>
                    <th className="p-4">Product Information</th>
                    <th className="p-4">Production Batch Code</th>
                    <th className="p-4">Completion Time</th>
                    <th className="p-4 text-center">Status</th>
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
                            WAITING LABEL
                         </span>
                      </td>
                    </tr>
                  ))}
                  {filteredInstances.length === 0 && <tr><td colSpan={6} className="p-12 text-center text-gray-400 italic">The queue is empty. There are no labels to print.</td></tr>}
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
                        <p className="text-xs text-gray-400 uppercase tracking-widest">Print label configuration</p>
                    </div>
                </div>
                <button 
                    onClick={() => setViewMode('DETAIL')}
                    className="px-8 py-3 bg-blue-600 hover:bg-blue-500 font-bold rounded-xl transition-all active:scale-95 shadow-md flex items-center gap-2 cursor-pointer text-sm"
                >
                    <Settings2 className="w-5 h-5" /> Configure Barcode
                </button>
            </div>
        )}
      </div>
    );
  }

  // --- VIEW 2: PHYSICAL LABEL PREVIEW (PREVIEW & PRINT CONFIG) ---
  const barcodeValue = `FG_${sample?.product.productId}_SN_${sample?.serialNumber}`;

  return (
    <div className="flex flex-col gap-6 pb-20 animate-in slide-in-from-right-4 duration-300 print:m-0 print:p-0 w-full">
      
      <div className="print:hidden">
        <div className="flex items-center gap-4 mb-6">
            <button onClick={() => setViewMode('LIST')} className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 cursor-pointer shadow-sm">
                <ArrowLeft className="w-5 h-5" />
            </button>
            <h2 className="text-2xl font-bold text-gray-900">Configure & Preview Barcode Labels</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left column: Parameter configuration */}
            <div className="lg:col-span-6 space-y-6">
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-5">
                    <h3 className="text-sm font-bold text-gray-900 uppercase flex items-center gap-2 border-b pb-3">
                        <Package className="w-5 h-5 text-blue-600" /> Product Source Information
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 col-span-2 flex items-center gap-4">
                            <Layers className="w-10 h-10 text-blue-200" />
                            <div>
                                <span className="text-[10px] font-bold text-gray-400 uppercase block">Item Name</span>
                                <p className="text-base font-bold text-gray-900">{sample?.product.productName} (Code: {sample?.product.code})</p>
                            </div>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                           <span className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Batch Code</span>
                           <span className="text-sm font-mono font-bold text-gray-700">{sample?.productionBatch.batchCode}</span>
                        </div>
                        <div className="p-3 bg-gray-900 rounded-xl flex justify-between items-center text-white">
                           <span className="text-xs font-bold uppercase text-gray-400">Label Quantity</span>
                           <span className="text-xl font-black text-blue-400">{selectedIds.length} Prints</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
                    <h3 className="text-sm font-bold text-gray-900 uppercase flex items-center gap-2 border-b pb-3">
                        <Settings2 className="w-5 h-5 text-blue-600" /> Encoding Format (Symbology)
                    </h3>
                    <div className="space-y-4">
                        <div className="p-3.5 bg-blue-50 border border-blue-100 rounded-lg">
                            <label className="text-xs font-bold text-blue-800 uppercase">Automatic Scan String (String Formula)</label>
                            <p className="mt-1 font-mono text-xs font-bold text-blue-600 break-all">
                                {barcodeValue}
                            </p>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-700 uppercase">Industrial Encoding Standard</label>
                            <select 
                                value={symbology} onChange={(e) => setSymbology(e.target.value as any)}
                                className="w-full mt-1.5 p-3 border border-gray-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 bg-white"
                            >
                                <option value="QR">2D Code - QR Code (Optimized for lifecycle traceability)</option>
                                <option value="CODE128">1D Code - Code 128 (Handheld scanner standard)</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right column: Actual 50x30mm preview frame */}
            <div className="lg:col-span-6 space-y-6">
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-5 flex flex-col h-full">
                    <h3 className="text-sm font-bold text-gray-900 uppercase flex items-center gap-2 border-b pb-3 text-left">
                        <Eye className="w-5 h-5 text-blue-600" /> Physical Label Preview (50mm x 30mm)
                    </h3>

                    {/* Thermal label frame simulating factory output */}
                    <div className="flex-1 flex items-center justify-center p-4 bg-gray-50 border border-dashed rounded-xl">
                        <div className="w-[340px] h-[204px] bg-white border border-black p-3 flex flex-col justify-between shadow-2xl relative text-black select-none">
                            
                            {/* Industrial label section divider */}
                            <div className="w-full pb-1 border-b border-black flex justify-between items-center">
                                <h4 className="text-[10px] font-black tracking-wide uppercase truncate max-w-[180px]">SF-FACTORY / {sample?.product.productName}</h4>
                                <span className="text-[8px] font-mono font-bold bg-black text-white px-1 rounded">QC OK</span>
                            </div>

                            {/* Center area containing the generated code */}
                            <div className="flex-1 flex items-center justify-between py-2 gap-2 overflow-hidden">
                                <div className="w-[45%] flex items-center justify-center">
                                    {symbology === 'QR' ? (
                                        <div className="p-1 bg-white border border-gray-200">
                                            <QRCodeGenerator value={barcodeValue} size={85} level="M" />
                                        </div>
                                    ) : (
                                        <div className="scale-[0.8] origin-left w-[160px]">
                                            <BarcodeGenerator value={barcodeValue} height={55} width={1.2} displayValue={false} margin={0} />
                                        </div>
                                    )}
                                </div>
                                
                                <div className="w-[55%] border-l border-black pl-3 h-full flex flex-col justify-center space-y-1">
                                    <div>
                                        <span className="text-[7px] text-gray-500 font-bold uppercase block leading-none">Serial Number:</span>
                                        <span className="text-sm font-mono font-black tracking-tight text-gray-900 leading-none">{sample?.serialNumber}</span>
                                    </div>
                                    <div className="pt-1">
                                        <span className="text-[7px] text-gray-500 font-bold uppercase block leading-none">Product Code:</span>
                                        <span className="text-xs font-mono font-bold text-gray-800 leading-none">{sample?.product.code}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Label footer containing management barcode metadata */}
                            <div className="w-full text-[8px] font-bold flex justify-between border-t border-black pt-1.5 font-mono">
                                <span>BATCH: {sample?.productionBatch.batchCode}</span>
                                <span>DATE: {new Date(sample?.createdAt || "").toLocaleDateString('en-US')}</span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <button 
                            onClick={handlePrintAction}
                            disabled={isUpdating}
                            className="w-full flex items-center justify-center gap-2 py-3.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg transition-all active:scale-95 disabled:opacity-50 cursor-pointer text-sm"
                        >
                            {isUpdating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Printer className="w-5 h-5" />} 
                            Start Print Queue ({selectedIds.length} labels)
                        </button>
                        <div className="grid grid-cols-2 gap-3">
                            <button onClick={handlePrintEntireBatch} className="py-2.5 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 text-xs cursor-pointer">Print Entire Batch</button>
                            <button onClick={() => window.print()} className="py-2.5 bg-white border border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-50 text-xs cursor-pointer">View System Print</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* ========================================== */}
      {/* PRINT CSS AREA - PHYSICAL THERMAL LABEL STORE */}
      {/* ========================================== */}
      <div className="hidden print:block">
         {selectedData.map((inst, i) => {
            const currentBarcodeValue = `FG_${inst.product.productId}_SN_${inst.serialNumber}`;
            return (
                <div key={i} className="w-[50mm] h-[30mm] border border-black p-2 flex flex-col justify-between break-inside-avoid bg-white text-black relative font-sans">
                    <div className="w-full pb-0.5 border-b border-black flex justify-between items-center">
                        <h4 className="text-[7px] font-black uppercase truncate max-w-[110mm]">SF: {inst.product.productName}</h4>
                        <span className="text-[6px] font-mono font-bold border border-black px-0.5 rounded">OK</span>
                    </div>
                    <div className="flex-1 flex items-center justify-between py-1 gap-1 overflow-hidden">
                        <div className="w-[40%] flex items-center justify-center">
                            {symbology === 'QR' ? (
                                <QRCodeGenerator value={currentBarcodeValue} size={50} level="M" />
                            ) : (
                                <div className="scale-[0.65] origin-center">
                                    <BarcodeGenerator value={currentBarcodeValue} height={40} width={1.0} displayValue={false} margin={0} />
                                </div>
                            )}
                        </div>
                        <div className="w-[60%] border-l border-black pl-1.5 h-full flex flex-col justify-center">
                            <span className="text-[5px] font-bold uppercase block leading-none text-gray-500">S/N:</span>
                            <span className="text-[9px] font-mono font-black tracking-tight leading-none mb-1">{inst.serialNumber}</span>
                            <span className="text-[5px] font-bold uppercase block leading-none text-gray-500">CODE:</span>
                            <span className="text-[7px] font-mono font-bold leading-none">{inst.product.code}</span>
                        </div>
                    </div>
                    <div className="w-full text-[5px] font-bold flex justify-between border-t border-black pt-0.5 font-mono">
                        <span>BATCH: {inst.productionBatch.batchCode}</span>
                        <span>DATE: {new Date(inst.createdAt).toLocaleDateString('en-US')}</span>
                    </div>
                </div>
            )
         })}
      </div>

      <style>{`
        @media print {
          @page { size: 50mm 30mm; margin: 0; }
          body * { visibility: hidden; }
          .print\\:block, .print\\:block * { visibility: visible; }
          .print\\:block { position: absolute; left: 0; top: 0; width: 100%; display: flex; flex-col: true; gap: 0; }
        }
      `}</style>
    </div>
  );
};
