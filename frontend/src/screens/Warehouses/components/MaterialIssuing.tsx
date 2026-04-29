import { 
  Search, 
  Filter, 
  ArrowLeft, 
  PackageCheck, 
  AlertTriangle, 
  Barcode, 
  CheckCircle2, 
  XCircle, 
  Printer, 
  Send,
  Loader2,
  Calendar,
  MapPin,
  X
} from "lucide-react";
import { useState, useEffect, useMemo, type JSX } from "react";

// --- INTERFACES ---
interface MaterialRequest {
  transaction_id: number;
  work_order_id: string;
  component_name: string;
  quantity: number;
  transaction_date: string;
  transaction_type: 'PENDING_EXPORT' | 'HIGH_APPROVAL_EXPORT';
  note: string;
}

interface FifoLot {
  id: number;
  priority: number;
  lotCode: string;
  location: string;
  inboundDate: string;
  available: number;
  suggested: number;
  isVerified: boolean;
}

// --- MOCK DATA ---
const mockPendingRequests: MaterialRequest[] = [
  { transaction_id: 1001, work_order_id: "WO-2025-001", component_name: "CPU Chipset A1", quantity: 150, transaction_date: "2026-04-27T10:00:00Z", transaction_type: "PENDING_EXPORT", note: "Standard material request" },
  { transaction_id: 1002, work_order_id: "WO-2025-001", component_name: "OLED Display 1.5inch", quantity: 10, transaction_date: "2026-04-28T14:30:00Z", transaction_type: "HIGH_APPROVAL_EXPORT", note: "[OVER-REQUEST] Máy dập làm hỏng 10 màn hình. Xin xuất bù." },
];

