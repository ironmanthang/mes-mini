import { 
  Search, Filter, ArrowLeft, QrCode, Barcode, Printer, 
  CheckSquare, Loader2, Package, Calendar, Settings2, Layers
} from "lucide-react";
import { useState, useEffect, useMemo, type JSX } from "react";

// --- INTERFACES ---
interface ProductInstance {
  productInstanceId: number;
  serialNumber: string;
  productId: number;
  productName: string;
  batchCode: string;
  workOrderId: string;
  productionDate: string;
  status: 'PENDING_QC' | 'PRODUCED';
  isPrinted: boolean;
}

// --- MOCK DATA (GIẢ LẬP BE GIAI ĐOẠN 1) ---
const mockInstances: ProductInstance[] = Array.from({ length: 15 }, (_, i) => ({
  productInstanceId: 5000 + i,
  serialNumber: `SN-2026-${(98765 + i).toString()}`,
  productId: i < 10 ? 101 : 102,
  productName: i < 10 ? "Smart Watch V1" : "Bluetooth Earbuds",
  batchCode: i < 10 ? "BATCH-WO2026089-20260428" : "BATCH-WO2026090-20260428",
  workOrderId: i < 10 ? "WO-2026-089" : "WO-2026-090",
  productionDate: "2026-04-28T14:30:00Z",
  status: 'PENDING_QC',
  isPrinted: false
}));

