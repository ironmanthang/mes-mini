import { 
  Search, Filter, ArrowLeft, PackageCheck,
  Barcode, CheckCircle2, Printer, Send,
  Loader2, Calendar, Layers
} from "lucide-react";
import { useState, useEffect, useMemo, type JSX } from "react";
import { MaterialRequestServices, type MaterialRequest, type ValidationLine } from "../../../services/materialRequestServices";

// --- UI EXTENDED INTERFACES ---
interface FifoLotItem {
  id: string; // Combined CompID + LotCode
  priority: number;
  componentCode: string;
  componentId: number;
  lotCode: string;
  available: number;
  suggested: number;
  isVerified: boolean;
}

export const MaterialIssuing = (): JSX.Element => {
  // --- STATE LIST VIEW ---
  const [requests, setRequests] = useState<MaterialRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"All" | "PENDING" | "ISSUED">("All");

  // --- STATE PROCESSING VIEW (DETAIL) ---
  const [selectedRequest, setSelectedRequest] = useState<MaterialRequest | null>(null);
  const [fifoLots, setFifoLots] = useState<FifoLotItem[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [scannedCode, setScannedCode] = useState("");
  const [scanError, setScanError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Default Warehouse (Per simulation is WH-MAIN id: 1)
  const CURRENT_WAREHOUSE_ID = 1; 

  // ==========================================
  // 1. FETCH MATERIAL REQUEST LIST
  // ==========================================
  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const response = await MaterialRequestServices.getAllMaterialRequests({ 
        status: filterStatus === "All" ? undefined : filterStatus 
      });
      setRequests(response.data || []);
    } catch (error) {
      console.error("Failed to fetch material requests:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [filterStatus]);

  // ==========================================
  // 2. VALIDATE & FIFO CALCULATION
  // ==========================================
  useEffect(() => {
    if (selectedRequest) {
      setScannedCode("");
      setScanError("");
      setIsValidating(true);
      
      // Call Validate API to get Available Lots per FIFO
      MaterialRequestServices.validateMaterial(selectedRequest.requestId, CURRENT_WAREHOUSE_ID)
        .then((res) => {
            const lines: ValidationLine[] = res.lines || [];
            let priorityCount = 1;
            const parsedLots: FifoLotItem[] = [];
            
            // Iterate through each component in the request
            lines.forEach((line) => {
                // Iterate through available lots for that component
                line.availableLots.forEach((lot) => {
                    parsedLots.push({
                        id: `${line.componentId}-${lot.lotCode}`,
                        priority: priorityCount++,
                        componentCode: line.componentCode,
                        componentId: line.componentId,
                        lotCode: lot.lotCode,
                        available: lot.currentQuantity,
                        suggested: Math.min(line.requiredQuantity, lot.currentQuantity), // Simplified logic
                        isVerified: false
                    });
                });
            });
            setFifoLots(parsedLots);
        })
        .catch(err => {
            console.error("Validation failed", err);
            alert("Error during FIFO inventory reconciliation.");
        })
        .finally(() => setIsValidating(false));
    }
  }, [selectedRequest]);

  // ==========================================
  // 3. SIMULATED BARCODE VERIFICATION LOGIC
  // ==========================================
  const currentUnverifiedIndex = fifoLots.findIndex(lot => !lot.isVerified);
  const allVerified = fifoLots.length > 0 && currentUnverifiedIndex === -1;

  const handleVerify = () => {
    setScanError("");
    if (currentUnverifiedIndex === -1) return;

    const targetLot = fifoLots[currentUnverifiedIndex];
    if (scannedCode.trim().toLowerCase() === targetLot.lotCode.toLowerCase()) {
      const newLots = [...fifoLots];
      newLots[currentUnverifiedIndex].isVerified = true;
      setFifoLots(newLots);
      setScannedCode(""); 
    } else {
      setScanError("Mismatch! Lot code does not match FIFO suggestion. Please check again.");
    }
  };

  const handleSimulateScan = () => {
    if (currentUnverifiedIndex !== -1) {
      setScannedCode(fifoLots[currentUnverifiedIndex].lotCode);
      setScanError("");
    }
  };

  // ==========================================
  // 4. COMPLETE MATERIAL ISSUE
  // ==========================================
  const handleConfirmIssue = async () => {
    if (!allVerified) return alert("Please verify all lots before issuing!");
    if (!selectedRequest) return;

    setIsSubmitting(true);
    try {
      const payload = {
        warehouseId: CURRENT_WAREHOUSE_ID,
        consumedLots: fifoLots.map(l => ({
            componentId: l.componentId,
            lotCode: l.lotCode,
            quantity: l.suggested
        }))
      };

      await MaterialRequestServices.completeMaterialIssue(selectedRequest.requestId, payload);
      
      alert("Material components issued successfully!");
      fetchRequests(); 
      setSelectedRequest(null);
    } catch (e: any) {
      alert(e?.response?.data?.message || "Error during material issuing.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ==========================================
  // VIEW RENDERERS
  // ==========================================
  const filteredRequests = useMemo(() => {
    return requests.filter(req => {
      const searchStr = searchQuery.toLowerCase();
      return req.code?.toLowerCase().includes(searchStr) || 
             req.workOrder?.code?.toLowerCase().includes(searchStr);
    });
  }, [requests, searchQuery]);

  // --- MÀN HÌNH 1: DANH SÁCH YÊU CẦU ---
  if (!selectedRequest) {
    return (
      <div className="flex flex-col gap-6 pb-12 animate-in fade-in duration-300">
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm flex flex-col min-h-[500px]">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 rounded-t-lg">
            <div>
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <PackageCheck className="w-6 h-6 text-blue-600" /> Material Issuing
              </h2>
              <p className="text-sm text-gray-500 mt-1">Verify barcodes and issue components to the production shop.</p>
            </div>
          </div>

          <div className="p-4 border-b border-gray-200 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1">
              <div className="relative w-80">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <input 
                  type="text" placeholder="Search by Request Code, WO Code..." 
                  value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" 
                />
              </div>
              <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-lg border border-gray-200">
                <Filter className="w-4 h-4 text-gray-500 ml-2" />
                <select 
                  value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as any)}
                  className="bg-transparent text-sm p-1 outline-none text-gray-700 font-medium cursor-pointer"
                  id="status-material"
                  name="statusMaterial"
                >
                  <option value="All">All Statuses</option>
                  <option value="PENDING">Pending Issue</option>
                  <option value="ISSUED">Issued</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-x-auto">
            {isLoading ? (
              <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
            ) : (
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500 font-semibold border-b">
                  <tr>
                    <th className="p-4">Request Code</th>
                    <th className="p-4">Work Order</th>
                    <th className="p-4 text-center">Component Types</th>
                    <th className="p-4">Request Date</th>
                    <th className="p-4 text-center">Status</th>
                    <th className="p-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-gray-100">
                  {filteredRequests.map((req) => (
                    <tr key={req.requestId} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4 font-mono font-bold text-blue-600">{req.code}</td>
                      <td className="p-4 font-bold text-gray-700">{req.workOrder?.code || "N/A"}</td>
                      <td className="p-4 text-center">
                          <span className="inline-flex items-center justify-center gap-1 bg-gray-100 text-gray-700 font-bold px-2.5 py-1 rounded text-xs border border-gray-200">
                              <Layers className="w-3.5 h-3.5" /> {req._count?.details || 0}
                          </span>
                      </td>
                      <td className="p-4 text-gray-600 flex items-center gap-1.5 mt-1.5">
                          <Calendar className="w-3.5 h-3.5" /> 
                          {new Date(req.requestDate).toLocaleDateString('en-US')}
                      </td>
                      <td className="p-4 text-center">
                          {req.status === 'PENDING' ? (
                             <span className="px-2.5 py-1 rounded text-[10px] font-bold bg-yellow-100 text-yellow-700 uppercase border border-yellow-200">Pending</span>
                          ) : (
                             <span className="px-2.5 py-1 rounded text-[10px] font-bold bg-green-100 text-green-700 uppercase border border-green-200">Issued</span>
                          )}
                      </td>
                      <td className="p-4 text-center">
                        {req.status === 'PENDING' ? (
                          <button 
                            onClick={() => setSelectedRequest(req)}
                            className="px-4 py-1.5 bg-blue-600 text-white font-bold rounded hover:bg-blue-700 transition-colors text-xs cursor-pointer active:scale-95 shadow-sm"
                          >
                            Process
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400 font-medium italic">Completed</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    );
  }

  // --- SCREEN 2: DETAIL PROCESSING (DETAIL VIEW) ---
  return (
    <div className="flex flex-col gap-6 pb-20 animate-in slide-in-from-right-4 duration-300">
      
      <div className="flex items-center gap-4">
        <button onClick={() => setSelectedRequest(null)} className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-gray-600 cursor-pointer shadow-sm">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Material Issue Processing</h2>
          <p className="text-sm text-gray-500 font-mono">Request Code: {selectedRequest.code}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-gray-900 uppercase flex items-center gap-2 border-b pb-3">
              <PackageCheck className="w-5 h-5 text-blue-600" /> Source Request Info
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <span className="text-[10px] font-bold text-gray-500 uppercase block">Work Order</span>
                  <span className="text-sm font-bold text-gray-900">{selectedRequest.workOrder?.code || 'N/A'}</span>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-100 col-span-2 flex justify-between items-center">
                  <div>
                      <span className="text-[10px] font-bold text-blue-600 uppercase block">Total Component Types</span>
                      <span className="text-sm font-bold text-gray-900">{selectedRequest._count?.details || 0} Components</span>
                  </div>
                  <Layers className="w-8 h-8 text-blue-200" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
               <h3 className="text-sm font-bold text-gray-900 uppercase flex items-center gap-2">
                 <Filter className="w-5 h-5 text-blue-600" /> FIFO Picking Suggestions
               </h3>
               {isValidating && <Loader2 className="w-5 h-5 animate-spin text-blue-500" />}
            </div>
            <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500 font-semibold border-b">
                    <tr>
                        <th className="p-3 pl-6">Priority</th>
                        <th className="p-3">Component</th>
                        <th className="p-3">Target Lot Code</th>
                        <th className="p-3 text-right">Available</th>
                        <th className="p-3 text-right text-blue-600 pr-6">Required</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {fifoLots.map((lot, idx) => {
                      const isCurrentTarget = idx === currentUnverifiedIndex;
                      return (
                        <tr key={lot.id} className={`transition-colors ${lot.isVerified ? 'bg-green-50/30' : isCurrentTarget ? 'bg-blue-50/50 border-l-4 border-l-blue-500' : 'bg-white opacity-60'}`}>
                            <td className="p-3 pl-6 font-bold text-gray-500">#{lot.priority}</td>
                            <td className="p-3 font-bold text-gray-900">{lot.componentCode}</td>
                            <td className="p-3 font-mono font-bold text-gray-700 flex items-center gap-2">
                                {lot.lotCode} 
                                {lot.isVerified && <CheckCircle2 className="w-4 h-4 text-green-500"/>}
                            </td>
                            <td className="p-3 text-right text-gray-600">{lot.available}</td>
                            <td className="p-3 text-right font-black text-blue-700 pr-6">{lot.suggested}</td>
                        </tr>
                      )
                    })}
                </tbody>
            </table>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-5">
            <h3 className="text-sm font-bold text-gray-900 uppercase flex items-center gap-2 border-b pb-3">
              <Barcode className="w-5 h-5 text-blue-600" /> Lot Verification
            </h3>

            {allVerified ? (
              <div className="py-8 flex flex-col items-center justify-center text-green-600 bg-green-50 rounded-lg border border-green-200 animate-in zoom-in">
                <CheckCircle2 className="w-12 h-12 mb-2" />
                <h4 className="font-bold text-lg">Verification Complete!</h4>
                <p className="text-xs font-medium text-green-700 mt-1">Ready for actual inventory deduction.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                    <div className="text-xs font-bold text-gray-700 uppercase flex justify-between">
                      Scan Target <span className="text-blue-600">Lot #{fifoLots[currentUnverifiedIndex]?.priority}</span>
                    </div>
                    <div className="p-3 bg-gray-100 rounded-lg font-mono text-sm text-center font-bold text-gray-600 border border-gray-200 border-dashed truncate">
                       {fifoLots[currentUnverifiedIndex]?.lotCode || "Loading..."}
                    </div>
                </div>

                <div className="space-y-2 relative">
                    <label className="text-xs font-bold text-gray-700 uppercase">Input / Simulate Scan
                      <input 
                        type="text" autoFocus
                        value={scannedCode} onChange={(e) => setScannedCode(e.target.value)}
                        placeholder="Enter lot code or click button..."
                        className={`w-full p-3 pr-10 border mt-1 
                        rounded-lg text-sm font-mono outline-none focus:ring-2 ${scanError ? 'border-red-400 focus:ring-red-500 bg-red-50' : 'border-gray-300 focus:ring-blue-500'}`}
                        id="simulate-scan"
                        name="simulateScan"
                      />
                    </label>
                    
                    <button 
                      onClick={handleSimulateScan}
                      className="absolute right-2 top-[26px] p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors cursor-pointer"
                    >
                      <Barcode className="w-5 h-5" />
                    </button>
                    {scanError && <p className="text-[11px] text-red-600 font-bold mt-1">{scanError}</p>}
                </div>

                <button 
                  onClick={handleVerify}
                  disabled={!scannedCode.trim()}
                  className="w-full py-3 bg-gray-900 text-white font-bold rounded-lg hover:bg-black transition-colors disabled:opacity-50 cursor-pointer shadow-md"
                >
                  Verify Lot
                </button>
              </div>
            )}
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-3">
             <button onClick={() => window.print()} className="w-full flex items-center justify-center gap-2 py-3 bg-white border border-gray-300 text-gray-700 font-bold rounded-lg hover:bg-gray-50 transition-colors shadow-sm cursor-pointer">
                <Printer className="w-4 h-4" /> Print Issue Slip
             </button>
             <button 
                onClick={handleConfirmIssue}
                disabled={!allVerified || isSubmitting}
                className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow-md transition-all active:scale-95 disabled:opacity-50 disabled:grayscale cursor-pointer"
             >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin"/> : <Send className="w-4 h-4" />} Confirm & Issue
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};