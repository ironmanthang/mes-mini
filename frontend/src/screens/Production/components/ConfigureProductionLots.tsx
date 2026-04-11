import { 
  Settings, 
  Zap, 
  Printer, 
  Info,
  QrCode,
  ChevronDown,
} from "lucide-react";
import { useState, useEffect, type JSX } from "react";

// --- MOCK DATA ---
const workOrders = [
  { 
    id: "WO-2025-001", 
    productName: "Gaming Laptop X1", 
    category: "Electronics", 
    quantity: 12, // Giảm số lượng để demo bản in cho đẹp
    status: "In Progress",
    description: "High performance batch for Q4"
  },
  { 
    id: "WO-2025-002", 
    productName: "Organic Energy Bar", 
    category: "Food & Beverage", 
    quantity: 1000, 
    status: "In Progress",
    description: "Export quality batch"
  }
];

const productionLines = [
  { id: "LINE-A1", name: "Assembly Line Alpha" },
  { id: "LINE-B2", name: "Assembly Line Beta" }
];

export const ConfigureProductionLots = (): JSX.Element => {
  const [selectedWOId, setSelectedWOId] = useState("");
  const [selectedWO, setSelectedWO] = useState<any>(null);
  
  const [batchCode, setBatchCode] = useState("");
  const [productionDate, setProductionDate] = useState(new Date().toISOString().split('T')[0]);
  const [expiryDate, setExpiryDate] = useState("");
  const [selectedLine, setSelectedLine] = useState("");

  const [isGenerated, setIsGenerated] = useState(false);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [paperSize, setPaperSize] = useState("A4 - 4x10 Labels");
  const [generatedSerials, setGeneratedSerials] = useState<string[]>([]);

  const calculateExpiry = (category: string, prodDate: string) => {
    const date = new Date(prodDate);
    if (category === "Food & Beverage") date.setMonth(date.getMonth() + 6);
    else if (category === "Electronics") date.setFullYear(date.getFullYear() + 2);
    else date.setFullYear(date.getFullYear() + 1);
    setExpiryDate(date.toISOString().split('T')[0]);
  };

  useEffect(() => {
    const wo = workOrders.find(w => w.id === selectedWOId);
    setSelectedWO(wo || null);
    setIsGenerated(false);

    if (wo) {
      const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, "");
      setBatchCode(`${wo.id}-${dateStr}`);
      calculateExpiry(wo.category, productionDate);
    } else {
      setBatchCode("");
      setExpiryDate("");
    }
  }, [selectedWOId]);

  const handleGenerateInstances = () => {
    if (!selectedWO || !selectedLine) return alert("Please select Work Order and Production Line");
    
    const serials = Array.from({ length: selectedWO.quantity }, (_, i) => 
      `${selectedWO.id}-SN${(i + 1).toString().padStart(4, '0')}`
    );
    
    setGeneratedSerials(serials);
    setIsGenerated(true);
    alert(`Generated ${selectedWO.quantity} product instances successfully!`);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-12 relative">
      
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <Settings className="w-5 h-5 text-blue-600" />
                    Configure Production Lots
                </h3>
                <p className="text-sm text-gray-500 mt-1">Setup batch details and generate unique serial numbers.</p>
            </div>
            <div className="w-full md:w-[350px]">
                <select 
                    value={selectedWOId}
                    onChange={(e) => setSelectedWOId(e.target.value)}
                    className="w-full p-2.5 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-blue-50 font-medium text-blue-900 cursor-pointer"
                >
                    <option value="">-- Choose Work Order --</option>
                    {workOrders.map(wo => <option key={wo.id} value={wo.id}>{wo.id} - {wo.productName}</option>)}
                </select>
            </div>
        </div>
      </div>

      {selectedWO ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-top-4">
            
            <div className="lg:col-span-1 bg-white p-6 rounded-lg border border-gray-200 shadow-sm h-fit">
                <h4 className="text-base font-bold text-gray-900 flex items-center gap-2 pb-3 border-b mb-4">
                    <Info className="w-4 h-4 text-blue-500" /> Work Order Details
                </h4>
                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase block mb-1">Product</label>
                        <p className="text-sm font-bold text-gray-900">{selectedWO.productName}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-gray-400 uppercase block mb-1">Target Qty</label>
                            <p className="text-lg font-bold text-blue-600">{selectedWO.quantity}</p>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-400 uppercase block mb-1">Status</label>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-700 border border-green-200 uppercase">{selectedWO.status}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="lg:col-span-2 bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                <h4 className="text-base font-bold text-gray-900 flex items-center gap-2 pb-3 border-b mb-6">
                    <QrCode className="w-4 h-4 text-blue-500" /> Batch Configuration
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2 md:col-span-2">
                        <label className="text-sm font-bold text-gray-700">Batch Code (Auto-generated)</label>
                        <input type="text" value={batchCode} readOnly className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-500 font-mono" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700">Production Date (MFG)</label>
                        <input type="date" value={productionDate} onChange={(e) => setProductionDate(e.target.value)} className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700">Expiry Date (EXP)</label>
                        <input type="date" value={expiryDate} readOnly className="w-full p-2.5 bg-orange-50 border border-orange-100 rounded-lg text-sm text-orange-700 font-bold" />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                        <label className="text-sm font-bold text-gray-700">Production Line<span className="text-red-500">*</span></label>
                        <select value={selectedLine} onChange={(e) => setSelectedLine(e.target.value)} className="w-full p-2.5 border border-gray-300 rounded-lg text-sm bg-white cursor-pointer">
                            <option value="">-- Select Production Line --</option>
                            {productionLines.map(line => <option key={line.id} value={line.id}>{line.name}</option>)}
                        </select>
                    </div>
                </div>

                <div className="mt-8 pt-6 border-t border-gray-100 flex flex-col md:flex-row gap-3 justify-end">
                    <button
                        onClick={() => setShowPrintPreview(true)}
                        disabled={!isGenerated}
                        className="flex items-center justify-center gap-2 px-6 py-2.5 bg-white border border-blue-600 text-blue-600 font-bold rounded-lg hover:bg-blue-50 transition-all disabled:opacity-50 disabled:grayscale cursor-pointer text-sm shadow-sm"
                    >
                        <Printer className="w-4 h-4" />
                        Print Batch Barcodes
                    </button>
                    
                    <button
                        onClick={handleGenerateInstances}
                        disabled={!selectedWO || !selectedLine || isGenerated}
                        className={`flex items-center justify-center gap-2 px-6 py-2.5 text-white font-bold rounded-lg transition-all shadow-md text-sm cursor-pointer
                            ${isGenerated ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#22c55e] hover:bg-[#16a34a]'}
                        `}
                    >
                        <Zap className={`w-4 h-4 ${isGenerated ? '' : 'fill-white'}`} />
                        {isGenerated ? "Product Instances Generated" : "Generate Product Instances"}
                    </button>
                </div>
                {isGenerated && (
                  <p className="text-[11px] text-right text-gray-400 mt-2 font-medium italic">
                    * Data locked to prevent duplicate serial generation.
                  </p>
                )}
            </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
            <Settings className="w-12 h-12 mb-3 opacity-20" />
            <p className="text-lg font-medium">Select a Work Order above to start configuration.</p>
        </div>
      )}

      {showPrintPreview && (
        <div className="fixed inset-0 z-[100] bg-gray-900 flex flex-col overflow-hidden print:bg-white print:static">
          
          <div className="bg-gray-800 p-4 border-b border-gray-700 flex justify-between items-center print:hidden">
            <div className="flex items-center gap-6">
               <h3 className="text-white font-bold flex items-center gap-2">
                 <Printer className="w-5 h-5 text-green-400" />
                 Print Preview
               </h3>
               <div className="flex items-center gap-2 bg-gray-700 px-3 py-1.5 rounded-lg border border-gray-600">
                  <span className="text-xs text-gray-400 font-bold uppercase">Paper Size:</span>
                  <select 
                    value={paperSize} onChange={(e) => setPaperSize(e.target.value)}
                    className="bg-transparent text-sm text-white outline-none cursor-pointer font-medium"
                  >
                    <option value="A4 - 4x10 Labels">A4 (4x10 Labels)</option>
                    <option value="Decal 50x30mm">Decal Roll (50x30mm)</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
               </div>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => setShowPrintPreview(false)} className="px-4 py-2 text-gray-300 hover:text-white transition-colors text-sm font-bold">Cancel</button>
              <button onClick={handlePrint} className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-500 shadow-lg active:scale-95 transition-all text-sm">
                <Printer className="w-4 h-4" /> Print Now
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-12 bg-gray-200 flex justify-center print:p-0 print:bg-white">
            <div className="bg-white shadow-2xl min-h-[1123px] w-[794px] p-8 print:shadow-none print:w-full print:p-0">
               
               <div className="grid grid-cols-2 gap-6">
                  {generatedSerials.map((sn, idx) => (
                    <div key={idx} className="border-2 border-black p-4 flex flex-col gap-2 rounded relative overflow-hidden h-[180px] break-inside-avoid">
                        <h5 className="text-sm font-black uppercase text-center border-b-2 border-black pb-1 truncate">{selectedWO.productName}</h5>
                        
                        <div className="flex-1 flex flex-col justify-center items-center gap-1">
                           <div className="w-full bg-white flex justify-center py-1">
                              <div className="h-10 w-4/5 border-x-2 border-black relative">
                                 <div className="absolute inset-0 flex justify-around items-center px-1">
                                    {[...Array(20)].map((_, i) => (
                                      <div key={i} className={`h-full bg-black ${i % 3 === 0 ? 'w-1' : 'w-[0.5px]'}`}></div>
                                    ))}
                                 </div>
                              </div>
                           </div>
                           <p className="text-xs font-mono font-bold tracking-widest">{sn}</p>
                        </div>

                        <div className="mt-auto pt-1 border-t border-gray-300 grid grid-cols-2 text-[9px] leading-tight font-bold">
                           <div className="flex flex-col">
                              <span>BATCH: <span className="font-mono">{batchCode}</span></span>
                              <span>LINE: {selectedLine}</span>
                           </div>
                           <div className="flex flex-col text-right">
                              <span>MFG: {productionDate}</span>
                              <span>EXP: {expiryDate}</span>
                           </div>
                        </div>

                        <div className="absolute top-2 right-2 opacity-10"><QrCode className="w-8 h-8" /></div>
                    </div>
                  ))}
               </div>

            </div>
          </div>

        </div>
      )}

      <style>{`
        @media print {
          @page { size: A4; margin: 0; }
          body { -webkit-print-color-adjust: exact; }
          .slide-container { display: none !important; }
        }
      `}</style>

    </div>
  );
};