export const Barcodes = (): JSX.Element => {
  // State quản lý View
  const [viewMode, setViewMode] = useState<'LIST' | 'DETAIL'>('LIST');
  
  // State Danh sách
  const [instances, setInstances] = useState<ProductInstance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterProduct, setFilterProduct] = useState("All");
  
  // State Selection
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // State Cấu hình In ấn (Giai đoạn 2 & 3)
  const [symbology, setSymbology] = useState<'QR' | 'CODE128'>('QR');
  const [labelMode, setLabelMode] = useState<'INDIVIDUAL' | 'PACKING'>('INDIVIDUAL');
  const [template, setTemplate] = useState<'50x30' | '35x22'>('50x30');
  const [isPrinting, setIsPrinting] = useState(false);

  // Khởi tạo dữ liệu
  useEffect(() => {
    setTimeout(() => {
      setInstances(mockInstances);
      setIsLoading(false);
    }, 500);
  }, []);

  // ==========================================
  // LOGIC & ACTIONS
  // ==========================================
  const filteredInstances = useMemo(() => {
    return instances.filter(inst => {
      const q = searchQuery.toLowerCase();
      const matchSearch = inst.serialNumber.toLowerCase().includes(q) || inst.batchCode.toLowerCase().includes(q);
      const matchProduct = filterProduct === "All" || inst.productName === filterProduct;
      return matchSearch && matchProduct && !inst.isPrinted; // Chỉ hiện chưa in
    });
  }, [instances, searchQuery, filterProduct]);

  // Handle Checkbox
  const toggleSelectAll = () => {
    if (selectedIds.length === filteredInstances.length) setSelectedIds([]);
    else setSelectedIds(filteredInstances.map(i => i.productInstanceId));
  };

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  // Dữ liệu cho Detail View
  const selectedInstancesData = instances.filter(i => selectedIds.includes(i.productInstanceId));
  const sampleInstance = selectedInstancesData[0]; // Dùng để preview mẫu
  
  // Kiểm tra nếu chọn nhiều loại sản phẩm khác nhau
  const isMultipleProducts = new Set(selectedInstancesData.map(i => i.productId)).size > 1;

  // Thực thi lệnh In (Giai đoạn 3 & 4)
  const handlePrintLabels = async () => {
    if (selectedIds.length === 0) return;
    
    // Gọi trình duyệt in (Sẽ áp dụng CSS @media print)
    window.print();

    setIsPrinting(true);
    try {
      // Giả lập BE Transaction cập nhật trạng thái
      console.log(`[API CALL] Updating isPrinted for IDs:`, selectedIds);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      alert("Đã ghi nhận trạng thái in tem thành công!");
      
      // Xóa các item đã in khỏi danh sách chờ
      setInstances(prev => prev.filter(i => !selectedIds.includes(i.productInstanceId)));
      setSelectedIds([]);
      setViewMode('LIST');
    } catch (error) {
      alert("Lỗi khi cập nhật trạng thái lên server.");
    } finally {
      setIsPrinting(false);
    }
  };

  // ==========================================
  // RENDER: MÀN HÌNH 1 - DANH SÁCH CHỜ IN
  // ==========================================
  if (viewMode === 'LIST') {
    return (
      <div className="flex flex-col gap-6 pb-24 animate-in fade-in duration-300 relative">
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm flex flex-col min-h-[500px]">
          
          <div className="p-6 border-b border-gray-100 bg-gray-50/50 rounded-t-lg">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <QrCode className="w-6 h-6 text-blue-600" /> Finished Product Barcodes
            </h2>
            <p className="text-sm text-gray-500 mt-1">Quản lý hàng đợi và in tem định danh (Serial Numbers) cho thành phẩm.</p>
          </div>

          <div className="p-4 border-b border-gray-200 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1">
              <div className="relative w-80">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <input 
                  type="text" placeholder="Search Serial Number, Batch Code..." 
                  value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" 
                />
              </div>
              <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-lg border border-gray-200">
                <Filter className="w-4 h-4 text-gray-500 ml-2" />
                <select 
                  value={filterProduct} onChange={(e) => setFilterProduct(e.target.value)}
                  className="bg-transparent text-sm p-1 outline-none text-gray-700 font-medium cursor-pointer"
                >
                  <option value="All">All Products</option>
                  <option value="Smart Watch V1">Smart Watch V1</option>
                  <option value="Bluetooth Earbuds">Bluetooth Earbuds</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-x-auto">
            {isLoading ? (
              <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500 font-semibold border-b">
                  <tr>
                    <th className="p-4 w-12 text-center">
                        <input 
                            type="checkbox" 
                            checked={filteredInstances.length > 0 && selectedIds.length === filteredInstances.length}
                            onChange={toggleSelectAll}
                            className="w-4 h-4 text-blue-600 rounded border-gray-300 cursor-pointer"
                        />
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
                    <tr key={inst.productInstanceId} className={`hover:bg-gray-50 transition-colors ${selectedIds.includes(inst.productInstanceId) ? 'bg-blue-50/30' : ''}`}>
                      <td className="p-4 text-center">
                        <input 
                            type="checkbox" 
                            checked={selectedIds.includes(inst.productInstanceId)}
                            onChange={() => toggleSelect(inst.productInstanceId)}
                            className="w-4 h-4 text-blue-600 rounded border-gray-300 cursor-pointer"
                        />
                      </td>
                      <td className="p-4 font-mono font-black text-blue-700">{inst.serialNumber}</td>
                      <td className="p-4 font-bold text-gray-900">{inst.productName}</td>
                      <td className="p-4 font-mono text-gray-600 cursor-help" title={`Work Order: ${inst.workOrderId}`}>{inst.batchCode}</td>
                      <td className="p-4 text-gray-600 flex items-center gap-1.5 mt-1">
                          <Calendar className="w-3.5 h-3.5" /> 
                          {new Date(inst.productionDate).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' })}
                      </td>
                      <td className="p-4 text-center">
                         <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-yellow-100 text-yellow-700 border border-yellow-200 flex items-center justify-center gap-1 w-max mx-auto">
                            Pending Print
                         </span>
                      </td>
                    </tr>
                  ))}
                  {filteredInstances.length === 0 && <tr><td colSpan={6} className="p-12 text-center text-gray-400">Không có sản phẩm nào chờ in tem.</td></tr>}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Thanh công cụ nổi khi có item được chọn */}
        {selectedIds.length > 0 && (
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-gray-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-6 animate-in slide-in-from-bottom-5">
                <div className="flex items-center gap-3 border-r border-gray-700 pr-6">
                    <CheckSquare className="w-6 h-6 text-blue-400" />
                    <div>
                        <p className="text-sm font-bold">{selectedIds.length} items selected</p>
                        <p className="text-xs text-gray-400">Ready for label configuration</p>
                    </div>
                </div>
                <button 
                    onClick={() => setViewMode('DETAIL')}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 font-bold rounded-xl transition-all active:scale-95 shadow-md flex items-center gap-2 cursor-pointer"
                >
                    <Settings2 className="w-4 h-4" /> Configure Barcodes
                </button>
            </div>
        )}
      </div>
    );
  }

  // ==========================================
  // RENDER: MÀN HÌNH 2 - CẤU HÌNH & IN (DETAIL VIEW)
  // ==========================================
  const sampleFinalString = sampleInstance 
    ? `FG_${sampleInstance.productId}_SN_${sampleInstance.serialNumber}_WO_${sampleInstance.workOrderId}` 
    : "";

  return (
    <div className="flex flex-col gap-6 pb-20 animate-in slide-in-from-right-4 duration-300 print:m-0 print:p-0">
      
      {/* UI ẨN KHI IN */}
      <div className="print:hidden">
        <div className="flex items-center gap-4 mb-6">
            <button onClick={() => setViewMode('LIST')} className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-gray-600 cursor-pointer">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Barcode Configuration & Preview</h2>
              <p className="text-sm text-gray-500 font-mono">Preparing to print {selectedIds.length} labels</p>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* CỘT TRÁI: THÔNG TIN & CẤU HÌNH */}
            <div className="lg:col-span-7 space-y-6">
                
                {/* Vùng 1: Reference Info */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
                    <h3 className="text-sm font-bold text-gray-900 uppercase flex items-center gap-2 border-b pb-3">
                        <Package className="w-5 h-5 text-blue-600" /> Zone 1: Identification Info
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-blue-50 rounded-lg border border-blue-100 col-span-2 flex items-start gap-3">
                            <Layers className="w-8 h-8 text-blue-500 flex-shrink-0 mt-1" />
                            <div>
                                <span className="text-[10px] font-bold text-blue-600 uppercase block mb-1">Product Info</span>
                                <span className="text-base font-bold text-gray-900 block">
                                    {isMultipleProducts ? "Multiple Products Selected" : sampleInstance.productName}
                                </span>
                                {!isMultipleProducts && <span className="text-xs font-mono text-gray-500">Product ID: {sampleInstance.productId}</span>}
                            </div>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                            <span className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Batch Reference</span>
                            <span className="text-sm font-mono font-bold text-gray-900 truncate block">{isMultipleProducts ? "Various Batches" : sampleInstance.batchCode}</span>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                            <span className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Order Link</span>
                            <span className="text-sm font-bold text-gray-900 truncate block">{isMultipleProducts ? "Various Orders" : sampleInstance.workOrderId}</span>
                        </div>
                        <div className="p-4 bg-gray-900 rounded-lg col-span-2 flex justify-between items-center text-white">
                            <span className="text-sm font-bold uppercase">Selected Count:</span>
                            <span className="text-2xl font-black text-blue-400">{selectedIds.length} units</span>
                        </div>
                    </div>
                </div>

                {/* Vùng 2: Traceability Logic Configuration */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
                    <h3 className="text-sm font-bold text-gray-900 uppercase flex items-center gap-2 border-b pb-3">
                        <Settings2 className="w-5 h-5 text-blue-600" /> Zone 2: Traceability Logic
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-bold text-gray-700 block mb-1.5">Sample Barcode String (Auto-generated)</label>
                            <input 
                                type="text" readOnly value={sampleFinalString}
                                className="w-full p-3 bg-gray-100 border border-gray-300 rounded-lg text-sm font-mono font-bold text-gray-600"
                            />
                            <p className="text-[10px] text-gray-500 mt-1">Formula: FG_[id]_SN_[sn]_WO_[wo_id]</p>
                        </div>
                        <div>
                            <label className="text-sm font-bold text-gray-700 block mb-1.5">Symbology Standard</label>
                            <select 
                                value={symbology} onChange={(e) => setSymbology(e.target.value as any)}
                                className="w-full p-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                            >
                                <option value="QR">QR Code (Recommended for Full Traceability)</option>
                                <option value="CODE128">Code 128 (Standard Industrial)</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* CỘT PHẢI: LABEL SETTINGS, PREVIEW & ACTIONS */}
            <div className="lg:col-span-5 space-y-6">
                
                {/* Vùng 3: Settings & Preview */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-5">
                    <h3 className="text-sm font-bold text-gray-900 uppercase flex items-center gap-2 border-b pb-3">
                        <Printer className="w-5 h-5 text-blue-600" /> Zone 3: Settings & Preview
                    </h3>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="text-xs font-bold text-gray-700 uppercase block mb-1.5">Label Mode</label>
                            <div className="flex bg-gray-100 p-1 rounded-lg">
                                <button onClick={() => setLabelMode('INDIVIDUAL')} className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${labelMode === 'INDIVIDUAL' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'}`}>Individual (Per Unit)</button>
                                <button onClick={() => setLabelMode('PACKING')} className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${labelMode === 'PACKING' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'}`}>Packing Unit (Box)</button>
                            </div>
                        </div>
                        <div className="col-span-2">
                            <label className="text-xs font-bold text-gray-700 uppercase block mb-1.5">Template Size</label>
                            <select 
                                value={template} onChange={(e) => setTemplate(e.target.value as any)}
                                className="w-full p-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                            >
                                <option value="50x30">50x30 mm (Standard Large)</option>
                                <option value="35x22">35x22 mm (Compact Tag)</option>
                            </select>
                        </div>
                    </div>

                    {/* KHUNG PREVIEW ĐỒ HỌA */}
                    <div className="mt-4 border-2 border-dashed border-gray-300 bg-gray-100 rounded-xl p-6 flex justify-center items-center">
                        {/* Simulation của 1 con tem mẫu */}
                        <div className={`bg-white border border-gray-400 shadow-md p-4 flex flex-col items-center justify-between relative overflow-hidden transition-all
                            ${template === '50x30' ? 'w-[280px] h-[168px]' : 'w-[220px] h-[138px] scale-90'}
                        `}>
                            {/* Header: Logo/Company */}
                            <div className="w-full text-center border-b-2 border-black pb-1 mb-1">
                                <h4 className="text-[10px] font-black uppercase truncate tracking-widest">{isMultipleProducts ? "VARIOUS PRODUCTS" : sampleInstance.productName}</h4>
                            </div>
                            
                            {/* Body: Barcode/QR & SN */}
                            <div className="flex-1 w-full flex items-center justify-center gap-3">
                                {symbology === 'QR' ? (
                                    <QrCode className="w-16 h-16 text-black" />
                                ) : (
                                    <Barcode className="w-24 h-12 text-black" />
                                )}
                                <div className="flex flex-col justify-center">
                                    <span className="text-[8px] font-bold text-gray-500">SERIAL NUMBER</span>
                                    <span className="text-sm font-black font-mono">{labelMode === 'PACKING' ? 'MULTI-SN-PACK' : sampleInstance.serialNumber}</span>
                                </div>
                            </div>
                            
                            {/* Footer: Date & Batch */}
                            <div className="w-full mt-1 border-t border-gray-300 pt-1 flex justify-between text-[8px] font-bold">
                                <span>PROD: {new Date(sampleInstance.productionDate).toLocaleDateString('vi-VN')}</span>
                                <span className="font-mono">BATCH: {isMultipleProducts ? "MIXED" : sampleInstance.batchCode.split('-').pop()}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Vùng 4: Execution Actions */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-3">
                    <button 
                        onClick={handlePrintLabels}
                        disabled={isPrinting}
                        className="w-full flex items-center justify-center gap-2 py-3.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                    >
                        {isPrinting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Printer className="w-5 h-5" />} 
                        {isPrinting ? "Saving Status..." : `Print ${labelMode === 'PACKING' ? '1 Packing Label' : `${selectedIds.length} Labels`}`}
                    </button>
                    
                    <div className="grid grid-cols-2 gap-3">
                        <button className="flex items-center justify-center gap-2 py-2.5 bg-gray-100 text-gray-700 font-bold rounded-lg hover:bg-gray-200 transition-colors cursor-pointer text-sm">
                            Print Entire Batch
                        </button>
                        <button className="flex items-center justify-center gap-2 py-2.5 bg-white border border-gray-300 text-gray-700 font-bold rounded-lg hover:bg-gray-50 transition-colors cursor-pointer text-sm">
                            Reprint Damaged
                        </button>
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* ========================================== */}
      {/* VÙNG CHỈ HIỂN THỊ KHI IN (PRINT SECTION) */}
      {/* ========================================== */}
      <div className="hidden print:block print:w-full print:h-full">
         {labelMode === 'INDIVIDUAL' ? (
             selectedInstancesData.map((inst, i) => {
                 const printString = `FG_${inst.productId}_SN_${inst.serialNumber}_WO_${inst.workOrderId}`;
                 return (
                    <div key={i} className={`flex flex-col items-center justify-between border border-black bg-white box-border break-inside-avoid mb-4
                        ${template === '50x30' ? 'w-[50mm] h-[30mm] p-1' : 'w-[35mm] h-[22mm] p-0.5'}
                    `}>
                        <div className="w-full text-center border-b-2 border-black pb-0.5">
                            <h4 className={`${template === '50x30' ? 'text-[8px]' : 'text-[6px]'} font-black uppercase truncate leading-none`}>
                                {inst.productName}
                            </h4>
                        </div>
                        
                        <div className="flex-1 w-full flex items-center justify-center gap-2">
                            {symbology === 'QR' ? (
                                <QrCode className={template === '50x30' ? 'w-10 h-10 text-black' : 'w-6 h-6 text-black'} strokeWidth={1.5} />
                            ) : (
                                <Barcode className={template === '50x30' ? 'w-16 h-6 text-black' : 'w-12 h-4 text-black'} strokeWidth={1} />
                            )}
                            <div className="flex flex-col justify-center">
                                <span className="text-[5px] font-bold text-gray-500">SN:</span>
                                <span className={`${template === '50x30' ? 'text-[9px]' : 'text-[7px]'} font-black font-mono leading-none`}>{inst.serialNumber}</span>
                            </div>
                        </div>
                        
                        <div className="w-full flex justify-between border-t border-gray-400 pt-0.5 mt-0.5">
                            <span className="text-[5px] font-bold">MFG: {new Date(inst.productionDate).toLocaleDateString('vi-VN')}</span>
                            <span className="text-[4px] font-mono text-gray-500">{printString}</span>
                        </div>
                    </div>
                 );
             })
         ) : (
             // Packing Unit mode: In 1 tem đại diện
             <div className={`flex flex-col items-center justify-between border border-black bg-white box-border break-inside-avoid
                ${template === '50x30' ? 'w-[50mm] h-[30mm] p-1' : 'w-[35mm] h-[22mm] p-0.5'}
            `}>
                <div className="w-full text-center border-b-2 border-black pb-0.5">
                    <h4 className={`${template === '50x30' ? 'text-[8px]' : 'text-[6px]'} font-black uppercase truncate leading-none`}>
                        PACKING UNIT ({selectedIds.length} PCS)
                    </h4>
                </div>
                <div className="flex-1 w-full flex items-center justify-center gap-2">
                    <QrCode className={template === '50x30' ? 'w-12 h-12 text-black' : 'w-8 h-8 text-black'} strokeWidth={1.5} />
                </div>
                <div className="w-full text-center border-t border-gray-400 pt-0.5 mt-0.5">
                    <span className="text-[6px] font-bold">BATCH: {isMultipleProducts ? "MIXED" : sampleInstance.batchCode}</span>
                </div>
            </div>
         )}
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
        }
      `}</style>

    </div>
  );
};