export const MaterialIssuing = (): JSX.Element => {
  // State Màn hình (List = null, Detail = Object)
  const [selectedRequest, setSelectedRequest] = useState<MaterialRequest | null>(null);
  
  // State cho List View
  const [requests, setRequests] = useState<MaterialRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");

  // State cho Processing View (Detail)
  const [fifoLots, setFifoLots] = useState<FifoLot[]>([]);
  const [scannedCode, setScannedCode] = useState("");
  const [scanError, setScanError] = useState("");
  const [actualQty, setActualQty] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State cho Reject Modal
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  // INIT DATA
  useEffect(() => {
    setTimeout(() => {
      setRequests(mockPendingRequests);
      setIsLoading(false);
    }, 500);
  }, []);

  // INIT MOCK FIFO LOTS KHI CHỌN REQUEST (GIẢ LẬP BE TÍNH TOÁN)
  useEffect(() => {
    if (selectedRequest) {
      setActualQty(selectedRequest.quantity); // Mặc định fill số lượng thực tế
      setScannedCode("");
      setScanError("");
      
      // Giả lập BE trả về các lô hàng theo nguyên tắc FIFO để gom đủ số lượng
      const mockLots: FifoLot[] = [
        { id: 1, priority: 1, lotCode: `LOT-${selectedRequest.transaction_id}-A`, location: "WH-MAIN / Rack-A1", inboundDate: "2025-10-01", available: 100, suggested: Math.min(100, selectedRequest.quantity), isVerified: false },
      ];
      
      if (selectedRequest.quantity > 100) {
        mockLots.push({ id: 2, priority: 2, lotCode: `LOT-${selectedRequest.transaction_id}-B`, location: "WH-MAIN / Rack-C3", inboundDate: "2025-11-15", available: 200, suggested: selectedRequest.quantity - 100, isVerified: false });
      }
      setFifoLots(mockLots);
    }
  }, [selectedRequest]);

  // ==========================================
  // LOGIC XỬ LÝ (SCAN & VERIFY) - GIAI ĐOẠN 3
  // ==========================================
  const currentUnverifiedIndex = fifoLots.findIndex(lot => !lot.isVerified);
  const allVerified = fifoLots.length > 0 && currentUnverifiedIndex === -1;

  const handleVerify = () => {
    setScanError("");
    if (currentUnverifiedIndex === -1) return;

    const targetLot = fifoLots[currentUnverifiedIndex];
    
    if (scannedCode.trim() === targetLot.lotCode) {
      // Khớp mã -> Cập nhật trạng thái
      const newLots = [...fifoLots];
      newLots[currentUnverifiedIndex].isVerified = true;
      setFifoLots(newLots);
      setScannedCode(""); // Clear input cho lô tiếp theo
    } else {
      // Sai mã
      setScanError("Mismatch! Mã lô không khớp với đề xuất FIFO. Vui lòng quét lại.");
    }
  };

  const handleSimulateScan = () => {
    if (currentUnverifiedIndex !== -1) {
      const targetLot = fifoLots[currentUnverifiedIndex];
      setScannedCode(targetLot.lotCode);
      setScanError("");
      // Không gọi verify ngay để người dùng nhìn thấy mã được điền, nhưng có thể gọi luôn nếu muốn
    }
  };

  // ==========================================
  // HOÀN TẤT & TỪ CHỐI - GIAI ĐOẠN 4
  // ==========================================
  const handleConfirmIssue = async () => {
    if (!allVerified) return alert("Vui lòng xác thực toàn bộ các lô hàng trước khi xuất kho!");
    if (actualQty <= 0) return alert("Số lượng xuất kho phải lớn hơn 0");

    setIsSubmitting(true);
    try {
      // Gọi API: PUT /inventory-transactions/{id}/issue
      console.log("Submitting:", {
        transaction_id: selectedRequest?.transaction_id,
        lots_used: fifoLots.map(l => ({ lotCode: l.lotCode, qty: l.suggested })),
        actual_qty: actualQty
      });
      await new Promise(resolve => setTimeout(resolve, 800)); // Giả lập mạng
      
      alert("Xuất kho thành công!");
      // F5 lại list
      setRequests(prev => prev.filter(r => r.transaction_id !== selectedRequest?.transaction_id));
      setSelectedRequest(null);
    } catch (e) {
      alert("Lỗi khi xuất kho.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = () => {
    if (!rejectReason.trim()) return alert("Vui lòng nhập lý do từ chối!");
    
    // Gọi API từ chối
    alert(`Đã từ chối yêu cầu. Lý do: ${rejectReason}`);
    setRequests(prev => prev.filter(r => r.transaction_id !== selectedRequest?.transaction_id));
    setShowRejectModal(false);
    setSelectedRequest(null);
  };


  // ==========================================
  // VIEW RENDERERS
  // ==========================================
  const filteredRequests = useMemo(() => {
    return requests.filter(req => {
      const searchStr = searchQuery.toLowerCase();
      const matchSearch = `REQ-${req.transaction_id.toString().padStart(4, '0')}`.toLowerCase().includes(searchStr) || 
                          req.work_order_id.toLowerCase().includes(searchStr);
      const matchStatus = filterStatus === "All" || req.transaction_type === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [requests, searchQuery, filterStatus]);

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
              <p className="text-sm text-gray-500 mt-1">Xác thực và xuất kho linh kiện phục vụ sản xuất.</p>
            </div>
          </div>

          <div className="p-4 border-b border-gray-200 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1">
              <div className="relative w-80">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <input 
                  type="text" placeholder="Search Request Code, Work Order..." 
                  value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" 
                />
              </div>
              <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-lg border border-gray-200">
                <Filter className="w-4 h-4 text-gray-500 ml-2" />
                <select 
                  value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
                  className="bg-transparent text-sm p-1 outline-none text-gray-700 font-medium cursor-pointer"
                >
                  <option value="All">All Pending</option>
                  <option value="PENDING_EXPORT">Standard (Pending)</option>
                  <option value="HIGH_APPROVAL_EXPORT">Over-limit (High Approval)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-x-auto">
            {isLoading ? (
              <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500 font-semibold border-b border-gray-200">
                  <tr>
                    <th className="p-4">Request Code</th>
                    <th className="p-4">Work Order</th>
                    <th className="p-4">Component</th>
                    <th className="p-4 text-right">Requested Qty</th>
                    <th className="p-4">Request Date</th>
                    <th className="p-4 text-center">Type</th>
                    <th className="p-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-gray-100">
                  {filteredRequests.map((req) => {
                    const isOverLimit = req.note?.includes("[OVER-REQUEST]");
                    return (
                      <tr key={req.transaction_id} className="hover:bg-gray-50 transition-colors">
                        <td className="p-4 font-mono font-bold text-blue-600">REQ-{req.transaction_id.toString().padStart(4, '0')}</td>
                        <td className="p-4 font-bold text-gray-700">{req.work_order_id}</td>
                        <td className="p-4 font-medium text-gray-900">{req.component_name}</td>
                        <td className="p-4 text-right font-bold text-blue-700">{req.quantity}</td>
                        <td className="p-4 text-gray-600 flex items-center gap-1.5 mt-1">
                            <Calendar className="w-3.5 h-3.5" /> {new Date(req.transaction_date).toLocaleDateString('vi-VN')}
                        </td>
                        <td className="p-4 text-center">
                            {isOverLimit 
                              ? <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-100 text-orange-700 uppercase">Over-limit</span>
                              : <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-600 uppercase">Standard</span>
                            }
                        </td>
                        <td className="p-4 text-center">
                          <button 
                            onClick={() => setSelectedRequest(req)}
                            className="px-4 py-1.5 bg-blue-50 text-blue-600 font-bold rounded hover:bg-blue-600 hover:text-white transition-colors text-xs cursor-pointer border border-blue-200"
                          >
                            Process
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredRequests.length === 0 && <tr><td colSpan={7} className="p-12 text-center text-gray-400">No pending requests found.</td></tr>}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    );
  }

  // --- MÀN HÌNH 2: XỬ LÝ CHI TIẾT (PROCESSING VIEW) ---
  const isOverLimit = selectedRequest.note?.includes("[OVER-REQUEST]");

  return (
    <div className="flex flex-col gap-6 pb-20 animate-in slide-in-from-right-4 duration-300">
      
      {/* TOOLBAR BACK */}
      <div className="flex items-center gap-4">
        <button onClick={() => setSelectedRequest(null)} className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-gray-600 cursor-pointer">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Material Issue Processing</h2>
          <p className="text-sm text-gray-500 font-mono">Request: REQ-{selectedRequest.transaction_id.toString().padStart(4, '0')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* CỘT TRÁI (ZONE 1 & 2) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* VÙNG 1: REQUEST HEADER */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-gray-900 uppercase flex items-center gap-2 border-b pb-3">
              <PackageCheck className="w-5 h-5 text-blue-600" /> Zone 1: Request Information
            </h3>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <span className="text-[10px] font-bold text-gray-500 uppercase block">Work Order</span>
                  <span className="text-sm font-bold text-gray-900">{selectedRequest.work_order_id}</span>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-100 col-span-2">
                  <span className="text-[10px] font-bold text-blue-600 uppercase block">Component</span>
                  <span className="text-sm font-bold text-gray-900">{selectedRequest.component_name}</span>
              </div>
            </div>

            {isOverLimit && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3 mt-4 animate-in zoom-in">
                <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-red-800 uppercase tracking-wide">Cảnh báo: Yêu cầu vượt định mức</h4>
                  <p className="text-sm text-red-700 mt-1 font-medium">{selectedRequest.note}</p>
                </div>
              </div>
            )}
          </div>

          {/* VÙNG 2: FIFO PICKING TABLE */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100">
               <h3 className="text-sm font-bold text-gray-900 uppercase flex items-center gap-2">
                 <Filter className="w-5 h-5 text-blue-600" /> Zone 2: FIFO Picking Suggestions
               </h3>
               <p className="text-xs text-gray-500 mt-1">Hệ thống đề xuất các lô hàng cũ nhất cần được xuất trước.</p>
            </div>
            <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500 font-semibold border-b">
                    <tr>
                        <th className="p-3 pl-6">Priority</th>
                        <th className="p-3">Lot Code</th>
                        <th className="p-3">Location</th>
                        <th className="p-3">Inbound Date</th>
                        <th className="p-3 text-right">Available</th>
                        <th className="p-3 text-right text-blue-600 pr-6">Suggested</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {fifoLots.map((lot, idx) => {
                      const isCurrentTarget = idx === currentUnverifiedIndex;
                      return (
                        <tr key={lot.id} className={`transition-colors ${lot.isVerified ? 'bg-green-50/30' : isCurrentTarget ? 'bg-blue-50/50 border-l-4 border-l-blue-500' : 'bg-white opacity-60'}`}>
                            <td className="p-3 pl-6 font-bold text-gray-500">#{lot.priority}</td>
                            <td className="p-3 font-mono font-bold text-gray-900 flex items-center gap-2">
                                {lot.lotCode} 
                                {lot.isVerified && <CheckCircle2 className="w-4 h-4 text-green-500"/>}
                            </td>
                            <td className="p-3 text-gray-600 flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-gray-400"/> {lot.location}</td>
                            <td className="p-3 text-gray-600">{new Date(lot.inboundDate).toLocaleDateString('vi-VN')}</td>
                            <td className="p-3 text-right text-gray-600">{lot.available}</td>
                            <td className="p-3 text-right font-black text-blue-700 pr-6">{lot.suggested}</td>
                        </tr>
                      )
                    })}
                </tbody>
            </table>
            <div className="p-4 bg-gray-50 border-t flex justify-end font-bold text-gray-900 text-sm">
               Total Requested Qty: <span className="text-blue-600 ml-2">{selectedRequest.quantity}</span>
            </div>
          </div>
        </div>

        {/* CỘT PHẢI (ZONE 3 & 4) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* VÙNG 3: SIMULATED LOT VERIFICATION */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-5">
            <h3 className="text-sm font-bold text-gray-900 uppercase flex items-center gap-2 border-b pb-3">
              <Barcode className="w-5 h-5 text-blue-600" /> Zone 3: Verification
            </h3>

            {allVerified ? (
              <div className="py-8 flex flex-col items-center justify-center text-green-600 bg-green-50 rounded-lg border border-green-200 animate-in zoom-in">
                <CheckCircle2 className="w-12 h-12 mb-2" />
                <h4 className="font-bold text-lg">All Lots Verified!</h4>
                <p className="text-xs font-medium text-green-700 mt-1">Ready for confirmation.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-700 uppercase flex justify-between">
                      Scan Target <span className="text-blue-600">Lot #{fifoLots[currentUnverifiedIndex]?.priority}</span>
                    </label>
                    <div className="p-3 bg-gray-100 rounded-lg font-mono text-sm text-center font-bold text-gray-600 border border-gray-200 border-dashed">
                       {fifoLots[currentUnverifiedIndex]?.lotCode}
                    </div>
                </div>

                <div className="space-y-2 relative">
                    <label className="text-xs font-bold text-gray-700 uppercase">Input / Simulate Scan</label>
                    <input 
                      type="text" 
                      value={scannedCode} 
                      onChange={(e) => setScannedCode(e.target.value)}
                      placeholder="Nhập mã lô hoặc bấm nút mô phỏng..."
                      className={`w-full p-3 pr-10 border rounded-lg text-sm font-mono outline-none focus:ring-2 ${scanError ? 'border-red-400 focus:ring-red-500 bg-red-50' : 'border-gray-300 focus:ring-blue-500'}`}
                    />
                    <button 
                      onClick={handleSimulateScan}
                      className="absolute right-2 top-[26px] p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors cursor-pointer"
                      title="Mô phỏng quét mã vạch (Auto-fill)"
                    >
                      <Barcode className="w-5 h-5" />
                    </button>
                    {scanError && <p className="text-[11px] text-red-600 font-bold mt-1 animate-in slide-in-from-top-1">{scanError}</p>}
                </div>

                <button 
                  onClick={handleVerify}
                  disabled={!scannedCode.trim()}
                  className="w-full py-3 bg-gray-900 text-white font-bold rounded-lg hover:bg-black transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
                >
                  Verify Lot
                </button>
              </div>
            )}

            <div className="pt-4 border-t border-gray-100 space-y-2">
                <label className="text-xs font-bold text-gray-700 uppercase">Actual Issued Qty</label>
                <input 
                  type="number" min="1" 
                  value={actualQty} onChange={(e) => setActualQty(Number(e.target.value))}
                  className="w-full p-3 border border-gray-300 rounded-lg text-lg font-black text-blue-700 text-center outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>
          </div>

          {/* VÙNG 4: FOOTER ACTIONS */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-3">
             <button 
                className="w-full flex items-center justify-center gap-2 py-3 bg-white border border-gray-300 text-gray-700 font-bold rounded-lg hover:bg-gray-50 transition-colors cursor-pointer shadow-sm"
                onClick={() => window.print()}
             >
                <Printer className="w-4 h-4" /> Print Issue Slip
             </button>
             
             <div className="grid grid-cols-2 gap-3 pt-3">
                <button 
                  onClick={() => setShowRejectModal(true)}
                  className="flex items-center justify-center gap-2 py-3 bg-white border border-red-200 text-red-600 font-bold rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                >
                   <XCircle className="w-4 h-4" /> Reject
                </button>
                <button 
                  onClick={handleConfirmIssue}
                  disabled={!allVerified || isSubmitting}
                  className="flex items-center justify-center gap-2 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow-md transition-all active:scale-95 disabled:opacity-50 disabled:grayscale cursor-pointer"
                >
                   {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin"/> : <Send className="w-4 h-4" />} Confirm
                </button>
             </div>
          </div>

        </div>
      </div>

      {/* POPUP TỪ CHỐI */}
      {showRejectModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-white w-[400px] p-6 rounded-xl shadow-2xl animate-in fade-in zoom-in duration-200">
                <h3 className="text-lg font-bold text-gray-900 mb-2">Từ chối Yêu cầu</h3>
                <p className="text-sm text-gray-600 mb-4">Vui lòng nhập lý do từ chối yêu cầu xuất kho này để báo lại cho Trưởng dây chuyền.</p>
                <textarea 
                  value={rejectReason} onChange={e => setRejectReason(e.target.value)}
                  placeholder="Lý do từ chối..." rows={3}
                  className="w-full p-3 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-red-500 mb-4 resize-none"
                />
                <div className="flex justify-end gap-3">
                    <button onClick={() => setShowRejectModal(false)} className="px-5 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 cursor-pointer">Hủy</button>
                    <button onClick={handleReject} className="px-5 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 shadow-sm cursor-pointer">Xác nhận Từ chối</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};