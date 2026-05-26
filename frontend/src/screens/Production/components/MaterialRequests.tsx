import { 
  Search, 
  Filter, 
  Plus, 
  Eye, 
  Loader2,
  PackageSearch,
  Calendar
} from "lucide-react";
import { useState, useEffect, useMemo, type JSX } from "react";
import { NewMaterialRequestModal } from "./NewMaterialRequestModal";
import { ViewMaterialRequestModal } from "./ViewMaterialRequestModal";
import { MaterialRequestServices, type MaterialRequest } from "../../../services/materialRequestServices";

export const MaterialRequests = (): JSX.Element => {
  const [requests, setRequests] = useState<MaterialRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [viewRequestId, setViewRequestId] = useState<number | null>(null);

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const response = await MaterialRequestServices.getAllMaterialRequests();
      const dataArray = Array.isArray(response) ? response : (response as any).data || [];
      
      const sortedData = dataArray.sort((a: any, b: any) => 
          new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime()
      );
      setRequests(sortedData);
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
        
      const matchStatus = filterStatus === "ALL" || req.status === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [requests, searchQuery, filterStatus]);

  // UI HELPERS
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "N/A";
    const d = new Date(dateStr);
    return `${d.toLocaleDateString('en-US', { day: '2-digit', month: '2-digit', year: 'numeric' })} ${d.toLocaleTimeString('en-US', {hour: '2-digit', minute:'2-digit'})}`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING': 
        return <span className="px-2.5 py-1 rounded text-[11px] font-bold bg-yellow-100 text-yellow-700 border border-yellow-200 uppercase">Pending</span>;
      case 'ISSUED': 
        return <span className="px-2.5 py-1 rounded text-[11px] font-bold bg-green-100 text-green-700 border border-green-200 uppercase">Issued</span>;
      case 'CANCELLED': 
        return <span className="px-2.5 py-1 rounded text-[11px] font-bold bg-gray-100 text-gray-500 border border-gray-200 uppercase">Cancelled</span>;
      default: 
        return <span className="px-2.5 py-1 rounded text-[11px] font-bold bg-gray-100 text-gray-700 uppercase">{status}</span>;
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
            <p className="text-sm text-gray-500 mt-1">Manage and create material request slips automatically based on BOM.</p>
          </div>
          <button 
            onClick={() => setIsNewModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-sm cursor-pointer active:scale-95"
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
                placeholder="Search by Request Code, Work Order..." 
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
                className="bg-transparent text-sm p-1 outline-none text-gray-700 font-bold cursor-pointer"
                id="status-material"
                name="statusMaterial"
              >
                <option value="ALL">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="ISSUED">Issued</option>
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
                  <th className="p-4 pl-6">Request Code</th>
                  <th className="p-4">Work Order</th>
                  <th className="p-4">Request Date</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-gray-100">
                {filteredRequests.length > 0 ? (
                  filteredRequests.map((req) => (
                    <tr key={req.requestId} className="hover:bg-gray-50 transition-colors">
                        <td 
                            className="p-4 pl-6 font-mono font-bold text-blue-600 cursor-pointer hover:underline" 
                            onClick={() => setViewRequestId(req.requestId)}
                        >
                            {req.code}
                        </td>
                        <td className="p-4 font-bold text-gray-700">{req.workOrder?.code || "N/A"}</td>
                        <td className="p-4 text-gray-600 flex items-center gap-1.5 mt-1.5">
                            <Calendar className="w-3.5 h-3.5" /> {formatDate(req.requestDate)}
                        </td>
                        <td className="p-4 text-center">
                            {getStatusBadge(req.status)}
                        </td>
                        <td className="p-4">
                            <div className="flex items-center justify-center gap-2">
                            <button 
                                onClick={() => setViewRequestId(req.requestId)}
                                className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors cursor-pointer" 
                                title="Xem chi tiết phiếu"
                            >
                                <Eye className="w-4 h-4" />
                            </button>
                            

                            </div>
                        </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="p-12 text-center text-gray-400">
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
        onSuccess={() => fetchRequests()} 
      />

      <ViewMaterialRequestModal 
        isOpen={viewRequestId !== null}
        onClose={() => setViewRequestId(null)}
        requestId={viewRequestId}
      />
    </div>
  );
};