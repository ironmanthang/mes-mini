import { 
  Search, 
  Filter, 
  Plus, 
  Eye, 
  XCircle,
  Loader2,
  PackageSearch,
  Calendar
} from "lucide-react";
import { useState, useEffect, useMemo, type JSX } from "react";
import { NewMaterialRequestModal } from "./NewMaterialRequestModal";
// Giả định bạn sẽ có service này
// import { inventoryTransactionServices, type InventoryTransaction } from "../../../services/inventoryTransactionServices";

const mockRequests = [
  { transaction_id: 1, work_order_id: "WO-2025-001", component_name: "CPU Chipset A1", quantity: 50, transaction_date: "2026-04-27T10:00:00Z", transaction_type: "PENDING_EXPORT", note: "Standard material request" },
  { transaction_id: 2, work_order_id: "WO-2025-001", component_name: "OLED Display 1.5inch", quantity: 10, transaction_date: "2026-04-28T14:30:00Z", transaction_type: "HIGH_APPROVAL_EXPORT", note: "[OVER-REQUEST] Máy dập làm hỏng 10 màn hình" },
  { transaction_id: 3, work_order_id: "WO-2025-002", component_name: "Lithium Battery 400mAh", quantity: 1000, transaction_date: "2026-04-25T08:15:00Z", transaction_type: "EXPORT", note: "Standard material request" },
];

export const MaterialRequests = (): JSX.Element => {
  const [requests, setRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);

  useEffect(() => {
    // TODO: Thay bằng gọi API thực tế
    // inventoryTransactionServices.getAllRequests().then(...)
    setTimeout(() => {
      setRequests(mockRequests);
      setIsLoading(false);
    }, 500);
  }, []);

  const filteredRequests = useMemo(() => {
    return requests.filter(req => {
      const matchSearch = req.work_order_id.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          req.component_name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus = filterStatus === "All" || req.transaction_type === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [requests, searchQuery, filterStatus]);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.toLocaleDateString('vi-VN')} ${d.toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}`;
  };

  const getStatusBadge = (type: string) => {
    switch (type) {
      case 'PENDING_EXPORT': 
        return <span className="px-2.5 py-1 rounded text-xs font-bold bg-yellow-100 text-yellow-700 border border-yellow-200">Pending</span>;
      case 'HIGH_APPROVAL_EXPORT': 
        return <span className="px-2.5 py-1 rounded text-xs font-bold bg-orange-100 text-orange-700 border border-orange-200">High-Approval</span>;
      case 'EXPORT': 
        return <span className="px-2.5 py-1 rounded text-xs font-bold bg-green-100 text-green-700 border border-green-200">Approved</span>;
      default: 
        return <span className="px-2.5 py-1 rounded text-xs font-bold bg-gray-100 text-gray-700">{type}</span>;
    }
  };

  const handleCancel = (id: number) => {
    if(window.confirm("Bạn có chắc chắn muốn hủy yêu cầu này?")) {
        alert(`Đã hủy yêu cầu: REQ-${id.toString().padStart(4, '0')}`);
        // Gọi API Hủy ở đây
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
                placeholder="Search Work Order, Component..." 
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
              >
                <option value="All">All Status</option>
                <option value="PENDING_EXPORT">Pending</option>
                <option value="HIGH_APPROVAL_EXPORT">High Approval</option>
                <option value="EXPORT">Approved (Exported)</option>
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
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500 font-semibold border-b border-gray-200">
                <tr>
                  <th className="p-4">Request Code</th>
                  <th className="p-4">Work Order</th>
                  <th className="p-4">Component</th>
                  <th className="p-4 text-right">Quantity</th>
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
                    const reqCode = `REQ-${req.transaction_id.toString().padStart(4, '0')}`;
                    
                    return (
                        <tr key={req.transaction_id} className="hover:bg-gray-50 transition-colors">
                        <td className="p-4 font-mono font-bold text-blue-600">{reqCode}</td>
                        <td className="p-4 font-bold text-gray-700">{req.work_order_id}</td>
                        <td className="p-4 font-medium text-gray-900">{req.component_name}</td>
                        <td className="p-4 text-right font-bold">{req.quantity}</td>
                        <td className="p-4 text-gray-600 flex items-center gap-1.5 mt-1">
                            <Calendar className="w-3.5 h-3.5" /> {formatDate(req.transaction_date)}
                        </td>
                        <td className="p-4">
                            {isOverLimit ? (
                                <span className="text-xs font-bold text-orange-600">Over-limit</span>
                            ) : (
                                <span className="text-xs font-medium text-gray-600">Standard</span>
                            )}
                        </td>
                        <td className="p-4 text-center">
                            {getStatusBadge(req.transaction_type)}
                        </td>
                        <td className="p-4">
                            <div className="flex items-center justify-center gap-2">
                            <button 
                                onClick={() => alert(`Lý do: ${req.note}`)}
                                className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors cursor-pointer" 
                                title="View Details / Reason"
                            >
                                <Eye className="w-4 h-4" />
                            </button>
                            
                            {(req.transaction_type === 'PENDING_EXPORT' || req.transaction_type === 'HIGH_APPROVAL_EXPORT') && (
                                <button 
                                onClick={() => handleCancel(req.transaction_id)}
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
                    <td colSpan={8} className="p-12 text-center text-gray-400">
                      No material requests found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <NewMaterialRequestModal 
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        onSuccess={() => {}} 
      />
    </div>
  );
};