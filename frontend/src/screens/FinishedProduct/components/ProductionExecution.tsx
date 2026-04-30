import { 
  Search, PlayCircle, Loader2, Factory,
} from "lucide-react";
import { useState, useEffect, useMemo, type JSX } from "react";
import { WorkOrderServices, type WorkOrderListItem } from "../../../services/workOrderServices";
import { RecordOutputModal } from "./RecordOutputModal";

export const ProductionExecution = (): JSX.Element => {
  const [workOrders, setWorkOrders] = useState<WorkOrderListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Modal State
  const [selectedWO, setSelectedWO] = useState<WorkOrderListItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchActiveWorkOrders = async () => {
    setIsLoading(true);
    try {
      // Chỉ lấy danh sách lệnh đang IN_PROGRESS
      const response = await WorkOrderServices.getAllWorkOrders({ limit: 500, status: 'IN_PROGRESS' });
      setWorkOrders(response.data || []);
    } catch (error) {
      console.error("Failed to fetch active work orders:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveWorkOrders();
  }, []);

  const filteredOrders = useMemo(() => {
    return workOrders.filter(wo => {
      const q = searchQuery.toLowerCase();
      return wo.code.toLowerCase().includes(q) || wo.product.productName.toLowerCase().includes(q);
    });
  }, [workOrders, searchQuery]);

  // Hàm tính toán trạng thái Delay giả lập (so sánh endDate với hiện tại)
  const getStatus = (endDate: string | null) => {
    if (!endDate) return { label: "On Track", color: "bg-green-100 text-green-700 border-green-200" };
    const isDelayed = new Date(endDate) < new Date();
    return isDelayed 
      ? { label: "Delayed", color: "bg-red-100 text-red-700 border-red-200" }
      : { label: "On Track", color: "bg-green-100 text-green-700 border-green-200" };
  };

  return (
    <div className="flex flex-col gap-6 pb-12 animate-in fade-in duration-300">
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm flex flex-col min-h-[500px]">
        
        {/* HEADER */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 rounded-t-lg">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Factory className="w-6 h-6 text-blue-600" />
              Production Execution
            </h2>
            <p className="text-sm text-gray-500 mt-1">Record production output and deduct component inventory in real time.</p>
          </div>
        </div>

        {/* TOOLBAR */}
        <div className="p-4 border-b border-gray-200 flex flex-wrap items-center justify-between gap-4">
          <div className="relative w-80">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search WO Code, Product Name..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" 
            />
          </div>
        </div>

        {/* TABLE */}
        <div className="flex-1 overflow-x-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500 font-semibold border-b border-gray-200">
                <tr>
                  <th className="p-4">WO Code</th>
                  <th className="p-4">Product Details</th>
                  <th className="p-4 text-center">Output Target</th>
                  <th className="p-4 w-48">Progress</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-gray-100">
                {filteredOrders.length > 0 ? (
                  filteredOrders.map((wo) => {
                    const statusConfig = getStatus(wo.endDate);
                    // Giả lập số lượng Produced (BE hiện chưa trả trực tiếp field này ở list, nếu có thì thay thế)
                    const produced = 0; 
                    const progressPercent = Math.min(100, Math.round((produced / wo.quantity) * 100));

                    return (
                      <tr key={wo.workOrderId} className="hover:bg-gray-50 transition-colors">
                        <td className="p-4 font-mono font-bold text-gray-900 cursor-pointer hover:text-blue-600 transition-colors">{wo.code}</td>
                        <td className="p-4">
                          <span className="font-bold text-gray-800 block">{wo.product.productName}</span>
                          <span className="text-xs text-gray-500 font-mono mt-0.5">{wo.product.code}</span>
                        </td>
                        <td className="p-4 text-center font-bold">
                           <span className="text-blue-600">{produced}</span> <span className="text-gray-400 mx-1">/</span> {wo.quantity} <span className="text-xs font-normal text-gray-500">{wo.product.unit}</span>
                        </td>
                        <td className="p-4">
                            <div className="flex items-center gap-2">
                                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                    <div className={`h-full rounded-full transition-all duration-500 ${progressPercent === 100 ? 'bg-green-500' : 'bg-blue-500'}`} style={{ width: `${progressPercent}%` }}></div>
                                </div>
                                <span className="text-xs font-bold text-gray-600 w-8">{progressPercent}%</span>
                            </div>
                        </td>
                        <td className="p-4 text-center">
                            <span className={`px-2.5 py-1.5 rounded text-[10px] font-bold uppercase border ${statusConfig.color}`}>
                                {statusConfig.label}
                            </span>
                        </td>
                        <td className="p-4 text-center">
                          <button 
                            onClick={() => { setSelectedWO(wo); setIsModalOpen(true); }}
                            className="flex items-center justify-center mx-auto gap-1.5 px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-sm text-xs cursor-pointer active:scale-95"
                          >
                            <PlayCircle className="w-3.5 h-3.5" /> Record Output
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-gray-400">
                      Không có lệnh sản xuất nào đang chạy (In Progress).
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {selectedWO && (
          <RecordOutputModal 
              isOpen={isModalOpen}
              onClose={() => { setIsModalOpen(false); setSelectedWO(null); }}
              onSuccess={fetchActiveWorkOrders}
              workOrder={selectedWO}
          />
      )}
    </div>
  );
};