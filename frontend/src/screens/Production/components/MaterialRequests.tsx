import { 
  Search, 
  Filter, 
  Plus, 
  Eye, 
  XCircle,
  Loader2,
  PackageSearch,
  Calendar,
  Layers
} from "lucide-react";
import { useState, useEffect, useMemo, type JSX } from "react";
import { NewMaterialRequestModal } from "./NewMaterialRequestModal";
import { MaterialRequestServices, type MaterialRequest } from "../../../services/materialRequestServices";

export const MaterialRequests = (): JSX.Element => {
  const [requests, setRequests] = useState<MaterialRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);

  // FETCH DATA TỪ API THẬT
  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      // Gọi API lấy toàn bộ Material Requests (không truyền status để lấy All)
      const response = await MaterialRequestServices.getAllMaterialRequests();
      // Xử lý an toàn định dạng trả về (Array hoặc Object có chứa data)
      const dataArray = Array.isArray(response) ? response : (response as any).data || [];
      setRequests(dataArray);
    } catch (error) {
      console.error("Failed to fetch material requests:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  // LỌC DỮ LIỆU
  const filteredRequests = useMemo(() => {
    return requests.filter(req => {
      const searchStr = searchQuery.toLowerCase();
      const matchSearch = 
        req.code?.toLowerCase().includes(searchStr) || 
        req.workOrder?.code?.toLowerCase().includes(searchStr);
        
      const matchStatus = filterStatus === "All" || req.status === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [requests, searchQuery, filterStatus]);

  // UI HELPERS
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "N/A";
    const d = new Date(dateStr);
    return `${d.toLocaleDateString('vi-VN')} ${d.toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}`;
  };

  const getStatusBadge = (status: string, note?: string) => {
    const isOverLimit = note?.includes("[OVER-REQUEST]");
    
    // Logic mới kết hợp Status của BE và Note [OVER-REQUEST]
    if (status === 'PENDING') {
        if (isOverLimit) return <span className="px-2.5 py-1 rounded text-xs font-bold bg-orange-100 text-orange-700 border border-orange-200">High-Approval</span>;
        return <span className="px-2.5 py-1 rounded text-xs font-bold bg-yellow-100 text-yellow-700 border border-yellow-200">Pending</span>;
    }
    
    switch (status) {
      case 'ISSUED': 
        return <span className="px-2.5 py-1 rounded text-xs font-bold bg-green-100 text-green-700 border border-green-200">Issued</span>;
      case 'CANCELLED': 
        return <span className="px-2.5 py-1 rounded text-xs font-bold bg-gray-100 text-gray-500 border border-gray-200">Cancelled</span>;
      default: 
        return <span className="px-2.5 py-1 rounded text-xs font-bold bg-gray-100 text-gray-700">{status}</span>;
    }
  };

  // ACTION
  const handleCancel = async (id: number, code: string) => {
    if(window.confirm(`Bạn có chắc chắn muốn hủy phiếu yêu cầu: ${code}?`)) {
        try {
            // Giả định bạn sẽ bổ sung API cancel vào file materialRequestServices.ts sau
            // await MaterialRequestServices.cancelMaterialRequest(id);
            alert(`Đã hủy phiếu yêu cầu: ${code}`);
            fetchRequests(); // Reload list
        } catch (error: any) {
            alert(error?.response?.data?.message || "Lỗi khi hủy yêu cầu.");
        }
    }
  };

  return (
    <div className="flex flex-col gap-6 pb-12 animate-in fade-in duration-300">
      
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm flex flex-col min-h-[500px]">
        
        {/* HEADER & TOOLBAR */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 rounded-t-lg">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <PackageSearch className="w-6 h-6 text-blue-600" />
              Material Requests
            </h2>
            <p className="text-sm text-gray-500 mt-1">Gửi yêu cầu xuất linh kiện cho Lệnh sản xuất.</p>
          </div>
          <button 
            onClick={() => setIsNewModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-500 transition-colors shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" /> New Request
          </button>
        </div>

        <div className="p-4 border-b border-gray-200 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <div className="relative w-80">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search Request Code, Work Order..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" 
              />
            </div>
            
            <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-lg border border-gray-200">
              <Filter className="w-4 h-4 text-gray-500 ml-2" />
              <select 
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-transparent text-sm p-1 outline-none text-gray-700 font-medium cursor-pointer"
                id="status-material"
                name="statusMaterial"
              >
                <option value="All">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="ISSUED">Issued (Approved)</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          </div>
        </div>

        {/* LIST TABLE */}
        <div className="flex-1 overflow-x-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : (
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500 font-semibold border-b border-gray-200">
                <tr>
                  <th className="p-4">Request Code</th>
                  <th className="p-4">Work Order</th>
                  <th className="p-4 text-center">Total Items</th>
                  <th className="p-4">Request Date</th>
                  <th className="p-4">Type</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-gray-100">
                {filteredRequests.length > 0 ? (
                  filteredRequests.map((req) => {
                    const isOverLimit = req.note?.includes("[OVER-REQUEST]");
                    
                    return (
                        <tr key={req.requestId} className="hover:bg-gray-50 transition-colors">
                            <td className="p-4 font-mono font-bold text-blue-600">{req.code}</td>
                            <td className="p-4 font-bold text-gray-700">{req.workOrder?.code || "N/A"}</td>
                            <td className="p-4 text-center">
                                <span className="inline-flex items-center justify-center gap-1 bg-gray-100 text-gray-700 font-bold px-2.5 py-1 rounded text-xs border border-gray-200">
                                    <Layers className="w-3.5 h-3.5" /> {req._count?.details || 0}
                                </span>
                            </td>
                            <td className="p-4 text-gray-600 flex items-center gap-1.5 mt-1.5">
                                <Calendar className="w-3.5 h-3.5" /> {formatDate(req.requestDate)}
                            </td>
                            <td className="p-4">
                                {isOverLimit ? (
                                    <span className="text-xs font-bold text-orange-600">Over-limit</span>
                                ) : (
                                    <span className="text-xs font-medium text-gray-600">Standard</span>
                                )}
                            </td>
                            <td className="p-4 text-center">
                                {getStatusBadge(req.status, req.note)}
                            </td>
                            <td className="p-4">
                                <div className="flex items-center justify-center gap-2">
                                <button 
                                    onClick={() => alert(`Chi tiết Ghi chú:\n${req.note || 'Không có ghi chú'}`)}
                                    className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors cursor-pointer" 
                                    title="View Note / Reason"
                                >
                                    <Eye className="w-4 h-4" />
                                </button>
                                
                                {req.status === 'PENDING' && (
                                    <button 
                                      onClick={() => handleCancel(req.requestId, req.code)}
                                      className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer" 
                                      title="Cancel Request"
                                    >
                                    <XCircle className="w-4 h-4" />
                                    </button>
                                )}
                                </div>
                            </td>
                        </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="p-12 text-center text-gray-400">
                      No material requests found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* MODAL TẠO MỚI (Giữ nguyên hoặc truyền hàm onSuccess để fetch lại data) */}
      <NewMaterialRequestModal 
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        onSuccess={() => fetchRequests()} 
      />
    </div>
  );
};